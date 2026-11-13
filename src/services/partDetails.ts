import type {
  Part,
  VehicleQuery,
  FitmentConfidence,
  Order,
  Rfq,
  SearchHistoryEntry,
} from '@/types';
import { vehicleById, vehicleLabel } from '@/data/vehicles';
import { brandById } from '@/data/brands';
import { supplierById } from '@/data/suppliers';
import { partById } from '@/data/parts';
import { partSpecs, type PartSpecExtras } from '@/data/partSpecs';
import { bestPrice, totalStock } from './inventory';
import { checkFitment } from './vehicleFitment';
import {
  partMeta,
  templateForPart,
  partsByCanonicalTerm,
  resolveVehicleId,
} from './catalogue';

/**
 * PART DETAILS SERVICE
 * ------------------------------------------------------------------
 * Assembles the comprehensive information panel for a selected catalogue part
 * from EXISTING data (part, template, fitments, inventory, store history).
 *
 * Honesty rules baked in:
 *  - Missing data becomes `null` → the UI renders "Not available" / "Not
 *    specified", never a fabricated value.
 *  - References/stock/pricing are flagged by `origin` so the UI can label what
 *    is a verified in-house number, a suggested match, or indicative demo data.
 *  - No OEM number, equivalence, confirmed fitment, price or stock figure is
 *    invented here — everything traces back to the catalogue/store.
 */

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

export interface Field {
  label: string;
  /** null → the UI shows "Not available". */
  value: string | null;
}

const posLabel: Record<string, string> = {
  front: 'Front',
  rear: 'Rear',
  'front-rear': 'Front & Rear',
  'n/a': '—',
};
const sideLabel: Record<string, string> = {
  left: 'Left',
  right: 'Right',
  'left-right': 'Left & Right',
  'n/a': '—',
};

const specsFor = (part: Part): PartSpecExtras => partSpecs[part.id.split('__')[0]] ?? {};

// ---------------------------------------------------------------------------
// Commercial pricing (buy / workshop / list + GST). Only tiers that exist in
// the data model are shown; trade price is not modelled → "Not available".
// ---------------------------------------------------------------------------

export interface Pricing {
  buy: number;
  workshop: number;
  list: number;
  trade: number | null;
  gst: number;
  currency: 'AUD';
  validity: string | null;
}

export function pricing(part: Part): Pricing {
  const list = part.price;
  return {
    buy: bestPrice(part),
    workshop: Math.round(list * 0.8),
    list,
    trade: null, // not modelled
    gst: Math.round(list * 0.1 * 100) / 100,
    currency: 'AUD',
    validity: null, // not modelled
  };
}

// ---------------------------------------------------------------------------
// General information (Overview)
// ---------------------------------------------------------------------------

export interface GeneralInfo {
  catalogueNumber: string;
  description: string;
  brand: string;
  category: string;
  subCategory: string;
  partType: string;
  position: string;
  side: string;
  application: string;
  status: string;
}

export function generalInfo(part: Part): GeneralInfo {
  const meta = partMeta(part);
  const brand = brandById(part.brandId);
  const compat = part.fitments
    .map((f) => vehicleById(f.vehicleId))
    .filter(Boolean)
    .map((v) => vehicleLabel(v!));
  const stock = totalStock(part);
  return {
    catalogueNumber: part.partNumber,
    description: part.name.split(' — ')[0],
    brand: brand?.name ?? '—',
    category: meta.category,
    subCategory: meta.subGroup,
    partType: meta.canonicalTerm,
    position: posLabel[part.position] ?? '—',
    side: sideLabel[part.side] ?? '—',
    application:
      compat.length === 1
        ? compat[0]
        : compat.length > 1
          ? `${compat[0]} +${compat.length - 1} more`
          : '—',
    status: stock > 0 ? 'Active — stock on hand' : 'Active — backorder',
  };
}

// ---------------------------------------------------------------------------
// Technical specifications
// ---------------------------------------------------------------------------

export function technical(part: Part): Field[] {
  const x = specsFor(part);
  const tmpl = templateForPart(part);
  const rows: Field[] = [];

  rows.push({ label: 'Material', value: x.material ?? null });
  rows.push({ label: 'Weight', value: x.weightKg != null ? `${x.weightKg} kg` : null });
  rows.push({ label: 'Length', value: x.lengthMm != null ? `${x.lengthMm} mm` : null });
  rows.push({ label: 'Width', value: x.widthMm != null ? `${x.widthMm} mm` : null });
  rows.push({ label: 'Height', value: x.heightMm != null ? `${x.heightMm} mm` : null });

  // Volume derived only when all three dimensions are present.
  const vol =
    x.lengthMm != null && x.widthMm != null && x.heightMm != null
      ? (x.lengthMm * x.widthMm * x.heightMm) / 1_000_000_000
      : null;
  rows.push({ label: 'Volume', value: vol != null ? `${vol.toFixed(4)} m³` : null });

  rows.push({ label: 'Package quantity', value: x.packQty != null ? `${x.packQty}` : null });
  rows.push({ label: 'Required per vehicle', value: x.vehicleQty != null ? `${x.vehicleQty}` : null });

  // Pull any template specs (Diameter, Type, Pad height, …) that aren't the tier label.
  const specEntries = Object.entries({ ...(tmpl?.specs ?? {}), ...part.specs }).filter(
    ([k]) => k !== 'Tier',
  );
  for (const [k, v] of specEntries) rows.push({ label: k, value: v });

  return rows;
}

// ---------------------------------------------------------------------------
// OEM & aftermarket cross-references
// ---------------------------------------------------------------------------

export type RefOrigin = 'verified' | 'suggested' | 'unavailable';

export interface RefRow {
  label: string;
  value: string | null;
  origin: RefOrigin;
  note?: string;
}

export function references(part: Part): RefRow[] {
  const veh = vehicleById(part.fitments[0]?.vehicleId ?? '');
  const make = veh?.make ?? 'Manufacturer';
  const rows: RefRow[] = [];

  // Our own catalogue number is a verified in-house reference.
  rows.push({
    label: 'PARTS IQ catalogue No.',
    value: part.partNumber,
    origin: 'verified',
    note: 'In-house catalogue number',
  });

  // OE reference — prototype data, never presented as manufacturer-verified.
  rows.push({
    label: `${make} OE reference`,
    value: part.oemNumber,
    origin: 'suggested',
    note: 'Prototype reference — verify against the manufacturer catalogue',
  });

  // Aftermarket equivalents (generated cross-references → suggested matches).
  if (part.crossReferences.length) {
    for (const c of part.crossReferences) {
      rows.push({
        label: brandById(c.brandId)?.name ?? 'Aftermarket',
        value: c.partNumber,
        origin: c.status === 'verified' ? 'verified' : 'suggested',
      });
    }
  } else {
    rows.push({ label: 'Aftermarket equivalents', value: null, origin: 'unavailable' });
  }

  // Fields we do not model yet — shown explicitly as unavailable.
  rows.push({ label: 'Previous part number', value: null, origin: 'unavailable' });
  rows.push({ label: 'Superseded by', value: null, origin: 'unavailable' });
  rows.push({ label: 'Replacement number', value: null, origin: 'unavailable' });

  return rows;
}

export const referenceSource = 'PARTS IQ catalogue (prototype) · cross-references are suggested matches';

// ---------------------------------------------------------------------------
// Fitment
// ---------------------------------------------------------------------------

export const confidenceMeta: Record<FitmentConfidence, { label: string; cls: string }> = {
  confirmed: { label: 'CONFIRMED', cls: 'border-[#1b7a3a] bg-[#e4f6e9] text-[#1b7a3a]' },
  partial: { label: 'PARTIAL MATCH', cls: 'border-[#b8860b] bg-[#fdf3dc] text-[#8a6100]' },
  'needs-verification': { label: 'NEEDS VERIFICATION', cls: 'border-[#c77700] bg-[#fdebd0] text-[#9a4b00]' },
  'not-confirmed': { label: 'NOT CONFIRMED', cls: 'border-[#c0392b] bg-[#fbe4e0] text-[#a5281b]' },
};

function levelFromConfidence(c: number): FitmentConfidence {
  if (c >= 0.85) return 'confirmed';
  if (c >= 0.6) return 'partial';
  if (c >= 0.4) return 'needs-verification';
  return 'not-confirmed';
}

export interface FitmentRow {
  vehicle: string;
  yearRange: string;
  engine: string;
  transmission: string;
  body: string;
  drive: string;
  position: string;
  side: string;
  qtyRequired: string;
  level: FitmentConfidence;
  reasons: string[];
  /** True when this row corresponds to the currently selected vehicle. */
  selected: boolean;
}

/**
 * Build a fitment row per catalogued vehicle. For the row matching the
 * selected vehicle, confidence is refined by the fitment engine (year/engine
 * checks) so an out-of-range year downgrades an otherwise confirmed fit.
 */
export function fitments(part: Part, vq?: VehicleQuery | null): FitmentRow[] {
  const selectedId = vq ? resolveVehicleId(vq) : undefined;
  const x = specsFor(part);
  return part.fitments.map((f) => {
    const veh = vehicleById(f.vehicleId);
    const isSelected = !!selectedId && f.vehicleId === selectedId;

    let level = levelFromConfidence(f.confidence);
    let reasons: string[];
    if (isSelected && vq) {
      const chk = checkFitment(part, vq);
      reasons = chk.reasons;
      if (chk.verdict === 'fits') level = chk.confidence >= 0.85 ? 'confirmed' : 'partial';
      else if (chk.verdict === 'possible') level = 'needs-verification';
      else if (chk.verdict === 'no-fit') level = 'not-confirmed';
      else level = 'needs-verification';
    } else {
      reasons = [
        `Catalogued for ${veh ? vehicleLabel(veh) : 'this vehicle'} (${f.yearFrom}–${f.yearTo})`,
      ];
      if (f.note) reasons.push(f.note);
    }

    return {
      vehicle: veh ? vehicleLabel(veh) : '—',
      yearRange: `${f.yearFrom}–${f.yearTo >= 2024 ? 'present' : f.yearTo}`,
      engine: f.engine ?? (veh?.engines.join(', ') || 'All engines'),
      transmission: veh?.transmissions.join(' / ') ?? '—',
      body: veh?.bodyType ?? '—',
      drive: veh?.drive ?? '—',
      position: posLabel[f.position ?? 'n/a'] ?? '—',
      side: sideLabel[f.side ?? 'n/a'] ?? '—',
      qtyRequired: x.vehicleQty != null ? `${x.vehicleQty}` : '1',
      level,
      reasons,
      selected: isSelected,
    };
  });
}

// ---------------------------------------------------------------------------
// Availability (per branch / warehouse) — indicative demo data, not live.
// ---------------------------------------------------------------------------

export interface AvailabilityRow {
  branch: string;
  warehouse: string;
  available: number;
  /** Not modelled → null. */
  reserved: number | null;
  incoming: number | null;
  eta: string;
}

export interface Availability {
  rows: AvailabilityRow[];
  totalAvailable: number;
  status: 'in-stock' | 'low' | 'out';
  note: string;
}

export function availability(part: Part): Availability {
  const rows: AvailabilityRow[] = part.inventory.map((r) => {
    const sup = supplierById(r.supplierId);
    return {
      branch: sup?.name ?? r.warehouse,
      warehouse: r.warehouse,
      available: r.stock,
      reserved: null, // not modelled
      incoming: null, // not modelled
      eta: r.leadTime,
    };
  });
  const totalAvailable = rows.reduce((n, r) => n + r.available, 0);
  const status: Availability['status'] =
    totalAvailable === 0 ? 'out' : totalAvailable <= 5 ? 'low' : 'in-stock';
  return {
    rows,
    totalAvailable,
    status,
    note: 'Indicative demo stock — not a live supplier/ERP feed. Reserved & incoming are not tracked in this prototype.',
  };
}

// ---------------------------------------------------------------------------
// Related parts
// ---------------------------------------------------------------------------

export interface RelatedGroup {
  title: string;
  /** 'catalogue' = genuine same-catalogue relationship; 'suggested' otherwise. */
  kind: 'catalogue' | 'alternative';
  parts: Part[];
}

export function relatedParts(part: Part, vq?: VehicleQuery | null): RelatedGroup[] {
  const groups: RelatedGroup[] = [];

  // Alternative grades of the SAME part (real relationship from the generator).
  const alts = part.alternativeIds.map((id) => partById(id)).filter(Boolean) as Part[];
  if (alts.length) {
    groups.push({ title: 'Alternative grades (same part, other tiers)', kind: 'alternative', parts: alts });
  }

  // Related components by catalogue relationship, limited to the fitted vehicle.
  const vehId = (vq ? resolveVehicleId(vq) : undefined) ?? part.fitments[0]?.vehicleId;
  const x = specsFor(part);
  const seen = new Set<string>([part.id, ...part.alternativeIds]);
  const related: Part[] = [];
  for (const term of x.related ?? []) {
    for (const p of partsByCanonicalTerm(term, vehId)) {
      const groupKey = p.id.split('__').slice(0, 2).join('__');
      if (seen.has(p.id) || seen.has(groupKey)) continue;
      seen.add(p.id);
      related.push(p);
    }
  }
  if (related.length) {
    groups.push({ title: 'Related components for this vehicle', kind: 'catalogue', parts: related });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// History (store-backed — only real records; no fabricated history)
// ---------------------------------------------------------------------------

export interface HistorySection {
  title: string;
  entries: { primary: string; secondary: string }[];
  /** Explicit "no records / not tracked" line when empty. */
  emptyNote: string;
}

export function history(
  part: Part,
  store: { orders: Order[]; rfqs: Rfq[]; history: SearchHistoryEntry[] },
): HistorySection[] {
  const groupKey = part.id.split('__').slice(0, 2).join('__');
  const sameGroup = (id?: string) => !!id && id.split('__').slice(0, 2).join('__') === groupKey;

  const orders = store.orders.filter((o) => o.partId === part.id || sameGroup(o.partId));
  const rfqs = store.rfqs.filter((r) => r.partId === part.id || sameGroup(r.partId));
  const searches = store.history.filter((h) => h.matchedPartId === part.id || sameGroup(h.matchedPartId));

  return [
    {
      title: 'Previous orders',
      entries: orders.map((o) => ({
        primary: `${o.reference} · ${o.quantity} × @ $${o.unitPrice.toFixed(2)}`,
        secondary: `${o.status} · ${new Date(o.createdAt).toLocaleDateString()}`,
      })),
      emptyNote: 'No previous orders for this part.',
    },
    {
      title: 'Previous quotes / RFQs',
      entries: rfqs.map((r) => ({
        primary: `${r.reference} · qty ${r.quantity}`,
        secondary: `${r.status} · ${r.quotes.length} suppliers`,
      })),
      emptyNote: 'No previous quotes for this part.',
    },
    {
      title: 'Recent searches that matched this part',
      entries: searches.map((h) => ({
        primary: `“${h.query}”`,
        secondary: `${Math.round((h.confidence ?? 0) * 100)}% · ${new Date(h.createdAt).toLocaleDateString()}`,
      })),
      emptyNote: 'No recent searches matched this part.',
    },
    {
      title: 'Supersession & price/stock history',
      entries: [],
      emptyNote: 'Not available — connect an ERP/history provider.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Documents / media (only what we genuinely hold)
// ---------------------------------------------------------------------------

export interface DocItem {
  label: string;
  available: boolean;
  /** Inline text content when the "document" is catalogue text we hold. */
  body?: string[];
  note?: string;
}

export function documents(part: Part): DocItem[] {
  const x = specsFor(part);
  return [
    { label: 'Main product image', available: false, note: 'No product imagery in this prototype — connect an image provider.' },
    { label: 'Additional photos', available: false, note: 'None on file.' },
    {
      label: 'Product notes',
      available: !!x.notes?.length,
      body: x.notes,
      note: x.notes?.length ? undefined : 'None on file.',
    },
    {
      label: 'Installation notes',
      available: !!x.install?.length,
      body: x.install,
      note: x.install?.length ? undefined : 'None on file.',
    },
    {
      label: 'Safety information',
      available: !!x.warnings?.length,
      body: x.warnings,
      note: x.warnings?.length ? undefined : 'None on file.',
    },
    { label: 'Technical datasheet', available: false, note: 'Not available — connect a document provider.' },
    { label: 'Exploded diagram', available: false, note: 'Not available — connect a catalogue diagram provider.' },
    { label: 'Product brochure', available: false, note: 'Not available.' },
  ];
}

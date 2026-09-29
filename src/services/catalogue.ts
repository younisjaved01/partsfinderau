import type { Part, PartCategory, VehicleQuery } from '@/types';
import { partTemplates } from '@/data/partTemplates';
import { parts } from '@/data/parts';
import { vehicles } from '@/data/vehicles';

/**
 * CATALOGUE SERVICE
 * ------------------------------------------------------------------
 * Derives the Group → Sub-group → Parts hierarchy that a parts interpreter
 * navigates (mirroring the legacy catalogue's GROUP / SUB-GROUP structure)
 * entirely from the EXISTING template + part data — no new catalogue data is
 * invented. Kept out of the UI so the hierarchy can later be backed by a real
 * catalogue provider.
 */

const titleCase = (s: string) =>
  s
    .split(' ')
    .map((w) => (w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
    .replace(/\bCv\b/g, 'CV');

interface TemplateMeta {
  category: PartCategory;
  subGroup: string;
  canonicalTerm: string;
}

// templateKey → { category, subGroup } (sub-group = the catalogue term).
const templateMeta: Record<string, TemplateMeta> = Object.fromEntries(
  partTemplates.map((t) => [
    t.key,
    { category: t.category, subGroup: titleCase(t.canonicalTerm), canonicalTerm: t.canonicalTerm },
  ]),
);

const templateKeyOf = (part: Part) => part.id.split('__')[0];

export function partMeta(part: Part): TemplateMeta {
  return templateMeta[templateKeyOf(part)] ?? { category: part.category, subGroup: part.category, canonicalTerm: part.category };
}

/** Preferred display order for catalogue groups (systems). */
export const categoryOrder: PartCategory[] = [
  'Brake', 'Suspension', 'Steering', 'Driveline', 'Engine', 'Cooling',
  'Electrical', 'Exhaust', 'Transmission', 'Clutch', 'Bearings', 'Filters', 'Body',
];

export interface CatalogueGroup {
  category: PartCategory;
  subGroups: { name: string; templateKeys: string[] }[];
}

/** The full Group → Sub-group tree, built from the templates. */
export const catalogueTree: CatalogueGroup[] = (() => {
  const byCat = new Map<PartCategory, Map<string, string[]>>();
  for (const t of partTemplates) {
    const sub = titleCase(t.canonicalTerm);
    if (!byCat.has(t.category)) byCat.set(t.category, new Map());
    const subs = byCat.get(t.category)!;
    subs.set(sub, [...(subs.get(sub) ?? []), t.key]);
  }
  const cats = Array.from(byCat.keys()).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );
  return cats.map((category) => ({
    category,
    subGroups: Array.from(byCat.get(category)!.entries())
      .map(([name, templateKeys]) => ({ name, templateKeys }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
})();

/** Resolve a loose vehicle query to a catalogue vehicle id, if any. */
export function resolveVehicleId(vq?: VehicleQuery | null): string | undefined {
  if (!vq || (!vq.make && !vq.model)) return undefined;
  const v = vehicles.find(
    (x) =>
      (!vq.make || x.make.toLowerCase() === vq.make.toLowerCase()) &&
      (!vq.model || x.model.toLowerCase() === vq.model.toLowerCase()) &&
      (!vq.series || (x.series ?? '').toLowerCase().includes(vq.series.toLowerCase())),
  );
  return v?.id;
}

const tierRank = (part: Part) => {
  const t = part.specs.Tier ?? '';
  if (t.includes('OEM')) return 0;
  if (t.includes('Premium')) return 1;
  if (t.includes('Standard')) return 2;
  return 3;
};

export interface CatalogueQuery {
  vehicle?: VehicleQuery | null;
  category?: PartCategory;
  subGroup?: string;
}

/**
 * Parts for the current catalogue location, filtered to the selected vehicle
 * and de-duplicated to one representative (best tier) per part/vehicle group.
 */
export function browseCatalogue(q: CatalogueQuery): Part[] {
  const vehId = resolveVehicleId(q.vehicle);
  const groups = new Map<string, Part>();
  for (const part of parts) {
    const meta = partMeta(part);
    if (q.category && meta.category !== q.category) continue;
    if (q.subGroup && meta.subGroup !== q.subGroup) continue;
    if (vehId && !part.fitments.some((f) => f.vehicleId === vehId)) continue;
    const groupKey = part.id.split('__').slice(0, 2).join('__');
    const existing = groups.get(groupKey);
    if (!existing || tierRank(part) < tierRank(existing)) groups.set(groupKey, part);
  }
  return Array.from(groups.values());
}

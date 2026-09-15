import type {
  Part,
  Fitment,
  InventoryRecord,
  CrossReference,
  QualityTier,
} from '@/types';
import { partTemplates, type PartTemplate } from './partTemplates';
import { vehicles, vehicleById, vehicleLabel } from './vehicles';
import { brands } from './brands';
import { suppliers } from './suppliers';

// ---------------------------------------------------------------------------
// Deterministic pseudo-randomness so prices/stock are stable between reloads
// (important for a repeatable demo).
// ---------------------------------------------------------------------------

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tierPriceMultiplier: Record<QualityTier, number> = {
  oem: 1.55,
  premium: 1.2,
  standard: 1.0,
  budget: 0.72,
};

const tierLabel: Record<QualityTier, string> = {
  oem: 'OEM Genuine',
  premium: 'Premium Aftermarket',
  standard: 'Standard Aftermarket',
  budget: 'Budget Aftermarket',
};

const oemBrandByMake: Record<string, string> = {
  Toyota: 'br-oem-toy',
  Nissan: 'br-oem-nis',
  Ford: 'br-oem-frd',
  Mitsubishi: 'br-oem-mit',
  Isuzu: 'br-oem-isu',
};

const brandsByTier = (tier: QualityTier) => brands.filter((b) => b.tier === tier);

function pickBrandId(tier: QualityTier, make: string, rnd: () => number): string {
  if (tier === 'oem') return oemBrandByMake[make] ?? 'br-oem-toy';
  const pool = brandsByTier(tier);
  if (pool.length === 0) return brandsByTier('standard')[0].id;
  return pool[Math.floor(rnd() * pool.length)].id;
}

const leadTimeFor = (fulfilment: string[]): string => {
  if (fulfilment.includes('same-day')) return 'Same day';
  if (fulfilment.includes('next-day')) return 'Next day';
  return '2–3 days';
};

function makeOemNumber(make: string, rnd: () => number): string {
  const prefix = { Toyota: '04465', Nissan: 'D1060', Ford: 'AB39', Mitsubishi: 'MR millimetre', Isuzu: '8-98' }[make] ?? '00000';
  const suffix = Math.floor(rnd() * 90000 + 10000).toString();
  const tail = Math.floor(rnd() * 900 + 100).toString();
  return `MOCK-${prefix.replace(/\D/g, '').slice(0, 5) || '00000'}-${suffix}${tail.slice(0, 1)}`;
}

function makePartNumber(template: PartTemplate, tier: QualityTier, rnd: () => number): string {
  const cat = template.key.replace(/[^a-z]/g, '').slice(0, 4).toUpperCase();
  const tierCode = { oem: 'OE', premium: 'PR', standard: 'ST', budget: 'BG' }[tier];
  const n = Math.floor(rnd() * 9000 + 1000);
  return `PIQ-${cat}${tierCode}-${n}`;
}

function buildInventory(
  seedBase: string,
  tier: QualityTier,
  basePrice: number,
): InventoryRecord[] {
  const rnd = mulberry32(hashSeed(seedBase + ':inv'));
  const tierPrice = basePrice * tierPriceMultiplier[tier];
  // Choose 2-4 suppliers deterministically.
  const shuffled = [...suppliers].sort(
    (a, b) => hashSeed(seedBase + a.id) - hashSeed(seedBase + b.id),
  );
  const count = 2 + Math.floor(rnd() * 3); // 2-4
  return shuffled.slice(0, count).map((sup) => {
    const variance = 0.9 + rnd() * 0.25; // ±
    const price = Math.round(tierPrice * variance);
    const stock = Math.floor(rnd() * 42);
    return {
      supplierId: sup.id,
      warehouse: sup.location,
      stock,
      price,
      leadTime: stock === 0 ? 'Backorder 5–7 days' : leadTimeFor(sup.fulfilment),
      quality: tier,
    };
  });
}

function buildCrossReferences(
  seedBase: string,
  ownTier: QualityTier,
  rnd: () => number,
): CrossReference[] {
  const others = brands.filter((b) => b.tier !== ownTier || b.tier !== 'oem');
  const shuffled = [...others].sort(
    (a, b) => hashSeed(seedBase + a.id + 'x') - hashSeed(seedBase + b.id + 'x'),
  );
  const count = 2 + Math.floor(rnd() * 2); // 2-3
  return shuffled.slice(0, count).map((b) => ({
    brandId: b.id,
    partNumber: `${b.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${Math.floor(
      rnd() * 900000 + 100000,
    )}`,
    quality: b.tier,
  }));
}

// ---------------------------------------------------------------------------
// Catalogue generation
// ---------------------------------------------------------------------------

function generateParts(): Part[] {
  const parts: Part[] = [];
  // Track variant groups so we can wire up alternativeIds afterwards.
  const groups: Record<string, string[]> = {};

  for (const template of partTemplates) {
    const applicable =
      template.vehicles === 'all'
        ? vehicles.map((v) => v.id)
        : template.vehicles;

    for (const vehId of applicable) {
      const vehicle = vehicleById(vehId);
      if (!vehicle) continue;
      const groupKey = `${template.key}__${vehId}`;
      groups[groupKey] = groups[groupKey] ?? [];

      for (const tier of template.tiers) {
        const id = `${template.key}__${vehId}__${tier}`;
        const seedBase = id;
        const rnd = mulberry32(hashSeed(seedBase));
        const brandId = pickBrandId(tier, vehicle.make, rnd);
        const basePrice = template.basePrice;
        const price = Math.round(basePrice * tierPriceMultiplier[tier]);
        const engine = template.category === 'Filters' || template.category === 'Engine'
          ? vehicle.engines[Math.floor(rnd() * vehicle.engines.length)]
          : undefined;

        const fitment: Fitment = {
          vehicleId: vehId,
          yearFrom: vehicle.yearFrom,
          yearTo: vehicle.yearTo,
          engine,
          position: template.position,
          side: template.side,
          confidence: tier === 'oem' ? 0.98 : tier === 'premium' ? 0.94 : tier === 'standard' ? 0.88 : 0.8,
          note: tier === 'budget' ? 'Verify fitment before ordering' : undefined,
        };

        const part: Part = {
          id,
          partNumber: makePartNumber(template, tier, rnd),
          oemNumber: makeOemNumber(vehicle.make, mulberry32(hashSeed(seedBase + 'oem'))),
          name: `${tierLabel[tier]} ${template.name} — ${vehicleLabel(vehicle)}`,
          brandId,
          category: template.category,
          description: `${template.name} for the ${vehicleLabel(vehicle)} (${vehicle.yearFrom}–${vehicle.yearTo}). ${tierLabel[tier]} quality. ${
            template.position !== 'n/a' ? `Position: ${template.position}. ` : ''
          }Catalogue term: ${template.canonicalTerm}.`,
          aliases: template.aliases,
          fitments: [fitment],
          yearFrom: vehicle.yearFrom,
          yearTo: vehicle.yearTo,
          engine,
          position: template.position,
          side: template.side,
          specs: { ...template.specs, Tier: tierLabel[tier] },
          price,
          inventory: buildInventory(seedBase, tier, basePrice),
          image: template.image,
          alternativeIds: [], // filled below
          crossReferences: buildCrossReferences(seedBase, tier, mulberry32(hashSeed(seedBase + 'xref'))),
        };

        parts.push(part);
        groups[groupKey].push(id);
      }
    }
  }

  // Wire alternatives: every part in a variant group is an alternative of the others.
  const byId = new Map(parts.map((p) => [p.id, p]));
  for (const ids of Object.values(groups)) {
    for (const id of ids) {
      const part = byId.get(id)!;
      part.alternativeIds = ids.filter((other) => other !== id);
    }
  }

  return parts;
}

export const parts: Part[] = generateParts();

export const partById = (id: string): Part | undefined => parts.find((p) => p.id === id);

/** Total catalogue size — surfaced in the UI to prove the mock DB scale. */
export const catalogueSize = parts.length;

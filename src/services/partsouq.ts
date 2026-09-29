import type {
  PartsouqProvider,
  PartsouqRef,
  PartsouqImage,
  PartsouqDetails,
} from './integrations';
import { integrations } from './integrations';
import type { Part, VehicleQuery } from '@/types';
import { partById } from '@/data/parts';
import { vehicleById, vehicleLabel } from '@/data/vehicles';
import { partMeta } from './catalogue';

/**
 * PARTSOUQ-STYLE EXTERNAL CATALOGUE — mock provider.
 *
 * Prepares the UI for a future external catalogue integration WITHOUT touching
 * the real Partsouq API: no endpoints, no keys, no scraping. Everything below
 * is derived locally from our own catalogue so the "external match" section can
 * be designed and demoed today. A real provider binds to
 * `integrations.partsouq` later; callers use the exported helpers unchanged.
 */

const refFromPart = (part: Part): PartsouqRef => {
  const meta = partMeta(part);
  const compat = part.fitments
    .map((f) => vehicleById(f.vehicleId))
    .filter(Boolean)
    .map((v) => vehicleLabel(v!));
  return {
    partNumber: part.oemNumber,
    description: `${meta.subGroup} — ${part.name.split(' — ')[0]}`,
    brand: 'OE Reference',
    vehicleCompatibility: compat.slice(0, 4),
    source: 'Partsouq',
  };
};

class MockPartsouqProvider implements PartsouqProvider {
  name = 'Partsouq (mock)';

  async searchParts(query: { partNumber?: string; text?: string; vehicle?: VehicleQuery }): Promise<PartsouqRef[]> {
    await new Promise((r) => setTimeout(r, 350));
    // In the mock we key off a part number that matches our catalogue.
    if (query.partNumber) {
      const part = [...idIndex.values()].find(
        (p) => p.oemNumber === query.partNumber || p.partNumber === query.partNumber,
      );
      if (part) return [refFromPart(part)];
    }
    return [];
  }

  async getPart(partNumber: string): Promise<PartsouqRef | null> {
    const part = byOem(partNumber);
    return part ? refFromPart(part) : null;
  }

  async getPartImage(partNumber: string): Promise<PartsouqImage> {
    await new Promise((r) => setTimeout(r, 250));
    // The mock never actually holds imagery — it reports the honest state a
    // real provider would, so the UI can render its "image unavailable" path.
    void partNumber;
    return { available: false, note: 'No external image in demo — connect a catalogue image provider' };
  }

  async getPartDetails(partNumber: string): Promise<PartsouqDetails | null> {
    await new Promise((r) => setTimeout(r, 300));
    const part = byOem(partNumber);
    if (!part) return null;
    return {
      ...refFromPart(part),
      oem: [part.oemNumber, ...part.crossReferences.map((c) => c.partNumber)].slice(0, 4),
      specs: part.specs,
    };
  }
}

// Tiny index so the mock can resolve by our own part identifiers.
const idIndex = new Map<string, Part>();
const byOem = (pn: string): Part | undefined => {
  for (const [, p] of idIndex) if (p.oemNumber === pn || p.partNumber === pn) return p;
  return undefined;
};

/** Register a part so the mock can "find" it by number (called lazily by the UI). */
export function indexPartForPartsouq(partId: string) {
  const p = partById(partId);
  if (p) idIndex.set(p.id, p);
}

const mock = new MockPartsouqProvider();
const active = (): PartsouqProvider => integrations.partsouq ?? mock;

/**
 * Convenience: get the external "Partsouq match" for one of our parts. Indexes
 * the part first so the mock can resolve it. Returns ref + image state.
 */
export async function partsouqMatchFor(part: Part): Promise<{ ref: PartsouqRef; image: PartsouqImage } | null> {
  indexPartForPartsouq(part.id);
  const ref = await active().getPart(part.oemNumber);
  if (!ref) return null;
  const image = await active().getPartImage(part.oemNumber);
  return { ref, image };
}

export const partsouqProviderName = () => active().name;

import type { Part } from '@/types';
import { supplierById } from '@/data/suppliers';

/**
 * UI-level presentation helpers derived from existing data. These do NOT change
 * any business logic — they translate the search engine's confidence score and
 * the catalogue's stock/supplier data into the strong, scannable fitment and
 * availability signals a 4WD parts counter expects.
 */

export type FitmentLevel = 'confirmed' | 'likely' | 'verify';

export interface FitmentDisplay {
  level: FitmentLevel;
  label: string;
  /** Tailwind classes for a badge (border/text/bg). */
  cls: string;
  /** '✓' | '≈' | '⚠' style glyph handled by the caller's icon. */
}

/**
 * Map a 0–1 confidence score to a fitment verdict. Deliberately conservative:
 * we never say "confirmed" unless the engine is highly confident.
 */
export function fitmentFromScore(score: number): FitmentDisplay {
  if (score >= 0.85) {
    return {
      level: 'confirmed',
      label: 'Confirmed fitment',
      cls: 'border-signal-green/45 bg-signal-green/10 text-signal-green',
    };
  }
  if (score >= 0.6) {
    return {
      level: 'likely',
      label: 'Likely fitment',
      cls: 'border-signal-amber/45 bg-signal-amber/10 text-signal-amber',
    };
  }
  return {
    level: 'verify',
    label: 'Verify fitment',
    cls: 'border-signal-red/45 bg-signal-red/10 text-signal-red',
  };
}

/** True when at least one supplier holds stock AND can dispatch same-day. */
export function availableToday(part: Part): boolean {
  return part.inventory.some((r) => {
    if (r.stock <= 0) return false;
    const sup = supplierById(r.supplierId);
    return Boolean(sup?.fulfilment.includes('same-day'));
  });
}

/** Soonest human-readable dispatch across in-stock suppliers. */
export function fastestDispatch(part: Part): string | undefined {
  const inStock = part.inventory.filter((r) => r.stock > 0);
  if (inStock.length === 0) return undefined;
  if (availableToday(part)) return 'Available today';
  if (inStock.some((r) => /next day/i.test(r.leadTime))) return 'Next day';
  return inStock[0].leadTime;
}

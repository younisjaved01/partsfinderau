import type { Build, BuildMod, Part, Vehicle } from '@/types';
import { partById } from '@/data/parts';
import { vehicleById, vehicleLabel } from '@/data/vehicles';
import { bestPrice } from './inventory';
import { categoryOrder } from './catalogue';

/**
 * BUILDS SERVICE
 * ------------------------------------------------------------------
 * Derives everything the Community UI needs from a {@link Build} and the
 * existing catalogue. A build mod only becomes "shoppable" when its partId
 * resolves to a real catalogue part — unresolved/absent links are simply not
 * priced or added to cart (never faked).
 */

export const buildVehicle = (build: Build): Vehicle | undefined => vehicleById(build.vehicleId);

export const buildVehicleLabel = (build: Build): string => {
  const v = buildVehicle(build);
  return v ? vehicleLabel(v) : 'Unknown vehicle';
};

/** Catalogue part a mod links to, when it resolves. */
export const modPart = (mod: BuildMod): Part | undefined =>
  mod.partId ? partById(mod.partId) : undefined;

export interface ShopItem {
  mod: BuildMod;
  part: Part;
}

/** Mods that link to a real catalogue part (the shoppable subset). */
export function shopItems(build: Build): ShopItem[] {
  const items: ShopItem[] = [];
  for (const mod of build.mods) {
    const part = modPart(mod);
    if (part) items.push({ mod, part });
  }
  return items;
}

/** Indicative total to replicate the linked parts of a build (lowest supplier price). */
export function buildValue(build: Build): number {
  return shopItems(build).reduce((sum, { part }) => sum + bestPrice(part), 0);
}

export interface BuildStats {
  mods: number;
  linked: number;
  fitted: number;
  planned: number;
  wishlist: number;
}

export function buildStats(build: Build): BuildStats {
  return {
    mods: build.mods.length,
    linked: build.mods.filter((m) => modPart(m)).length,
    fitted: build.mods.filter((m) => m.status === 'fitted').length,
    planned: build.mods.filter((m) => m.status === 'planned').length,
    wishlist: build.mods.filter((m) => m.status === 'wishlist').length,
  };
}

export interface ModGroup {
  category: string;
  mods: BuildMod[];
}

/** Group a build's mods by category, catalogue systems first. */
export function modsByCategory(build: Build): ModGroup[] {
  const map = new Map<string, BuildMod[]>();
  for (const mod of build.mods) {
    if (!map.has(mod.category)) map.set(mod.category, []);
    map.get(mod.category)!.push(mod);
  }
  const rank = (c: string) => {
    const i = categoryOrder.indexOf(c as (typeof categoryOrder)[number]);
    return i === -1 ? 999 : i;
  };
  return Array.from(map.entries())
    .map(([category, mods]) => ({ category, mods }))
    .sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category));
}

/** Builds sharing the same vehicle or region, most-liked first. */
export function relatedBuilds(build: Build, all: Build[], limit = 3): Build[] {
  return all
    .filter((b) => b.id !== build.id && (b.vehicleId === build.vehicleId || b.region === build.region))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);
}

export const statusMeta: Record<BuildMod['status'], { label: string; cls: string }> = {
  fitted: { label: 'Fitted', cls: 'border-signal-green/45 bg-signal-green/10 text-signal-green' },
  planned: { label: 'Planned', cls: 'border-signal-amber/45 bg-signal-amber/10 text-signal-amber' },
  wishlist: { label: 'Wishlist', cls: 'border-signal-blue/45 bg-signal-blue/10 text-signal-blue' },
};

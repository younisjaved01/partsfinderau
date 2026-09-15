import type { Part, PartCategory } from '@/types';
import { parts } from '@/data/parts';
import { brandById } from '@/data/brands';

/**
 * INVENTORY SERVICE (§14)
 * Rolls up stock across suppliers and provides filtered listing.
 */

export interface InventoryStats {
  totalParts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalUnits: number;
  inventoryValue: number;
}

/** Total units of a part across all supplier warehouses. */
export const totalStock = (part: Part): number =>
  part.inventory.reduce((sum, r) => sum + r.stock, 0);

/** Lowest in-stock price, else lowest listed. */
export const bestPrice = (part: Part): number => {
  const inStock = part.inventory.filter((r) => r.stock > 0);
  const pool = inStock.length ? inStock : part.inventory;
  return pool.reduce((min, r) => Math.min(min, r.price), Infinity);
};

const LOW_STOCK_THRESHOLD = 5;

export function inventoryStats(list: Part[] = parts): InventoryStats {
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let totalUnits = 0;
  let inventoryValue = 0;
  for (const p of list) {
    const units = totalStock(p);
    totalUnits += units;
    inventoryValue += units * bestPrice(p);
    if (units === 0) outOfStock++;
    else if (units <= LOW_STOCK_THRESHOLD) lowStock++;
    else inStock++;
  }
  return {
    totalParts: list.length,
    inStock,
    lowStock,
    outOfStock,
    totalUnits,
    inventoryValue: Math.round(inventoryValue),
  };
}

export interface InventoryFilter {
  query?: string;
  category?: PartCategory | 'all';
  brandId?: string | 'all';
  stock?: 'all' | 'in' | 'low' | 'out';
  minPrice?: number;
  maxPrice?: number;
}

export function filterInventory(filter: InventoryFilter): Part[] {
  const q = (filter.query ?? '').trim().toLowerCase();
  return parts.filter((p) => {
    if (filter.category && filter.category !== 'all' && p.category !== filter.category) return false;
    if (filter.brandId && filter.brandId !== 'all' && p.brandId !== filter.brandId) return false;
    if (q) {
      const brand = brandById(p.brandId)?.name.toLowerCase() ?? '';
      const hay = `${p.name} ${p.partNumber} ${p.oemNumber} ${brand} ${p.aliases.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const units = totalStock(p);
    if (filter.stock === 'in' && units <= LOW_STOCK_THRESHOLD) return false;
    if (filter.stock === 'low' && (units === 0 || units > LOW_STOCK_THRESHOLD)) return false;
    if (filter.stock === 'out' && units !== 0) return false;
    const price = bestPrice(p);
    if (filter.minPrice != null && price < filter.minPrice) return false;
    if (filter.maxPrice != null && price > filter.maxPrice) return false;
    return true;
  });
}

export const LOW_STOCK = LOW_STOCK_THRESHOLD;

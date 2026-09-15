import type { Part, Supplier, InventoryRecord } from '@/types';
import { suppliers, supplierById } from '@/data/suppliers';

/**
 * SUPPLIER SERVICE (§11)
 * Aggregates the marketplace view of who can supply a given part.
 */

export interface SupplierOffer {
  supplier: Supplier;
  record: InventoryRecord;
}

export function offersForPart(part: Part): SupplierOffer[] {
  return part.inventory
    .map((record) => {
      const supplier = supplierById(record.supplierId);
      return supplier ? { supplier, record } : null;
    })
    .filter((o): o is SupplierOffer => Boolean(o))
    .sort((a, b) => a.record.price - b.record.price);
}

export function bestOffer(part: Part): SupplierOffer | undefined {
  const inStock = offersForPart(part).filter((o) => o.record.stock > 0);
  return (inStock[0] ?? offersForPart(part)[0]);
}

export const listSuppliers = (): Supplier[] => suppliers;
export { supplierById };

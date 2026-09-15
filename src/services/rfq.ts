import type { Part, Rfq, Quote } from '@/types';
import { supplierById } from '@/data/suppliers';
import { bestPrice } from './inventory';

/**
 * RFQ SERVICE (§12, §13)
 * Pure helpers for building RFQs and simulating supplier responses. Timing /
 * persistence lives in the app store so the simulation can play out over the
 * session; swap `simulateQuote` for a real supplier API later.
 */

let rfqCounter = 10482;

export function nextRfqReference(): string {
  return `RFQ #${rfqCounter++}`;
}

export function createRfq(
  part: Part,
  quantity: number,
  delivery: string,
  supplierIds: string[],
): Rfq {
  const id = `rfq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const quotes: Quote[] = supplierIds.map((supplierId) => ({
    id: `q-${supplierId}-${Date.now()}`,
    supplierId,
    status: 'waiting',
  }));
  return {
    id,
    reference: nextRfqReference(),
    partId: part.id,
    partName: part.name,
    quantity,
    delivery,
    createdAt: new Date().toISOString(),
    status: 'open',
    quotes,
  };
}

/**
 * Simulate a single supplier's response to an RFQ line. Uses the supplier's
 * catalogued inventory for the part when available, otherwise a plausible
 * synthesised offer.
 */
export function simulateQuote(part: Part, supplierId: string): Quote {
  const supplier = supplierById(supplierId);
  const record = part.inventory.find((r) => r.supplierId === supplierId);
  // ~15% chance a supplier declines / can't source it.
  const declines = Math.random() < 0.15;

  if (declines || (!record && Math.random() < 0.4)) {
    return {
      id: `q-${supplierId}`,
      supplierId,
      status: 'declined',
      respondedAt: new Date().toISOString(),
      note: 'Unable to source at this time',
    };
  }

  const base = record?.price ?? Math.round(bestPrice(part) * (0.95 + Math.random() * 0.2));
  const stock = record?.stock ?? Math.floor(Math.random() * 20);
  const leadTime = record?.leadTime ?? (supplier ? `${supplier.responseTimeHours}h dispatch` : 'Next day');

  return {
    id: `q-${supplierId}`,
    supplierId,
    status: 'quoted',
    price: base,
    stock,
    leadTime,
    respondedAt: new Date().toISOString(),
  };
}

export function rollupStatus(rfq: Rfq): Rfq['status'] {
  if (rfq.status === 'awarded' || rfq.status === 'cancelled') return rfq.status;
  const responded = rfq.quotes.filter((q) => q.status !== 'waiting').length;
  if (responded === 0) return 'open';
  if (responded < rfq.quotes.length) return 'partial';
  return 'complete';
}

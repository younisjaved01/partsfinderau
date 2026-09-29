import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/AppStore';
import { Card, StatCard, SectionTitle, EmptyState } from '@/components/ui';
import { IconSales, IconDoc, IconTag, IconTruck, IconArrowRight } from '@/components/icons';
import { partById } from '@/data/parts';
import { bestPrice } from '@/services/inventory';
import { supplierById } from '@/data/suppliers';
import { aud, relativeTime } from '@/lib/format';

/**
 * SALES — maps the legacy Invoicing / Quote-to-Invoice / Receipts functions to
 * a modern overview built entirely from existing quote, RFQ and order data.
 */
export function Sales() {
  const { state } = useAppStore();

  const quoteValue = state.quote.reduce((s, l) => {
    const p = partById(l.partId);
    return s + (p ? bestPrice(p) * l.quantity : 0);
  }, 0);
  const orderRevenue = state.orders.reduce((s, o) => s + o.unitPrice * o.quantity, 0);
  const openRfqs = state.rfqs.filter((r) => r.status === 'open' || r.status === 'partial').length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 kicker"><IconSales width={14} height={14} /> Sales</div>
        <h1 className="text-2xl font-extrabold text-ink-50">Sales &amp; sourcing</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Quote basket" value={state.quote.length} hint={aud(quoteValue)} icon={<IconTag width={18} height={18} />} />
        <StatCard label="Open RFQs" value={openRfqs} icon={<IconDoc width={18} height={18} />} />
        <StatCard label="Orders" value={state.orders.length} icon={<IconTruck width={18} height={18} />} />
        <StatCard label="Order revenue" value={aud(orderRevenue)} accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle kicker="Fulfilment">Recent orders</SectionTitle>
            <Link to="/orders" className="text-xs font-semibold text-iq-400">All orders</Link>
          </div>
          {state.orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <ul className="space-y-2">
              {state.orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-2.5">
                  <span className="font-mono text-xs font-semibold text-ink-100">{o.reference}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-300">{o.partName.split(' — ')[0]}</span>
                  <span className="text-[11px] text-ink-500">{supplierById(o.supplierId)?.name} · {relativeTime(o.createdAt)}</span>
                  <span className="stat-num text-sm font-bold text-ink-50">{aud(o.unitPrice * o.quantity)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle kicker="Pipeline">Quotes &amp; RFQs</SectionTitle>
          <div className="space-y-2">
            <Link to="/quotes" className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3 hover:border-iq-600/50">
              <IconTag width={16} height={16} className="text-iq-400" />
              <span className="flex-1 text-sm text-ink-100">Quote basket</span>
              <span className="stat-num text-sm font-bold text-ink-50">{state.quote.length}</span>
              <IconArrowRight width={14} height={14} className="text-ink-500" />
            </Link>
            <Link to="/rfqs" className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3 hover:border-iq-600/50">
              <IconDoc width={16} height={16} className="text-iq-400" />
              <span className="flex-1 text-sm text-ink-100">Supplier RFQs</span>
              <span className="stat-num text-sm font-bold text-ink-50">{state.rfqs.length}</span>
              <IconArrowRight width={14} height={14} className="text-ink-500" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

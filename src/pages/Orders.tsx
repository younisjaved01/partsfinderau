import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/AppStore';
import { supplierById } from '@/data/suppliers';
import { Card, PartThumb, EmptyState, StatCard } from '@/components/ui';
import { IconTruck } from '@/components/icons';
import { aud, relativeTime } from '@/lib/format';
import { partById } from '@/data/parts';
import type { Order } from '@/types';

const statusStyle: Record<Order['status'], string> = {
  pending: 'border-ink-600 bg-ink-800 text-ink-300',
  confirmed: 'border-signal-blue/40 bg-signal-blue/10 text-signal-blue',
  shipped: 'border-signal-amber/40 bg-signal-amber/10 text-signal-amber',
  delivered: 'border-signal-green/40 bg-signal-green/10 text-signal-green',
  cancelled: 'border-ink-600 bg-ink-800 text-ink-400',
};

export function Orders() {
  const { state } = useAppStore();
  const total = state.orders.reduce((n, o) => n + o.unitPrice * o.quantity, 0);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
          <IconTruck width={14} height={14} /> Orders
        </div>
        <h1 className="text-2xl font-extrabold text-ink-50">Orders</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total orders" value={state.orders.length} />
        <StatCard label="Order value" value={aud(total)} accent />
        <StatCard label="In transit" value={state.orders.filter((o) => o.status === 'shipped').length} />
      </div>

      {state.orders.length === 0 ? (
        <EmptyState title="No orders yet" subtitle="Award an RFQ or select a supplier on a part page." icon={<IconTruck width={28} height={28} />} />
      ) : (
        <div className="space-y-3">
          {state.orders.map((o) => {
            const part = partById(o.partId);
            const s = supplierById(o.supplierId);
            return (
              <Card key={o.id} className="flex flex-wrap items-center gap-3 p-4">
                {part && <PartThumb part={part} size="sm" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink-50">{o.reference}</span>
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusStyle[o.status]}`}>{o.status}</span>
                  </div>
                  <Link to={`/part/${o.partId}`} className="block truncate text-sm text-ink-300 hover:text-iq-300">
                    {o.partName.split(' — ')[0]}
                  </Link>
                  <div className="text-xs text-ink-500">{s?.name} · {relativeTime(o.createdAt)} · ETA {o.eta}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-ink-50">{aud(o.unitPrice * o.quantity)}</div>
                  <div className="text-xs text-ink-400">{o.quantity} × {aud(o.unitPrice)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

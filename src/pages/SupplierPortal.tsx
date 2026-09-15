import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/AppStore';
import { listSuppliers } from '@/services/suppliers';
import { parts, partById } from '@/data/parts';
import { Card, StatCard, PartThumb, EmptyState, QualityBadge } from '@/components/ui';
import {
  IconStore,
  IconDoc,
  IconBox,
  IconCheck,
  IconUpload,
  IconCamera,
  IconLayers,
  IconCar,
  IconTruck,
  IconPlus,
} from '@/components/icons';
import { aud } from '@/lib/format';
import type { Part, QualityTier } from '@/types';

const tierOf = (part: Part): QualityTier => {
  const t = part.specs.Tier ?? '';
  if (t.includes('OEM')) return 'oem';
  if (t.includes('Premium')) return 'premium';
  if (t.includes('Budget')) return 'budget';
  return 'standard';
};

const capabilities = [
  { icon: IconUpload, label: 'Upload catalogue', desc: 'Bulk import parts via CSV / API' },
  { icon: IconPlus, label: 'Add parts', desc: 'Create listings with fitment' },
  { icon: IconCamera, label: 'Upload images', desc: 'Attach part photos for vision search' },
  { icon: IconLayers, label: 'Cross references', desc: 'Map OEM ↔ aftermarket numbers' },
  { icon: IconCar, label: 'Compatible vehicles', desc: 'Define fitment ranges' },
  { icon: IconTruck, label: 'Fulfilment', desc: 'Set lead times & delivery zones' },
];

export function SupplierPortal() {
  const { state, respondRfq } = useAppStore();
  const suppliers = listSuppliers();
  const [supplierId, setSupplierId] = useState(suppliers[0].id);

  // Listings for this supplier.
  const listings = useMemo(
    () =>
      parts
        .map((p) => ({ part: p, rec: p.inventory.find((r) => r.supplierId === supplierId) }))
        .filter((x): x is { part: Part; rec: NonNullable<typeof x.rec> } => Boolean(x.rec)),
    [supplierId],
  );

  const units = listings.reduce((n, l) => n + l.rec.stock, 0);
  const avgPrice = listings.length ? Math.round(listings.reduce((n, l) => n + l.rec.price, 0) / listings.length) : 0;

  // Incoming RFQs targeting this supplier.
  const incoming = state.rfqs.filter(
    (r) => (r.status === 'open' || r.status === 'partial') && r.quotes.some((q) => q.supplierId === supplierId && q.status === 'waiting'),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
            <IconStore width={14} height={14} /> Supplier portal
          </div>
          <h1 className="text-2xl font-extrabold text-ink-50">Supplier dashboard</h1>
        </div>
        <div>
          <label className="label">Acting as supplier</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input w-56">
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Listings" value={listings.length} icon={<IconBox width={16} height={16} />} />
        <StatCard label="Units in stock" value={units} />
        <StatCard label="Avg price" value={aud(avgPrice)} />
        <StatCard label="Open RFQs" value={incoming.length} accent icon={<IconDoc width={16} height={16} />} />
      </div>

      {/* Incoming RFQs to respond to */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <IconDoc width={16} height={16} className="text-iq-400" />
          <h2 className="text-base font-bold text-ink-50">Respond to RFQs</h2>
        </div>
        {incoming.length === 0 ? (
          <EmptyState title="No pending RFQs" subtitle="RFQs awaiting your quote will appear here." />
        ) : (
          <div className="space-y-2">
            {incoming.map((r) => {
              const part = partById(r.partId);
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3">
                  <span className="font-mono text-sm font-semibold text-ink-50">{r.reference}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-300">{r.partName.split(' — ')[0]} · qty {r.quantity}</span>
                  <button
                    onClick={() => part && respondRfq(r.id, supplierId, part)}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    <IconCheck width={13} height={13} /> Send quote
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Capabilities */}
      <div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">Catalogue management</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {capabilities.map((c) => (
            <Card key={c.label} className="card-hover p-4">
              <c.icon width={20} height={20} className="text-iq-400" />
              <div className="mt-2 text-sm font-bold text-ink-50">{c.label}</div>
              <div className="text-xs text-ink-400">{c.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Listings table */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-ink-800 px-5 py-3">
          <IconBox width={16} height={16} className="text-iq-400" />
          <h2 className="text-base font-bold text-ink-50">My listings</h2>
          <span className="ml-auto text-xs text-ink-400">{listings.length} parts</span>
        </div>
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="sticky top-0 bg-ink-900 text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Part</th>
                <th className="px-4 py-3 font-semibold">Tier</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Lead time</th>
              </tr>
            </thead>
            <tbody>
              {listings.slice(0, 60).map(({ part, rec }) => (
                <tr key={part.id} className="border-t border-ink-800 hover:bg-ink-900/60">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PartThumb part={part} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink-50">{part.name.split(' — ')[0]}</div>
                        <div className="font-mono text-[11px] text-ink-500">{part.partNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><QualityBadge tier={tierOf(part)} /></td>
                  <td className="px-4 py-2.5 font-bold text-ink-50">{aud(rec.price)}</td>
                  <td className={`px-4 py-2.5 font-semibold ${rec.stock === 0 ? 'text-signal-red' : rec.stock <= 5 ? 'text-signal-amber' : 'text-signal-green'}`}>{rec.stock}</td>
                  <td className="px-4 py-2.5 text-ink-300">{rec.leadTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-ink-500">
        Supplier tools operate on mock data in this prototype. Catalogue upload, pricing and stock updates are wired
        to the same data model the buyer side reads, ready to connect to a supplier ERP / API.
      </p>
    </div>
  );
}

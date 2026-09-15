import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { filterInventory, inventoryStats, totalStock, bestPrice, LOW_STOCK, type InventoryFilter } from '@/services/inventory';
import { Card, StatCard, PartThumb, QualityBadge, EmptyState } from '@/components/ui';
import { IconBox, IconSearch, IconCheck, IconWarn, IconX } from '@/components/icons';
import { brands, brandById } from '@/data/brands';
import { aud } from '@/lib/format';
import type { Part, PartCategory, QualityTier } from '@/types';

const categories: (PartCategory | 'all')[] = [
  'all', 'Brake', 'Suspension', 'Steering', 'Engine', 'Cooling', 'Electrical',
  'Filters', 'Clutch', 'Transmission', 'Driveline', 'Bearings', 'Body', 'Exhaust',
];

const tierOf = (part: Part): QualityTier => {
  const t = part.specs.Tier ?? '';
  if (t.includes('OEM')) return 'oem';
  if (t.includes('Premium')) return 'premium';
  if (t.includes('Budget')) return 'budget';
  return 'standard';
};

export function Inventory() {
  const [filter, setFilter] = useState<InventoryFilter>({ category: 'all', brandId: 'all', stock: 'all' });
  const stats = useMemo(() => inventoryStats(), []);
  const rows = useMemo(() => filterInventory(filter).slice(0, 80), [filter]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
          <IconBox width={14} height={14} /> Inventory
        </div>
        <h1 className="text-2xl font-extrabold text-ink-50">Stock &amp; availability</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total parts" value={stats.totalParts} />
        <StatCard label="In stock" value={stats.inStock} icon={<IconCheck width={16} height={16} className="text-signal-green" />} />
        <StatCard label="Low stock" value={stats.lowStock} icon={<IconWarn width={16} height={16} className="text-signal-amber" />} />
        <StatCard label="Out of stock" value={stats.outOfStock} icon={<IconX width={16} height={16} className="text-signal-red" />} />
        <StatCard label="Stock value" value={aud(stats.inventoryValue)} accent hint={`${stats.totalUnits} units`} />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={filter.query ?? ''}
              onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
              placeholder="Search inventory…"
              className="input pl-9"
            />
          </div>
          <select value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value as PartCategory | 'all' }))} className="input lg:w-44">
            {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
          </select>
          <select value={filter.brandId} onChange={(e) => setFilter((f) => ({ ...f, brandId: e.target.value }))} className="input lg:w-48">
            <option value="all">All brands</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filter.stock} onChange={(e) => setFilter((f) => ({ ...f, stock: e.target.value as InventoryFilter['stock'] }))} className="input lg:w-40">
            <option value="all">Any stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </Card>

      <div className="text-xs text-ink-400">{rows.length} results</div>

      {rows.length === 0 ? (
        <EmptyState title="No inventory matches" icon={<IconBox width={26} height={26} />} />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ink-900 text-[11px] uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Part</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Brand</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const units = totalStock(p);
                  const stockCls = units === 0 ? 'text-signal-red' : units <= LOW_STOCK ? 'text-signal-amber' : 'text-signal-green';
                  return (
                    <tr key={p.id} className="border-t border-ink-800 hover:bg-ink-900/60">
                      <td className="px-4 py-3">
                        <Link to={`/part/${p.id}`} className="flex items-center gap-3">
                          <PartThumb part={p} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink-50">{p.name.split(' — ')[0]}</span>
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-ink-500">{p.partNumber}</span>
                              <QualityBadge tier={tierOf(p)} />
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-300">{p.category}</td>
                      <td className="px-4 py-3 text-ink-300">{brandById(p.brandId)?.name}</td>
                      <td className="px-4 py-3 font-bold text-ink-50">{aud(bestPrice(p))}</td>
                      <td className={`px-4 py-3 font-semibold ${stockCls}`}>{units}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { listSuppliers } from '@/services/suppliers';
import { parts } from '@/data/parts';
import { Card, StatCard } from '@/components/ui';
import { IconStore, IconClock, IconTruck, IconBox } from '@/components/icons';

export function Suppliers() {
  const suppliers = listSuppliers();

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; units: number; totalPrice: number }>();
    for (const p of parts) {
      for (const r of p.inventory) {
        const s = map.get(r.supplierId) ?? { count: 0, units: 0, totalPrice: 0 };
        s.count += 1;
        s.units += r.stock;
        s.totalPrice += r.price;
        map.set(r.supplierId, s);
      }
    }
    return map;
  }, []);

  const totalListings = Array.from(stats.values()).reduce((n, s) => n + s.count, 0);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
          <IconStore width={14} height={14} /> Marketplace
        </div>
        <h1 className="text-2xl font-extrabold text-ink-50">Suppliers</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Suppliers" value={suppliers.length} icon={<IconStore width={16} height={16} />} />
        <StatCard label="Part listings" value={totalListings} icon={<IconBox width={16} height={16} />} />
        <StatCard label="Avg response" value={`${Math.round(suppliers.reduce((n, s) => n + s.responseTimeHours, 0) / suppliers.length)}h`} icon={<IconClock width={16} height={16} />} />
        <StatCard label="Same-day capable" value={suppliers.filter((s) => s.fulfilment.includes('same-day')).length} icon={<IconTruck width={16} height={16} />} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {suppliers.map((s) => {
          const st = stats.get(s.id);
          const avg = st && st.count ? Math.round(st.totalPrice / st.count) : 0;
          return (
            <Card key={s.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg text-base font-extrabold text-ink-950" style={{ background: s.logoColor }}>
                  {s.name[0]}
                </span>
                <div className="flex-1">
                  <div className="text-base font-bold text-ink-50">{s.name}</div>
                  <div className="text-xs text-ink-400">{s.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-signal-amber">★ {s.rating.toFixed(1)}</div>
                  <div className="text-[11px] text-ink-500">rating</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini label="Listings" value={String(st?.count ?? 0)} />
                <Mini label="Avg price" value={`$${avg}`} />
                <Mini label="Response" value={`${s.responseTimeHours}h`} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.fulfilment.map((f) => (
                  <span key={f} className="pill">{f.replace('-', ' ')}</span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 py-2">
      <div className="text-sm font-bold text-ink-50">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-500">{label}</div>
    </div>
  );
}

import { useMemo } from 'react';
import { useAppStore, useDashboardMetrics } from '@/store/AppStore';
import { Card, StatCard, SectionTitle } from '@/components/ui';
import { IconChart } from '@/components/icons';
import { inventoryStats } from '@/services/inventory';
import { parts } from '@/data/parts';
import { categoryOrder } from '@/services/catalogue';
import { aud, pct } from '@/lib/format';

/**
 * REPORTS — maps the legacy Daily/Monthly sales reports to a modern read-out
 * built from existing catalogue, inventory and search data. All figures are
 * derived; nothing is fabricated.
 */
export function Reports() {
  const { state } = useAppStore();
  const m = useDashboardMetrics();
  const stats = inventoryStats();

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of parts) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    const rows = categoryOrder
      .map((c) => ({ category: c, count: map.get(c) ?? 0 }))
      .filter((r) => r.count > 0);
    const max = Math.max(...rows.map((r) => r.count), 1);
    return { rows, max };
  }, []);

  const searchSuccess = state.history.length
    ? state.history.filter((h) => (h.confidence ?? 0) >= 0.7).length / state.history.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 kicker"><IconChart width={14} height={14} /> Reports</div>
        <h1 className="text-2xl font-extrabold text-ink-50">Reports</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Catalogue size" value={stats.totalParts.toLocaleString()} />
        <StatCard label="Stock value" value={aud(stats.inventoryValue)} accent hint={`${stats.totalUnits.toLocaleString()} units`} />
        <StatCard label="Search success" value={pct(searchSuccess)} hint="Confidence ≥ 70%" />
        <StatCard label="Orders" value={m.orders} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle kicker="Catalogue">Parts by system</SectionTitle>
          <div className="space-y-2">
            {byCategory.rows.map((r) => (
              <div key={r.category} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs text-ink-300">{r.category === 'Brake' ? 'Brakes' : r.category}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                  <div className="h-full rounded-full bg-iq-500" style={{ width: `${(r.count / byCategory.max) * 100}%` }} />
                </div>
                <span className="stat-num w-10 text-right text-xs font-semibold text-ink-200">{r.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle kicker="Stock health">Inventory status</SectionTitle>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-signal-green/30 bg-signal-green/5 py-4">
              <div className="stat-num text-2xl font-extrabold text-signal-green">{stats.inStock}</div>
              <div className="text-[11px] uppercase tracking-wide text-ink-400">In stock</div>
            </div>
            <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/5 py-4">
              <div className="stat-num text-2xl font-extrabold text-signal-amber">{stats.lowStock}</div>
              <div className="text-[11px] uppercase tracking-wide text-ink-400">Low</div>
            </div>
            <div className="rounded-lg border border-signal-red/30 bg-signal-red/5 py-4">
              <div className="stat-num text-2xl font-extrabold text-signal-red">{stats.outOfStock}</div>
              <div className="text-[11px] uppercase tracking-wide text-ink-400">Out</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-500">Figures derived from the live mock inventory across all suppliers.</p>
        </Card>
      </div>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { useAppStore, useDashboardMetrics } from '@/store/AppStore';
import { Card, StatCard, SectionTitle, EmptyState, ConfidenceMeter, PartThumb, StockBadge } from '@/components/ui';
import {
  IconSearch,
  IconCheck,
  IconDoc,
  IconTruck,
  IconTag,
  IconArrowRight,
  IconGauge,
  IconClock,
  IconBox,
  IconCar,
  IconStore,
} from '@/components/icons';
import { relativeTime } from '@/lib/format';
import { inventoryStats, filterInventory, totalStock } from '@/services/inventory';
import { partById } from '@/data/parts';
import type { Part } from '@/types';

const activityIcon = { search: IconSearch, rfq: IconDoc, quote: IconTag, order: IconTruck, alternative: IconStore } as const;

const popularIds = [
  'shock-front__veh-lc70__premium',
  'brake-pad-front__veh-hilux__premium',
  'leaf-spring-rear__veh-patrol-y61__premium',
  'wheel-bearing-front__veh-prado__premium',
  'alternator__veh-lc200__premium',
  'oil-filter__veh-prado__premium',
];

export function Dashboard() {
  const navigate = useNavigate();
  const { state } = useAppStore();
  const m = useDashboardMetrics();
  const stats = inventoryStats();

  const recentSearches = state.history.slice(0, 5);
  // Distinct recent vehicles from search history.
  const recentVehicles = Array.from(
    new Map(
      state.history.filter((h) => h.vehicleLabel).map((h) => [h.vehicleLabel!, h] as const),
    ).values(),
  ).slice(0, 6);

  const avgConfidence =
    state.history.length > 0
      ? state.history.reduce((s, h) => s + (h.confidence ?? 0), 0) / state.history.length
      : 0;

  const popular = popularIds.map((id) => partById(id)).filter((p): p is Part => Boolean(p));
  const alerts = [...filterInventory({ stock: 'out' }), ...filterInventory({ stock: 'low' })].slice(0, 5);
  const supplierActivity = state.activity.filter((a) => a.kind === 'quote' || a.kind === 'order').slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 kicker">
            <IconGauge width={14} height={14} /> Parts Counter
          </div>
          <h1 className="text-2xl font-extrabold text-ink-50">Today at the counter</h1>
        </div>
        <button onClick={() => navigate('/')} className="btn-primary font-display uppercase tracking-wide">
          <IconSearch width={16} height={16} /> Find a part
        </button>
      </div>

      {/* TODAY */}
      <div>
        <div className="mb-2 kicker">Today</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Searches" value={m.searchesToday} icon={<IconSearch width={18} height={18} />} />
          <StatCard label="Parts matched" value={m.successfulMatches} icon={<IconCheck width={18} height={18} />} />
          <StatCard label="Active RFQs" value={m.activeRfqs} icon={<IconDoc width={18} height={18} />} />
          <StatCard label="Orders" value={m.orders} icon={<IconTruck width={18} height={18} />} />
          <StatCard label="Low-stock parts" value={stats.lowStock + stats.outOfStock} accent icon={<IconBox width={18} height={18} />} hint="Needs attention" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent searches */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle kicker="Live">Recent searches</SectionTitle>
            <Link to="/history" className="text-xs font-semibold text-iq-400">All</Link>
          </div>
          {recentSearches.length === 0 ? (
            <EmptyState title="No searches yet" subtitle="Find a part to get started." />
          ) : (
            <ul className="space-y-1">
              {recentSearches.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => navigate('/search', { state: { input: h.input } })}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-900"
                  >
                    <ConfidenceMeter value={h.confidence} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-50">“{h.query}”</span>
                      <span className="block truncate text-xs text-ink-400">
                        {h.matchedPartName ? h.matchedPartName.split(' — ')[0] : 'No confident match'}
                        {h.vehicleLabel ? ` · ${h.vehicleLabel}` : ''}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-500">
                      <IconClock width={12} height={12} /> {relativeTime(h.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Fitment confidence + recent vehicles */}
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle kicker="Quality">Fitment confidence</SectionTitle>
            <div className="flex items-center gap-4">
              <ConfidenceMeter value={avgConfidence} size="lg" />
              <div className="text-sm text-ink-300">
                Average match confidence across recent searches.
                <div className="mt-1 text-xs text-ink-500">Higher is better — verify anything under 60%.</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle kicker="Rigs">Recent vehicles</SectionTitle>
            {recentVehicles.length === 0 ? (
              <EmptyState title="No vehicles yet" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {recentVehicles.map((h) => (
                  <button
                    key={h.vehicleLabel}
                    onClick={() => navigate('/search', { state: { input: h.input } })}
                    className="pill card-hover hover:text-iq-300"
                  >
                    <IconCar width={13} height={13} className="text-iq-400" />
                    {h.vehicleLabel}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Popular parts / Inventory alerts / Supplier activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle kicker="Fast movers">Popular 4WD parts</SectionTitle>
          <ul className="space-y-2">
            {popular.map((p) => (
              <li key={p.id}>
                <Link to={`/part/${p.id}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-ink-900">
                  <PartThumb part={p} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-50">{p.name.split(' — ')[0]}</span>
                    <span className="block truncate text-xs text-ink-400">{p.name.split(' — ')[1]}</span>
                  </span>
                  <IconArrowRight width={14} height={14} className="text-ink-500" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle kicker="Stock">Inventory alerts</SectionTitle>
            <Link to="/inventory" className="text-xs font-semibold text-iq-400">All</Link>
          </div>
          {alerts.length === 0 ? (
            <EmptyState title="Stock looks healthy" />
          ) : (
            <ul className="space-y-2">
              {alerts.map((p) => (
                <li key={p.id}>
                  <Link to={`/part/${p.id}`} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-ink-900">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-100">{p.name.split(' — ')[0]}</span>
                      <span className="block truncate text-[11px] text-ink-500">{p.name.split(' — ')[1]} · {totalStock(p)} units</span>
                    </span>
                    <StockBadge part={p} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle kicker="Trade">Supplier activity</SectionTitle>
          {supplierActivity.length === 0 ? (
            <EmptyState title="No supplier activity" />
          ) : (
            <ul className="space-y-1">
              {supplierActivity.map((a) => {
                const Icon = activityIcon[a.kind];
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-900">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 text-iq-400">
                      <Icon width={16} height={16} />
                    </span>
                    <span className="flex-1 text-sm text-ink-100">{a.label}</span>
                    <span className="text-[11px] text-ink-500">{relativeTime(a.at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

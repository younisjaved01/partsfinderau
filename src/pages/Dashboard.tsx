import { Link, useNavigate } from 'react-router-dom';
import { useAppStore, useDashboardMetrics } from '@/store/AppStore';
import { Card, StatCard, SectionTitle, EmptyState } from '@/components/ui';
import {
  IconSearch,
  IconCheck,
  IconDoc,
  IconTruck,
  IconTag,
  IconSpark,
  IconArrowRight,
  IconGauge,
  IconClock,
} from '@/components/icons';
import { aud, relativeTime } from '@/lib/format';
import { catalogueSize } from '@/data/parts';

const activityIcon = {
  search: IconSearch,
  rfq: IconDoc,
  quote: IconTag,
  order: IconTruck,
  alternative: IconSpark,
} as const;

export function Dashboard() {
  const navigate = useNavigate();
  const { state } = useAppStore();
  const m = useDashboardMetrics();

  const activeRfqs = state.rfqs.filter((r) => r.status === 'open' || r.status === 'partial');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
            <IconGauge width={14} height={14} /> Dashboard
          </div>
          <h1 className="text-2xl font-extrabold text-ink-50">Parts counter overview</h1>
        </div>
        <button onClick={() => navigate('/')} className="btn-primary">
          <IconSearch width={16} height={16} /> Find a part
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Searched today" value={m.searchesToday} icon={<IconSearch width={18} height={18} />} />
        <StatCard label="Successful matches" value={m.successfulMatches} icon={<IconCheck width={18} height={18} />} />
        <StatCard label="Active RFQs" value={m.activeRfqs} icon={<IconDoc width={18} height={18} />} />
        <StatCard label="Orders" value={m.orders} icon={<IconTruck width={18} height={18} />} />
        <StatCard label="Potential savings" value={aud(m.potentialSavings)} accent icon={<IconTag width={18} height={18} />} hint="vs OEM list" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="p-5 lg:col-span-2">
          <SectionTitle kicker="Live">Recent activity</SectionTitle>
          {state.activity.length === 0 ? (
            <EmptyState title="No activity yet" subtitle="Run a search to get started." />
          ) : (
            <ul className="space-y-1">
              {state.activity.slice(0, 8).map((a) => {
                const Icon = activityIcon[a.kind];
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-900">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 text-iq-400">
                      <Icon width={16} height={16} />
                    </span>
                    <span className="flex-1 text-sm text-ink-100">{a.label}</span>
                    <span className="flex items-center gap-1 text-xs text-ink-500">
                      <IconClock width={12} height={12} /> {relativeTime(a.at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Active RFQs snapshot */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle kicker="Sourcing">Active RFQs</SectionTitle>
            <Link to="/rfqs" className="text-xs font-semibold text-iq-400">All</Link>
          </div>
          {activeRfqs.length === 0 ? (
            <EmptyState title="No open RFQs" />
          ) : (
            <ul className="space-y-2">
              {activeRfqs.slice(0, 4).map((r) => {
                const responded = r.quotes.filter((q) => q.status !== 'waiting').length;
                return (
                  <Link key={r.id} to="/rfqs" className="block rounded-lg border border-ink-700 bg-ink-900 p-3 hover:border-iq-600/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink-50">{r.reference}</span>
                      <span className="text-xs text-ink-400">{responded}/{r.quotes.length} responses</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-ink-400">{r.partName.split(' — ')[0]}</div>
                  </Link>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink to="/" title="Multimodal search" desc="Photo, voice, text or vehicle" icon={<IconSpark width={18} height={18} />} />
        <QuickLink to="/inventory" title="Inventory" desc={`${catalogueSize} parts tracked`} icon={<IconGauge width={18} height={18} />} />
        <QuickLink to="/supplier-portal" title="Supplier portal" desc="Manage catalogue & RFQs" icon={<IconTruck width={18} height={18} />} />
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="card card-hover group flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-iq-500/10 text-iq-400">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-bold text-ink-50">{title}</div>
        <div className="text-xs text-ink-400">{desc}</div>
      </div>
      <IconArrowRight width={16} height={16} className="text-ink-500 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

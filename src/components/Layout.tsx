import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FourWDBackground } from './ui/FourWDBackground';
import { getLlmStatus } from '@/services/llm/client';
import type { LlmStatus } from '@/services/llm/types';
import {
  LogoMark,
  IconGauge,
  IconSearch,
  IconGrid,
  IconBox,
  IconStore,
  IconDoc,
  IconTag,
  IconTruck,
  IconClock,
  IconSettings,
  IconMenu,
  IconX,
  IconCar,
  IconShield,
  IconArrowRight,
  IconSales,
  IconChart,
  IconUser,
} from './icons';
import { useAppStore } from '@/store/AppStore';
import { isDemoMode } from '@/services/integrations';
import { catalogueSize } from '@/data/parts';
import { vehicles } from '@/data/vehicles';

interface NavEntry {
  to: string;
  label: string;
  icon: (p: { width?: number; height?: number }) => JSX.Element;
  badge?: () => number;
  end?: boolean;
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const { quoteCount, state } = useAppStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Strongest motion on the Find Parts hero; subtle everywhere else.
  const bgIntensity = pathname === '/' ? 'hero' : 'ambient';

  // Reflect the real reasoning provider (offline mock vs live OpenAI).
  const [llm, setLlm] = useState<LlmStatus | null>(null);
  useEffect(() => {
    getLlmStatus().then(setLlm).catch(() => setLlm({ provider: 'mock' }));
  }, []);

  const activeRfqs = state.rfqs.filter((r) => r.status === 'open' || r.status === 'partial').length;

  // Primary workflow: Vehicle → System → Part → Fitment → Supplier → Sourcing.
  const primary: NavEntry[] = [
    { to: '/dashboard', label: 'Dashboard', icon: IconGauge },
    { to: '/catalogue', label: 'Catalogue', icon: IconGrid },
    { to: '/vehicles', label: 'Vehicles', icon: IconCar },
    { to: '/inventory', label: 'Inventory', icon: IconBox },
  ];
  const sourcing: NavEntry[] = [
    { to: '/suppliers', label: 'Suppliers', icon: IconStore },
    { to: '/rfqs', label: 'RFQs', icon: IconDoc, badge: () => activeRfqs },
    { to: '/quotes', label: 'Quotes', icon: IconTag, badge: () => quoteCount },
    { to: '/orders', label: 'Orders', icon: IconTruck },
  ];
  const business: NavEntry[] = [
    { to: '/sales', label: 'Sales', icon: IconSales },
    { to: '/customers', label: 'Customers', icon: IconUser },
    { to: '/reports', label: 'Reports', icon: IconChart },
  ];
  const secondary: NavEntry[] = [
    { to: '/history', label: 'Search History', icon: IconClock },
    { to: '/supplier-portal', label: 'Supplier Portal', icon: IconShield },
    { to: '/settings', label: 'Settings', icon: IconSettings },
  ];

  const navItem = (n: NavEntry) => {
    const Icon = n.icon;
    const count = n.badge?.() ?? 0;
    return (
      <NavLink
        key={n.to}
        to={n.to}
        end={n.end}
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-iq-500/10 text-iq-300 ring-1 ring-inset ring-iq-500/30'
              : 'text-ink-300 hover:bg-ink-800 hover:text-ink-50'
          }`
        }
      >
        <Icon width={18} height={18} />
        <span>{n.label}</span>
        {count > 0 && (
          <span className="stat-num ml-auto rounded-full bg-iq-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">
            {count}
          </span>
        )}
      </NavLink>
    );
  };

  const groupLabel = (label: string) => (
    <div className="mb-1 mt-3 flex items-center gap-2 px-3">
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-500">{label}</span>
      <div className="h-px flex-1 bg-ink-800" />
    </div>
  );

  return (
    <div className="relative min-h-screen text-ink-100">
      {/* Signature animated 4WD backdrop — sits behind all content */}
      <FourWDBackground className="fixed inset-0 z-0" intensity={bgIntensity} />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-800 bg-ink-900/95 backdrop-blur transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-ink-800 px-5 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-iq-500 text-ink-950 shadow-glow">
            <LogoMark width={24} height={24} />
          </div>
          <div className="leading-none">
            <div className="font-display text-xl font-extrabold uppercase tracking-wide text-ink-50">
              Parts<span className="text-iq-400">IQ</span>
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              4WD Parts Intelligence
            </div>
          </div>
          <button className="ml-auto text-ink-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <IconX />
          </button>
        </div>

        {/* Dominant Find Parts action */}
        <div className="px-3 pt-3">
          <NavLink
            to="/"
            end
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3.5 font-display text-base font-bold uppercase tracking-wide transition ${
                isActive
                  ? 'bg-iq-500 text-ink-950'
                  : 'bg-iq-500/15 text-iq-200 ring-1 ring-inset ring-iq-500/40 hover:bg-iq-500/25'
              }`
            }
          >
            <span className="absolute inset-0 bg-tread opacity-30" />
            <IconSearch width={20} height={20} className="relative" />
            <span className="relative">Find Parts</span>
            <IconArrowRight width={18} height={18} className="relative ml-auto opacity-70 transition-transform group-hover:translate-x-0.5" />
          </NavLink>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {primary.map(navItem)}
          {groupLabel('Sourcing')}
          {sourcing.map(navItem)}
          {groupLabel('Business')}
          {business.map(navItem)}
          {groupLabel('More')}
          {secondary.map(navItem)}
        </nav>

        <div className="border-t border-ink-800 p-3">
          <div className="relative overflow-hidden rounded-lg border border-ink-700 bg-ink-850 p-3">
            <div className="absolute inset-0 bg-topo opacity-70" />
            <div className="relative flex items-center gap-2 text-xs font-semibold text-ink-200">
              <LogoMark width={14} height={14} className="text-iq-400" />
              4WD Catalogue
            </div>
            <div className="stat-num relative mt-1 text-[11px] text-ink-400">
              {catalogueSize.toLocaleString()} parts · {vehicles.length} vehicles · 5 suppliers
            </div>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="relative z-10 lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-800 bg-ink-950/85 px-4 py-3 backdrop-blur">
          <button className="text-ink-300 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <IconMenu />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-300 transition hover:border-iq-600/50 hover:text-ink-50"
          >
            <IconSearch width={16} height={16} />
            <span className="hidden sm:inline">Find a part…</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            {llm?.provider === 'openai' ? (
              <span className="pill border-signal-green/40 bg-signal-green/10 text-signal-green" title={`Live AI reasoning · ${llm.model}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
                AI · {llm.model}
              </span>
            ) : (
              isDemoMode() && (
                <span className="pill border-iq-500/40 bg-iq-500/10 text-iq-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-iq-400" />
                  Demo Mode
                </span>
              )
            )}
            <button
              onClick={() => navigate('/quotes')}
              className="relative rounded-lg border border-ink-700 bg-ink-900 p-2 text-ink-300 transition hover:text-ink-50"
              aria-label="Quote basket"
            >
              <IconTag width={18} height={18} />
              {quoteCount > 0 && (
                <span className="stat-num absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-iq-500 px-1 text-[10px] font-bold text-ink-950">
                  {quoteCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

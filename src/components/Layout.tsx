import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  IconSpark,
} from './icons';
import { useAppStore } from '@/store/AppStore';
import { isDemoMode } from '@/services/integrations';
import { catalogueSize } from '@/data/parts';

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

  const activeRfqs = state.rfqs.filter((r) => r.status === 'open' || r.status === 'partial').length;

  const nav: NavEntry[] = [
    { to: '/dashboard', label: 'Dashboard', icon: IconGauge },
    { to: '/', label: 'Find Parts', icon: IconSearch, end: true },
    { to: '/parts', label: 'Parts', icon: IconGrid },
    { to: '/inventory', label: 'Inventory', icon: IconBox },
    { to: '/suppliers', label: 'Suppliers', icon: IconStore },
    { to: '/rfqs', label: 'RFQs', icon: IconDoc, badge: () => activeRfqs },
    { to: '/quotes', label: 'Quotes', icon: IconTag, badge: () => quoteCount },
    { to: '/orders', label: 'Orders', icon: IconTruck },
    { to: '/history', label: 'Search History', icon: IconClock },
    { to: '/supplier-portal', label: 'Supplier Portal', icon: IconStore },
    { to: '/settings', label: 'Settings', icon: IconSettings },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-800 bg-ink-900/95 backdrop-blur transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-iq-500 text-ink-950">
            <LogoMark width={22} height={22} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-ink-50">
              PARTS<span className="text-iq-400"> IQ</span>
            </div>
            <div className="text-[10px] text-ink-400">Find any part. From any clue.</div>
          </div>
          <button className="ml-auto text-ink-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <IconX />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {nav.map((n) => {
            const Icon = n.icon;
            const count = n.badge?.() ?? 0;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-iq-500/10 text-iq-300 ring-1 ring-inset ring-iq-500/30'
                      : 'text-ink-300 hover:bg-ink-800 hover:text-ink-50'
                  }`
                }
              >
                <Icon width={18} height={18} />
                <span>{n.label}</span>
                {count > 0 && (
                  <span className="ml-auto rounded-full bg-iq-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">
                    {count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-ink-800 p-3">
          <div className="rounded-lg bg-ink-850 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-200">
              <IconSpark width={14} height={14} className="text-iq-400" />
              Catalogue
            </div>
            <div className="mt-1 text-[11px] text-ink-400">
              {catalogueSize} parts · 12 vehicles · 5 suppliers
            </div>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="lg:pl-64">
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
            {isDemoMode() && (
              <span className="pill border-iq-500/40 bg-iq-500/10 text-iq-300">
                <span className="h-1.5 w-1.5 rounded-full bg-iq-400 animate-pulse" />
                Demo Mode
              </span>
            )}
            <button
              onClick={() => navigate('/quotes')}
              className="relative rounded-lg border border-ink-700 bg-ink-900 p-2 text-ink-300 transition hover:text-ink-50"
              aria-label="Quote basket"
            >
              <IconTag width={18} height={18} />
              {quoteCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-iq-500 px-1 text-[10px] font-bold text-ink-950">
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

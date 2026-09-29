import { useLocation, useNavigate } from 'react-router-dom';
import { SearchConsole } from '@/components/SearchConsole';
import { demoScenarios } from '@/data/demoScenarios';
import { catalogueSize } from '@/data/parts';
import {
  IconCamera,
  IconMic,
  IconCar,
  IconHash,
  IconArrowRight,
  IconWrench,
  IconTopo,
  CategoryIcon,
} from '@/components/icons';
import type { PartCategory, VehicleQuery } from '@/types';

const popular = ['Suspension', 'Shock absorbers', 'Wheel bearings', 'Brake pads', 'Radius arm bushes', 'Clutch kit', 'Leaf springs'];

const modalities = [
  { icon: IconCar, label: 'Vehicle' },
  { icon: IconWrench, label: 'Description' },
  { icon: IconHash, label: 'Part number' },
  { icon: IconCamera, label: 'Photo' },
  { icon: IconMic, label: 'Voice' },
];

const categories: PartCategory[] = [
  'Suspension', 'Brake', 'Steering', 'Driveline', 'Engine', 'Cooling',
  'Electrical', 'Bearings', 'Clutch', 'Transmission', 'Exhaust', 'Filters', 'Body',
];

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const vehicle = (location.state as { vehicle?: VehicleQuery } | null)?.vehicle;

  const runText = (text: string) => navigate('/search', { state: { input: { text } } });

  return (
    <div className="space-y-7">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-900 via-ink-900 to-ink-850 px-5 py-8 sm:px-8 sm:py-9">
        <div className="absolute inset-0 bg-topo opacity-80" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-iq-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-iq-500/30 bg-iq-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-iq-300">
            <IconTopo width={14} height={14} /> Parts Intelligence · Australian 4WD
          </div>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink-50 sm:text-5xl">
            Find the right<br />
            <span className="text-iq-400">4WD part, faster.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink-200 sm:text-base">
            Search by vehicle, description, part number, photo or voice. PARTS IQ understands how
            interpreters actually talk — “shockey for a 79”, “patrol radius arm bushes” — and finds
            the right part, its fitment, stock and suppliers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {modalities.map((m) => (
              <span key={m.label} className="pill">
                <m.icon width={14} height={14} className="text-iq-400" />
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Search console (vehicle-first) */}
      <SearchConsole variant="hero" initial={vehicle ? { vehicle } : undefined} />

      {/* Popular searches */}
      <section>
        <div className="mb-2 kicker">Popular 4WD searches</div>
        <div className="flex flex-wrap gap-2">
          {popular.map((p) => (
            <button key={p} onClick={() => runText(p)} className="pill card-hover hover:text-iq-300">
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Systems / categories */}
      <section>
        <div className="mb-3 kicker">Browse by system</div>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => navigate(`/parts?category=${c}`)}
              className="card card-hover flex flex-col items-center gap-2 p-3 text-center"
            >
              <CategoryIcon category={c} width={24} height={24} className="text-iq-400" />
              <span className="text-[11px] font-medium text-ink-200">{c === 'Brake' ? 'Brakes' : c}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Demo scenarios */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="kicker">Demo Mode</div>
            <h2 className="text-lg font-bold text-ink-50">Try a live example</h2>
          </div>
          <span className="stat-num hidden text-xs text-ink-400 sm:block">No external API required · {catalogueSize.toLocaleString()} mock parts</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoScenarios.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate('/search', { state: { input: d.input } })}
              className="card card-hover group flex flex-col p-4 text-left"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-ink-50">
                <IconWrench width={15} height={15} className="text-iq-400" />
                {d.label}
              </div>
              <p className="mt-1.5 flex-1 text-xs text-ink-400">{d.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-iq-400 transition-all group-hover:gap-2">
                Run search <IconArrowRight width={14} height={14} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

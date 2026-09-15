import { useNavigate } from 'react-router-dom';
import { SearchConsole } from '@/components/SearchConsole';
import { demoScenarios } from '@/data/demoScenarios';
import { catalogueSize } from '@/data/parts';
import {
  IconSpark,
  IconCamera,
  IconMic,
  IconCar,
  IconHash,
  IconArrowRight,
  CategoryIcon,
} from '@/components/icons';
import type { PartCategory } from '@/types';

const popular = ['Brake pads', 'Suspension', 'Filters', 'Clutches', 'Bearings', 'Sensors'];

const modalities = [
  { icon: IconCamera, label: 'Photo' },
  { icon: IconMic, label: 'Voice' },
  { icon: IconHash, label: 'Part number' },
  { icon: IconCar, label: 'Vehicle' },
];

const featuredCats: PartCategory[] = ['Brake', 'Suspension', 'Steering', 'Filters', 'Electrical', 'Driveline'];

export function Home() {
  const navigate = useNavigate();

  const runText = (text: string) => navigate('/search', { state: { input: { text } } });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-900 via-ink-900 to-ink-850 px-5 py-8 sm:px-8 sm:py-10">
        <div className="absolute inset-0 bg-grid-faint [background-size:26px_26px] opacity-40" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-iq-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-iq-500/30 bg-iq-500/10 px-3 py-1 text-xs font-semibold text-iq-300">
            <IconSpark width={14} height={14} /> Parts Intelligence Engine
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink-50 sm:text-4xl">
            Find the right part.
            <br />
            <span className="text-iq-400">Without knowing the part number.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-300 sm:text-base">
            Search by photo, voice, text or vehicle. AI identifies the part and finds compatible
            options, cross references, stock and suppliers — from any clue you have.
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

      {/* Search console */}
      <SearchConsole variant="hero" />

      {/* Popular searches */}
      <section>
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-400">Popular searches</div>
        <div className="flex flex-wrap gap-2">
          {popular.map((p) => (
            <button key={p} onClick={() => runText(p)} className="pill card-hover hover:text-iq-300">
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Demo scenarios */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-iq-500">Demo Mode</div>
            <h2 className="text-lg font-bold text-ink-50">Try a live example</h2>
          </div>
          <span className="hidden text-xs text-ink-400 sm:block">No external API required · {catalogueSize} mock parts</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoScenarios.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate('/search', { state: { input: d.input } })}
              className="card card-hover group flex flex-col p-4 text-left"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-50">
                <IconSpark width={15} height={15} className="text-iq-400" />
                {d.label}
              </div>
              <p className="mt-1.5 flex-1 text-xs text-ink-400">{d.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-iq-400 group-hover:gap-2 transition-all">
                Run search <IconArrowRight width={14} height={14} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Browse categories */}
      <section>
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">Browse by category</div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {featuredCats.map((c) => (
            <button
              key={c}
              onClick={() => navigate(`/parts?category=${c}`)}
              className="card card-hover flex flex-col items-center gap-2 p-4 text-center"
            >
              <CategoryIcon category={c} width={26} height={26} className="text-iq-400" />
              <span className="text-xs font-medium text-ink-200">{c}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

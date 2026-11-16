import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { BuildMod, Part, QualityTier } from '@/types';
import { useAppStore } from '@/store/AppStore';
import {
  buildVehicle,
  buildVehicleLabel,
  buildValue,
  buildStats,
  modsByCategory,
  modPart,
  relatedBuilds,
  statusMeta,
} from '@/services/builds';
import { checkFitment } from '@/services/vehicleFitment';
import { bestPrice } from '@/services/inventory';
import { Card, PartThumb, FitmentBadge, StockBadge, QualityBadge, SectionTitle } from '@/components/ui';
import { BuildCard } from '@/components/community/BuildCard';
import { aud, relativeTime } from '@/lib/format';
import {
  IconHeart,
  IconCart,
  IconArrowRight,
  IconCar,
  IconUser,
  IconWrench,
  IconExternal,
  IconCheck,
} from '@/components/icons';

export function BuildDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, likeBuild, shopBuild, addToQuote } = useAppStore();
  const [shopped, setShopped] = useState(0);

  const build = state.builds.find((b) => b.id === id);

  if (!build) {
    return (
      <div className="py-20 text-center">
        <div className="text-ink-300">Build not found.</div>
        <button onClick={() => navigate('/community')} className="btn-ghost mt-4">Back to builds</button>
      </div>
    );
  }

  const vehicle = buildVehicle(build);
  const vq = vehicle ? { make: vehicle.make, model: vehicle.model, series: vehicle.series ?? vehicle.chassis } : {};
  const stats = buildStats(build);
  const value = buildValue(build);
  const groups = modsByCategory(build);
  const related = relatedBuilds(build, state.builds);

  const doShop = () => {
    const n = shopBuild(build);
    setShopped(n);
  };

  return (
    <div>
      <button onClick={() => navigate('/community')} className="mb-3 text-sm text-ink-400 hover:text-ink-100">← Rig Builds</button>

      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="relative h-44 border-b border-ink-700 bg-gradient-to-br from-ink-800 to-ink-950 sm:h-52">
          <div className="absolute inset-0 bg-topo opacity-80" />
          <div className="absolute inset-0 bg-tread opacity-25" />
          <div className="absolute inset-0 grid place-items-center text-iq-500/60"><IconCar width={88} height={88} /></div>
          {build.featured && (
            <span className="absolute left-3 top-3 rounded-md border border-iq-500/50 bg-iq-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-iq-300">Featured build</span>
          )}
          <span className="absolute right-3 top-3 rounded-md border border-ink-600 bg-ink-900/80 px-2 py-0.5 text-[11px] font-semibold text-ink-200">{build.region}</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-ink-50">{build.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <Link to="/vehicles" className="font-semibold text-iq-400 hover:underline">{buildVehicleLabel(build)}</Link>
                <span className="text-ink-600">·</span>
                <span className="flex items-center gap-1 text-ink-300"><IconUser width={13} height={13} /> {build.owner} <span className="text-ink-500">{build.ownerHandle}</span></span>
                <span className="text-ink-600">·</span>
                <span className="text-ink-500">{relativeTime(build.createdAt)}</span>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-ink-300">{build.tagline}</p>
            </div>
            <button
              onClick={() => likeBuild(build.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                build.likedByMe ? 'border-signal-red/50 bg-signal-red/10 text-signal-red' : 'border-ink-700 bg-ink-900 text-ink-200 hover:text-ink-50'
              }`}
            >
              <IconHeart width={16} height={16} className={build.likedByMe ? 'fill-current' : ''} />
              <span className="stat-num">{build.likes}</span>
            </button>
          </div>

          {/* Stat strip + shop CTA */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-ink-700/70 pt-4">
            <Stat label="Mods" value={stats.mods} />
            <Stat label="Fitted" value={stats.fitted} />
            <Stat label="Shoppable" value={stats.linked} />
            {value > 0 && <Stat label="Parts value" value={aud(value)} />}
            <div className="ml-auto flex items-center gap-2">
              {shopped > 0 && (
                <span className="flex items-center gap-1 text-sm font-semibold text-signal-green">
                  <IconCheck width={15} height={15} /> {shopped} added
                </span>
              )}
              <button onClick={doShop} disabled={stats.linked === 0} className="btn-primary">
                <IconCart width={16} height={16} /> Shop this build ({stats.linked})
              </button>
              {shopped > 0 && (
                <button onClick={() => navigate('/quotes')} className="btn-ghost">
                  View quote <IconArrowRight width={15} height={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Mods list */}
        <div className="lg:col-span-2">
          <SectionTitle kicker="Build sheet">Mods &amp; parts</SectionTitle>
          <div className="space-y-4">
            {groups.map((g) => (
              <Card key={g.category} className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-ink-700 bg-ink-900/60 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-ink-300">
                  <IconWrench width={13} height={13} className="text-ink-500" /> {g.category}
                </div>
                <div className="divide-y divide-ink-800">
                  {g.mods.map((mod) => <ModRow key={mod.id} mod={mod} vq={vq} onAdd={(p) => addToQuote(p.id, 1)} />)}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Side: story + specs + owner */}
        <div className="space-y-4">
          <Card className="p-4">
            <SectionTitle kicker="The rig">Owner notes</SectionTitle>
            <p className="text-sm leading-relaxed text-ink-300">{build.story}</p>
          </Card>
          <Card className="p-4">
            <div className="kicker mb-2">Setup</div>
            <dl className="space-y-1.5 text-sm">
              {build.specs.map((s) => (
                <div key={s.label} className="flex items-center justify-between border-b border-ink-800 pb-1.5">
                  <dt className="text-ink-400">{s.label}</dt>
                  <dd className="font-semibold text-ink-100">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11px] text-ink-500">Owner-described setup — not catalogue data.</p>
          </Card>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-6">
          <SectionTitle kicker="More like this">Related builds</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((b, i) => <BuildCard key={b.id} build={b} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="stat-num text-xl font-bold leading-none text-ink-50">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">{label}</div>
    </div>
  );
}

function ModRow({ mod, vq, onAdd }: { mod: BuildMod; vq: Record<string, string | undefined>; onAdd: (p: Part) => void }) {
  const part = modPart(mod);
  const status = statusMeta[mod.status];
  const tier = part ? (part.id.split('__')[2] as QualityTier) : undefined;
  const fit = part ? checkFitment(part, vq) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-4 py-3">
      {part ? (
        <PartThumb part={part} size="sm" />
      ) : (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-dashed border-ink-700 bg-ink-900 text-ink-600"><IconWrench width={18} height={18} /></div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink-100">{mod.title}</span>
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.cls}`}>{status.label}</span>
        </div>
        {part ? (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-iq-400">{part.partNumber}</span>
            {tier && <QualityBadge tier={tier} />}
            {fit && <FitmentBadge score={fit.confidence} size="sm" />}
            <StockBadge part={part} />
          </div>
        ) : (
          <div className="mt-0.5 text-xs text-ink-500">{mod.note ?? 'No catalogue part — custom / fabricated item'}</div>
        )}
      </div>

      {part && (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="stat-num text-sm font-bold text-ink-50">{aud(bestPrice(part))}</span>
          <div className="flex items-center gap-1">
            <Link to={`/part/${part.id}`} className="rounded-md border border-ink-700 bg-ink-900 p-1.5 text-ink-300 hover:text-ink-100" title="View part"><IconExternal width={14} height={14} /></Link>
            <button onClick={() => onAdd(part)} className="rounded-md border border-iq-600/50 bg-iq-500/10 px-2 py-1 text-xs font-semibold text-iq-300 hover:bg-iq-500/20">Add</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

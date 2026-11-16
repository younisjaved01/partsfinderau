import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Build } from '@/types';
import { buildVehicleLabel, buildValue, buildStats } from '@/services/builds';
import { useAppStore } from '@/store/AppStore';
import { IconCar, IconHeart, IconWrench } from '@/components/icons';
import { aud } from '@/lib/format';

/** A rig-build tile for the community feed. */
export function BuildCard({ build, index = 0 }: { build: Build; index?: number }) {
  const navigate = useNavigate();
  const { likeBuild } = useAppStore();
  const stats = buildStats(build);
  const value = buildValue(build);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
      onClick={() => navigate(`/community/${build.id}`)}
      className="card card-hover group cursor-pointer overflow-hidden"
    >
      {/* Hero tile */}
      <div className="relative h-32 overflow-hidden border-b border-ink-700 bg-gradient-to-br from-ink-800 to-ink-950">
        <div className="absolute inset-0 bg-topo opacity-80" />
        <div className="absolute inset-0 bg-tread opacity-30" />
        <div className="absolute inset-0 grid place-items-center text-iq-500/70 transition-transform duration-300 group-hover:scale-105">
          <IconCar width={56} height={56} />
        </div>
        {build.featured && (
          <span className="absolute left-2 top-2 rounded-md border border-iq-500/50 bg-iq-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-iq-300">
            Featured
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-md border border-ink-600 bg-ink-900/80 px-2 py-0.5 text-[10px] font-semibold text-ink-200">
          {build.region}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold leading-tight text-ink-50">{build.title}</h3>
            <div className="mt-0.5 text-xs font-semibold text-iq-400">{buildVehicleLabel(build)}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); likeBuild(build.id); }}
            className={`flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${
              build.likedByMe
                ? 'border-signal-red/50 bg-signal-red/10 text-signal-red'
                : 'border-ink-700 bg-ink-900 text-ink-300 hover:text-ink-100'
            }`}
            aria-label="Like build"
          >
            <IconHeart width={14} height={14} className={build.likedByMe ? 'fill-current' : ''} />
            <span className="stat-num">{build.likes}</span>
          </button>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-ink-300">{build.tagline}</p>

        <div className="mt-3 flex items-center justify-between border-t border-ink-700/70 pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-ink-300">
            <IconWrench width={13} height={13} className="text-ink-500" />
            {stats.mods} mods · {stats.linked} shoppable
          </span>
          {value > 0 && (
            <span className="stat-num font-semibold text-ink-100">{aud(value)}</span>
          )}
        </div>
        <div className="mt-2 text-[11px] text-ink-500">by <span className="text-ink-300">{build.ownerHandle}</span></div>
      </div>
    </motion.article>
  );
}

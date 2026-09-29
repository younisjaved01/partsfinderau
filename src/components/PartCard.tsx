import { useNavigate } from 'react-router-dom';
import type { Part } from '@/types';
import { PartThumb, StockBadge, QualityBadge, FitmentBadge } from './ui';
import { IconArrowRight, IconPlus, IconTag, IconCheck, IconTruck } from './icons';
import { brandById } from '@/data/brands';
import { bestPrice } from '@/services/inventory';
import { bestOffer } from '@/services/suppliers';
import { fastestDispatch } from '@/lib/fitment';
import { aud } from '@/lib/format';
import { useAppStore } from '@/store/AppStore';

function tierOf(part: Part) {
  const t = part.specs.Tier ?? '';
  if (t.includes('OEM')) return 'oem' as const;
  if (t.includes('Premium')) return 'premium' as const;
  if (t.includes('Budget')) return 'budget' as const;
  return 'standard' as const;
}

export function PartCard({
  part,
  score,
  reasons,
  onRequestQuote,
  highlight = false,
}: {
  part: Part;
  score?: number;
  reasons?: string[];
  onRequestQuote?: (part: Part) => void;
  highlight?: boolean;
}) {
  const navigate = useNavigate();
  const { addToQuote } = useAppStore();
  const brand = brandById(part.brandId);
  const price = bestPrice(part);
  const offer = bestOffer(part);
  const dispatch = fastestDispatch(part);
  const shortName = part.name.split(' — ')[0];

  // Status stripe colour: fitment verdict when scored, else stock state.
  const stripe =
    score != null
      ? score >= 0.85
        ? 'bg-signal-green'
        : score >= 0.6
          ? 'bg-signal-amber'
          : 'bg-signal-red'
      : 'bg-ink-600';

  return (
    <div className={`card card-hover relative flex flex-col overflow-hidden p-4 pl-5 ${highlight ? 'ring-1 ring-iq-500/40 shadow-glow' : ''}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${stripe}`} />
      <div className="flex gap-3">
        <PartThumb part={part} />
        <div className="min-w-0 flex-1">
          <button onClick={() => navigate(`/part/${part.id}`)} className="block min-w-0 text-left">
            <div className="truncate font-display text-base font-bold uppercase tracking-wide text-ink-50 hover:text-iq-300">
              {shortName}
            </div>
          </button>
          <div className="mt-0.5 truncate text-xs text-ink-400">
            {brand?.name} · {part.category}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <QualityBadge tier={tierOf(part)} />
            <span className="font-mono text-[11px] text-ink-300">{part.partNumber}</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-ink-500">OEM {part.oemNumber}</div>
        </div>
      </div>

      {score != null && (
        <div className="mt-3">
          <FitmentBadge score={score} size="sm" />
        </div>
      )}

      {reasons && reasons.length > 0 && (
        <ul className="mt-2 space-y-1">
          {reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[11px] text-ink-300">
              <IconCheck width={12} height={12} className="text-signal-green" />
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="stat-num text-xl font-extrabold text-ink-50">{aud(price)}</div>
            {offer && <div className="text-[11px] text-ink-400">{offer.supplier.name}</div>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <StockBadge part={part} />
            {dispatch && dispatch !== 'Available today' && (
              <span className="flex items-center gap-1 text-[11px] text-ink-500">
                <IconTruck width={12} height={12} /> {dispatch}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={() => navigate(`/part/${part.id}`)} className="btn-subtle flex-1 px-3 py-2 text-xs">
            View Part <IconArrowRight width={14} height={14} />
          </button>
          <button onClick={() => addToQuote(part.id)} className="btn-ghost px-3 py-2 text-xs" title="Add to quote">
            <IconPlus width={14} height={14} />
          </button>
          {onRequestQuote && (
            <button onClick={() => onRequestQuote(part)} className="btn-ghost px-3 py-2 text-xs" title="Request quote">
              <IconTag width={14} height={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

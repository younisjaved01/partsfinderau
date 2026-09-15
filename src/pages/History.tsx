import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/AppStore';
import { Card, ConfidenceMeter, EmptyState } from '@/components/ui';
import { IconClock, IconCamera, IconMic, IconCar, IconHash, IconSearch, IconArrowRight } from '@/components/icons';
import { relativeTime } from '@/lib/format';
import type { SearchModality } from '@/types';

const modalityIcon: Record<SearchModality, (p: { width?: number; height?: number; className?: string }) => JSX.Element> = {
  text: IconSearch,
  image: IconCamera,
  voice: IconMic,
  vehicle: IconCar,
  partNumber: IconHash,
};

export function History() {
  const navigate = useNavigate();
  const { state } = useAppStore();

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
          <IconClock width={14} height={14} /> History
        </div>
        <h1 className="text-2xl font-extrabold text-ink-50">Search history</h1>
      </div>

      {state.history.length === 0 ? (
        <EmptyState title="No searches yet" subtitle="Your recent searches will appear here and can be reopened." icon={<IconClock width={28} height={28} />} />
      ) : (
        <div className="space-y-2">
          {state.history.map((h) => (
            <Card key={h.id} className="card-hover flex items-center gap-3 p-4">
              <ConfidenceMeter value={h.confidence} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink-50">“{h.query}”</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-400">
                  {h.matchedPartName && <span className="truncate">→ {h.matchedPartName.split(' — ')[0]}</span>}
                  {h.vehicleLabel && <span className="text-ink-500">· {h.vehicleLabel}</span>}
                  <span className="text-ink-500">· {relativeTime(h.createdAt)}</span>
                </div>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                {h.modalities.map((m) => {
                  const Icon = modalityIcon[m];
                  return (
                    <span key={m} className="grid h-6 w-6 place-items-center rounded-md bg-ink-800 text-ink-400" title={m}>
                      <Icon width={13} height={13} />
                    </span>
                  );
                })}
              </div>
              <button
                onClick={() => navigate('/search', { state: { input: h.input } })}
                className="btn-ghost px-3 py-2 text-xs"
              >
                Reopen <IconArrowRight width={13} height={13} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

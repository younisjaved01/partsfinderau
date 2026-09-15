import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/AppStore';
import { supplierById } from '@/data/suppliers';
import { Card, EmptyState } from '@/components/ui';
import { IconDoc, IconClock, IconCheck, IconX } from '@/components/icons';
import { aud, relativeTime } from '@/lib/format';
import type { Rfq } from '@/types';

const statusStyle: Record<Rfq['status'], string> = {
  open: 'border-signal-blue/40 bg-signal-blue/10 text-signal-blue',
  partial: 'border-signal-amber/40 bg-signal-amber/10 text-signal-amber',
  complete: 'border-signal-green/40 bg-signal-green/10 text-signal-green',
  awarded: 'border-iq-500/40 bg-iq-500/10 text-iq-300',
  cancelled: 'border-ink-600 bg-ink-800 text-ink-400',
};

export function Rfqs() {
  const { state, awardRfq, cancelRfq } = useAppStore();

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
          <IconDoc width={14} height={14} /> Sourcing
        </div>
        <h1 className="text-2xl font-extrabold text-ink-50">Request for quotes</h1>
      </div>

      {state.rfqs.length === 0 ? (
        <EmptyState
          title="No RFQs yet"
          subtitle="Request a quote from a part page to send it to multiple suppliers at once."
          icon={<IconDoc width={28} height={28} />}
        />
      ) : (
        <div className="space-y-4">
          {state.rfqs.map((rfq) => {
            const best = rfq.quotes
              .filter((q) => q.status === 'quoted' && q.price != null)
              .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
            const responded = rfq.quotes.filter((q) => q.status !== 'waiting').length;
            return (
              <Card key={rfq.id} className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-ink-50">{rfq.reference}</span>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusStyle[rfq.status]}`}>
                        {rfq.status}
                      </span>
                    </div>
                    <Link to={`/part/${rfq.partId}`} className="text-sm text-ink-300 hover:text-iq-300">
                      {rfq.partName.split(' — ')[0]}
                    </Link>
                    <div className="text-xs text-ink-500">
                      Qty {rfq.quantity} · {rfq.delivery} · {relativeTime(rfq.createdAt)} · {responded}/{rfq.quotes.length} responses
                    </div>
                  </div>
                  {rfq.status !== 'awarded' && rfq.status !== 'cancelled' && (
                    <button onClick={() => cancelRfq(rfq.id)} className="ml-auto text-xs text-ink-500 hover:text-signal-red">
                      Cancel
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {rfq.quotes.map((q) => {
                    const s = supplierById(q.supplierId);
                    const isBest = best && q.id === best.id && rfq.status !== 'awarded';
                    return (
                      <div
                        key={q.id}
                        className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 ${
                          isBest ? 'border-iq-500/40 bg-iq-500/5' : 'border-ink-700 bg-ink-900'
                        }`}
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-md text-[10px] font-bold text-ink-950" style={{ background: s?.logoColor }}>
                          {s?.name[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ink-50">{s?.name}</span>
                          <span className="text-xs text-ink-500">{s?.location}</span>
                        </span>

                        {q.status === 'waiting' && (
                          <span className="flex items-center gap-1.5 text-xs text-ink-400">
                            <span className="h-3 w-3 rounded-full border-2 border-ink-600 border-t-iq-400 animate-spin" /> Waiting
                          </span>
                        )}
                        {q.status === 'declined' && (
                          <span className="flex items-center gap-1 text-xs text-signal-red"><IconX width={13} height={13} /> {q.note ?? 'Declined'}</span>
                        )}
                        {q.status === 'quoted' && (
                          <>
                            <div className="text-right">
                              <div className="text-base font-extrabold text-ink-50">{aud(q.price ?? 0)}</div>
                              <div className="text-[11px] text-ink-400">{q.stock} in stock · {q.leadTime}</div>
                            </div>
                            {isBest && <span className="pill border-iq-500/40 bg-iq-500/10 text-iq-300">Best offer</span>}
                            {rfq.status !== 'awarded' && rfq.status !== 'cancelled' && (
                              <button onClick={() => awardRfq(rfq.id, q.supplierId)} className="btn-primary px-3 py-1.5 text-xs">
                                <IconCheck width={13} height={13} /> Award
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {rfq.status === 'complete' && best && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400">
                    <IconClock width={13} height={13} /> All suppliers responded — best offer {aud(best.price ?? 0)} from {supplierById(best.supplierId)?.name}.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

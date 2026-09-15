import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Part, Rfq } from '@/types';
import { listSuppliers } from '@/services/suppliers';
import { useAppStore } from '@/store/AppStore';
import { PartThumb } from './ui';
import { IconX, IconCheck, IconArrowRight, IconClock } from './icons';
import { supplierById } from '@/data/suppliers';

export function RfqModal({ part, onClose }: { part: Part; onClose: () => void }) {
  const navigate = useNavigate();
  const { sendRfq } = useAppStore();
  const suppliers = listSuppliers();
  const [quantity, setQuantity] = useState(2);
  const [delivery, setDelivery] = useState('Standard');
  const [selected, setSelected] = useState<string[]>(suppliers.slice(0, 3).map((s) => s.id));
  const [sent, setSent] = useState<Rfq | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const send = () => {
    if (selected.length === 0) return;
    const rfq = sendRfq(part, quantity, delivery, selected);
    setSent(rfq);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg animate-fade-in p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink-50">{sent ? 'RFQ Sent' : 'Request for Quote'}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200">
            <IconX />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3">
          <PartThumb part={part} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink-50">{part.name.split(' — ')[0]}</div>
            <div className="truncate text-xs text-ink-400">{part.name.split(' — ')[1]}</div>
            <div className="font-mono text-[11px] text-ink-500">{part.partNumber}</div>
          </div>
        </div>

        {!sent ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Delivery</label>
                <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className="input">
                  <option>Standard</option>
                  <option>Express</option>
                  <option>Pickup</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Send to suppliers</label>
              <div className="space-y-1.5">
                {suppliers.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 hover:border-ink-600"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 accent-iq-500"
                    />
                    <span
                      className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold text-ink-950"
                      style={{ background: s.logoColor }}
                    >
                      {s.name[0]}
                    </span>
                    <span className="flex-1 text-sm text-ink-100">{s.name}</span>
                    <span className="text-[11px] text-ink-400">~{s.responseTimeHours}h · {s.location}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button onClick={send} disabled={selected.length === 0} className="btn-primary flex-1">
                Send RFQ to {selected.length}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 rounded-lg border border-signal-green/30 bg-signal-green/5 px-3 py-2 text-sm text-signal-green">
              {sent.reference} · sent to {sent.quotes.length} suppliers
            </div>
            <div className="mt-3 space-y-1.5">
              {sent.quotes.map((q) => {
                const s = supplierById(q.supplierId);
                return (
                  <div key={q.id} className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm">
                    <span className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold text-ink-950" style={{ background: s?.logoColor }}>
                      {s?.name[0]}
                    </span>
                    <span className="flex-1 text-ink-100">{s?.name}</span>
                    <span className="flex items-center gap-1 text-xs text-ink-400">
                      <IconClock width={13} height={13} /> Waiting
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-400">
              <IconCheck width={13} height={13} className="text-signal-green" />
              Responses will arrive live on your RFQs dashboard.
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">Close</button>
              <button onClick={() => navigate('/rfqs')} className="btn-primary flex-1">
                View RFQs <IconArrowRight width={14} height={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

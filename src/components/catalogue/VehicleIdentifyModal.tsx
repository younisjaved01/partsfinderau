import { useMemo, useState } from 'react';
import type { VehicleQuery } from '@/types';
import { vehicles, makes } from '@/data/vehicles';
import { lookupRego, demoPlates } from '@/services/registration';
import { IconX, IconCar, IconSearch, IconCheck, IconWarn } from '@/components/icons';

/**
 * Identify the working vehicle three ways: manual make/model/series/year/engine,
 * a mock registration lookup, or a recently used vehicle. On apply the vehicle
 * becomes the persistent workspace context (stored in AppStore).
 */
export function VehicleIdentifyModal({
  onApply,
  onClose,
  recent = [],
}: {
  onApply: (v: VehicleQuery) => void;
  onClose: () => void;
  recent?: { label: string; vehicle: VehicleQuery }[];
}) {
  const [tab, setTab] = useState<'manual' | 'rego'>('manual');

  // Manual selection state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [series, setSeries] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');

  const modelOptions = useMemo(
    () => Array.from(new Set(vehicles.filter((v) => !make || v.make === make).map((v) => v.model))),
    [make],
  );
  const seriesOptions = useMemo(
    () =>
      Array.from(
        new Set(
          vehicles
            .filter((v) => (!make || v.make === make) && (!model || v.model === model) && v.series)
            .map((v) => v.series as string),
        ),
      ),
    [make, model],
  );
  const resolved = vehicles.find((v) => v.make === make && v.model === model && (!series || v.series === series));
  const yearOptions = useMemo(() => {
    if (!resolved) return [];
    const out: number[] = [];
    for (let y = resolved.yearTo; y >= resolved.yearFrom; y--) out.push(y);
    return out;
  }, [resolved]);

  // Rego state
  const [rego, setRego] = useState('');
  const [regoState, setRegoState] = useState('');
  const [looking, setLooking] = useState(false);
  const [regoResult, setRegoResult] = useState<{ ok: boolean; label?: string; vehicle?: VehicleQuery } | null>(null);

  const runRego = async () => {
    if (!rego.trim()) return;
    setLooking(true);
    setRegoResult(null);
    const res = await lookupRego(rego, regoState || undefined);
    setLooking(false);
    if (res) setRegoResult({ ok: true, label: res.label, vehicle: res.vehicle });
    else setRegoResult({ ok: false });
  };

  const applyManual = () => {
    if (!make || !model) return;
    onApply({
      make,
      model,
      series: series || undefined,
      year: year ? Number(year) : undefined,
      engine: engine || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="card w-full max-w-lg animate-fade-in p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-ink-50">
            <IconCar width={17} height={17} className="text-iq-400" /> Identify vehicle
          </h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200"><IconX /></button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 rounded-lg border border-ink-700 bg-ink-900 p-1">
          {(['manual', 'rego'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                tab === t ? 'bg-iq-500 text-ink-950' : 'text-ink-300 hover:text-ink-50'
              }`}
            >
              {t === 'manual' ? 'Manual selection' : 'Registration'}
            </button>
          ))}
        </div>

        {tab === 'manual' ? (
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Sel label="Make" value={make} onChange={(v) => { setMake(v); setModel(''); setSeries(''); setYear(''); setEngine(''); }} options={makes} />
              <Sel label="Model" value={model} onChange={(v) => { setModel(v); setSeries(''); setEngine(''); }} options={modelOptions} disabled={!make} />
              <Sel label="Series" value={series} onChange={setSeries} options={seriesOptions} disabled={seriesOptions.length === 0} />
              <Sel label="Year" value={year} onChange={setYear} options={yearOptions.map(String)} disabled={!resolved} />
            </div>
            <Sel label="Engine" value={engine} onChange={setEngine} options={resolved?.engines ?? []} disabled={!resolved} />
            <button onClick={applyManual} disabled={!make || !model} className="btn-primary mt-2 w-full">
              <IconCheck width={15} height={15} /> Set vehicle
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={rego}
                onChange={(e) => setRego(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && runRego()}
                placeholder="Enter registration"
                className="input font-mono uppercase"
              />
              <input
                value={regoState}
                onChange={(e) => setRegoState(e.target.value.toUpperCase())}
                placeholder="State"
                className="input w-24"
              />
              <button onClick={runRego} disabled={looking || !rego.trim()} className="btn-primary shrink-0 px-4">
                {looking ? '…' : <><IconSearch width={15} height={15} /> Find</>}
              </button>
            </div>
            <div className="text-[11px] text-ink-500">
              Mock lookup — try: {demoPlates.slice(0, 4).map((p) => (
                <button key={p} onClick={() => setRego(p)} className="mx-0.5 font-mono text-iq-400 hover:underline">{p}</button>
              ))}
            </div>

            {regoResult?.ok && regoResult.vehicle && (
              <div className="rounded-lg border border-signal-green/40 bg-signal-green/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-signal-green">
                  <IconCheck width={15} height={15} /> {regoResult.label}
                </div>
                <button
                  onClick={() => { onApply(regoResult.vehicle!); onClose(); }}
                  className="btn-primary mt-2 w-full"
                >
                  Use this vehicle
                </button>
              </div>
            )}
            {regoResult && !regoResult.ok && (
              <div className="flex items-center gap-2 rounded-lg border border-signal-amber/40 bg-signal-amber/5 p-3 text-sm text-signal-amber">
                <IconWarn width={15} height={15} /> No vehicle found for that rego in the demo data.
              </div>
            )}
          </div>
        )}

        {/* Recent vehicles */}
        {recent.length > 0 && (
          <div className="mt-4 border-t border-ink-800 pt-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">Recent vehicles</div>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((r) => (
                <button
                  key={r.label}
                  onClick={() => { onApply(r.vehicle); onClose(); }}
                  className="pill card-hover hover:text-iq-300"
                >
                  <IconCar width={12} height={12} className="text-iq-400" /> {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sel({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="input appearance-none py-2 disabled:opacity-40">
        <option value="">Any</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

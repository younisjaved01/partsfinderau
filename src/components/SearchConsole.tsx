import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchInput, VehicleQuery } from '@/types';
import { vehicles, makes } from '@/data/vehicles';
import {
  IconCamera,
  IconMic,
  IconHash,
  IconCar,
  IconUpload,
  IconX,
  IconArrowRight,
  IconSearch,
  IconWrench,
} from './icons';

/**
 * The vehicle-first multimodal search console. A 4WD interpreter thinks
 * VEHICLE → SYSTEM → PART → FITMENT → SUPPLIER, so the vehicle context leads,
 * then the part search. Text, image, voice, part-number and vehicle inputs are
 * combined into ONE {@link SearchInput} handed to the single parts-intelligence
 * engine. Any combination may be active at once.
 */

type VehState = { make: string; model: string; series: string; year: string; engine: string };
const emptyVeh: VehState = { make: '', model: '', series: '', year: '', engine: '' };

// Real mechanic-speak examples — proof the engine understands 4WD terminology.
const exampleQueries = [
  '79 series shock',
  'hilux front pads',
  'prado wheel bearing',
  'patrol radius arm bushes',
  '2018 Ranger PX3 rear shocks',
  'LC200 alternator',
  '70 series clutch kit',
];

const sampleTranscripts = [
  'front brake pads for a 2019 hilux',
  'shockey for a 79',
  'rear leaf spring for a patrol',
  'wheel bearing for a prado',
  'that dust filter box thing for a ranger',
];

const fuelOf = (engines: string[]): string => {
  const diesel = engines.some((e) => /diesel/i.test(e));
  const petrol = engines.some((e) => /petrol/i.test(e));
  if (diesel && petrol) return 'Diesel / Petrol';
  if (diesel) return 'Diesel';
  if (petrol) return 'Petrol';
  return '';
};

export function SearchConsole({
  variant = 'hero',
  initial,
}: {
  variant?: 'hero' | 'compact';
  initial?: SearchInput;
}) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState(initial?.text ?? '');
  const [partNumber, setPartNumber] = useState(initial?.partNumber ?? '');
  const [image, setImage] = useState<string | undefined>(initial?.image);
  const [imageName, setImageName] = useState<string | undefined>(initial?.imageName);
  const [voiceTranscript, setVoiceTranscript] = useState(initial?.voiceTranscript ?? '');
  const [recording, setRecording] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPartNumber, setShowPartNumber] = useState(Boolean(initial?.partNumber));
  const [veh, setVeh] = useState<VehState>({
    ...emptyVeh,
    make: initial?.vehicle?.make ?? '',
    model: initial?.vehicle?.model ?? '',
    series: initial?.vehicle?.series ?? '',
    year: initial?.vehicle?.year ? String(initial.vehicle.year) : '',
    engine: initial?.vehicle?.engine ?? '',
  });

  // Vehicle option derivation ------------------------------------------------
  const modelOptions = useMemo(
    () => Array.from(new Set(vehicles.filter((v) => !veh.make || v.make === veh.make).map((v) => v.model))),
    [veh.make],
  );
  const seriesOptions = useMemo(
    () =>
      Array.from(
        new Set(
          vehicles
            .filter((v) => (!veh.make || v.make === veh.make) && (!veh.model || v.model === veh.model) && v.series)
            .map((v) => v.series as string),
        ),
      ),
    [veh.make, veh.model],
  );
  const resolved = useMemo(
    () => vehicles.find((v) => v.make === veh.make && v.model === veh.model && (!veh.series || v.series === veh.series)),
    [veh.make, veh.model, veh.series],
  );
  const engineOptions = resolved?.engines ?? [];
  const yearOptions = useMemo(() => {
    const from = resolved?.yearFrom ?? 1990;
    const to = resolved?.yearTo ?? 2024;
    const out: number[] = [];
    for (let y = to; y >= from; y--) out.push(y);
    return out;
  }, [resolved]);

  const hasVehicle = Boolean(veh.make || veh.model);
  const clearVehicle = () => setVeh(emptyVeh);

  // Image handling -----------------------------------------------------------
  const onFile = (file?: File) => {
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setImageName(file.name);
  };
  const useSampleImage = () => {
    setImage('sample://brake-pad.jpg');
    setImageName('brake-pad-sample.jpg');
  };

  // Voice (simulated; upgrades to Web Speech API when available) -------------
  const startVoice = () => {
    setRecording(true);
    const SR =
      (window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (SR) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rec = new (SR as any)();
        rec.lang = 'en-AU';
        rec.interimResults = false;
        rec.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
          setVoiceTranscript(e.results[0][0].transcript);
          setRecording(false);
        };
        rec.onerror = () => finishSimulated();
        rec.onend = () => setRecording(false);
        rec.start();
        return;
      } catch {
        /* fall through */
      }
    }
    finishSimulated();
  };
  const finishSimulated = () => {
    window.setTimeout(() => {
      setVoiceTranscript(sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)]);
      setRecording(false);
    }, 1600);
  };

  // Submit -------------------------------------------------------------------
  const submit = () => {
    const vehicle: VehicleQuery = {};
    if (veh.make) vehicle.make = veh.make;
    if (veh.model) vehicle.model = veh.model;
    if (veh.series) vehicle.series = veh.series;
    if (veh.year) vehicle.year = Number(veh.year);
    if (veh.engine) vehicle.engine = veh.engine;
    const input: SearchInput = {
      text: text.trim() || undefined,
      partNumber: partNumber.trim() || undefined,
      image,
      imageName,
      voiceTranscript: voiceTranscript.trim() || undefined,
      vehicle: Object.keys(vehicle).length ? vehicle : undefined,
    };
    if (!(input.text || input.partNumber || input.image || input.voiceTranscript || input.vehicle)) return;
    // Let the animated backdrop react briefly to the search.
    window.dispatchEvent(new CustomEvent('partsiq:pulse'));
    navigate('/search', { state: { input } });
  };

  const pulseBackground = () => window.dispatchEvent(new CustomEvent('partsiq:pulse'));

  return (
    <div className={`card overflow-hidden ${variant === 'hero' ? 'p-4 sm:p-5' : 'p-4'}`}>
      {/* ── VEHICLE ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCar width={15} height={15} className="text-iq-400" />
            <span className="kicker">Vehicle</span>
          </div>
          {hasVehicle && (
            <button onClick={clearVehicle} className="text-[11px] font-semibold text-ink-500 hover:text-signal-red">
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Select label="Make" value={veh.make} onChange={(v) => setVeh({ ...emptyVeh, make: v })} options={makes} />
          <Select label="Model" value={veh.model} onChange={(v) => setVeh((s) => ({ ...s, model: v, series: '', engine: '' }))} options={modelOptions} disabled={!veh.make} />
          <Select label="Series" value={veh.series} onChange={(v) => setVeh((s) => ({ ...s, series: v, engine: '' }))} options={seriesOptions} disabled={seriesOptions.length === 0} />
          <Select label="Year" value={veh.year} onChange={(v) => setVeh((s) => ({ ...s, year: v }))} options={yearOptions.map(String)} disabled={!veh.model} />
          <Select label="Engine" value={veh.engine} onChange={(v) => setVeh((s) => ({ ...s, engine: v }))} options={engineOptions} disabled={engineOptions.length === 0} />
        </div>

        {/* Bold vehicle context strip */}
        {hasVehicle && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-iq-500/25 bg-iq-500/[0.07] px-3 py-2">
            {[
              veh.year || (resolved ? `${resolved.yearFrom}–${resolved.yearTo}` : ''),
              veh.make,
              veh.model,
              veh.series,
              veh.engine || (resolved ? fuelOf(resolved.engines) : ''),
            ]
              .filter(Boolean)
              .map((v, i) => (
                <span key={i} className="font-display text-sm font-bold uppercase tracking-wide text-ink-50">
                  {v}
                </span>
              ))}
            <span className="ml-auto text-[11px] font-medium text-iq-300">Fitment locked to this vehicle</span>
          </div>
        )}
      </div>

      {/* ── SEARCH FOR A PART ───────────────────────────────────── */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <IconWrench width={15} height={15} className="text-iq-400" />
          <span className="kicker">Search for a part</span>
        </div>

        <div className="flex items-start gap-2">
          <div className="relative flex-1">
            <IconSearch width={18} height={18} className="pointer-events-none absolute left-3 top-3.5 text-ink-500" />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={pulseBackground}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={variant === 'hero' ? 2 : 1}
              placeholder={'Type a part, describe it, or paste a part number — "79 series shock", "patrol radius arm bushes", "that dust filter box thing"…'}
              className="input resize-none py-3 pl-10"
            />
          </div>
        </div>

        {/* Modality toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost px-3 py-2 text-xs">
            <IconCamera width={16} height={16} /> Photo
          </button>
          <button
            type="button"
            onClick={startVoice}
            className={`btn-ghost px-3 py-2 text-xs ${recording ? 'border-iq-500/60 text-iq-300' : ''}`}
          >
            <IconMic width={16} height={16} /> {recording ? 'Listening…' : 'Voice'}
          </button>
          <button
            type="button"
            onClick={() => setShowPartNumber((s) => !s)}
            className={`btn-ghost px-3 py-2 text-xs ${showPartNumber ? 'border-iq-500/60 text-iq-300' : ''}`}
          >
            <IconHash width={16} height={16} /> Part No.
          </button>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

          <button type="button" onClick={submit} className="btn-primary ml-auto px-6 font-display text-sm uppercase tracking-wide">
            Find Parts
            <IconArrowRight width={16} height={16} />
          </button>
        </div>

        {/* Try-these examples */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Try</span>
          {exampleQueries.map((q) => (
            <button
              key={q}
              onClick={() => setText(q)}
              className="rounded-md border border-ink-700 bg-ink-850 px-2 py-1 text-[11px] text-ink-300 transition hover:border-iq-600/50 hover:text-iq-300"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Recording waveform */}
      {recording && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-iq-500/30 bg-iq-500/5 px-3 py-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-iq-400"
              style={{ height: `${8 + Math.abs(Math.sin(i)) * 18}px`, animation: `pulse 0.9s ${i * 40}ms infinite alternate` }}
            />
          ))}
          <span className="ml-2 text-xs text-iq-200">Capturing voice… (demo transcript)</span>
        </div>
      )}

      {voiceTranscript && !recording && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm">
          <IconMic width={16} height={16} className="text-iq-400" />
          <span className="text-ink-200">“{voiceTranscript}”</span>
          <button className="ml-auto text-ink-500 hover:text-ink-200" onClick={() => setVoiceTranscript('')}>
            <IconX width={14} height={14} />
          </button>
        </div>
      )}

      {(image || dragOver) && (
        <div className="mt-3">
          <ImagePreview image={image} name={imageName} onClear={() => { setImage(undefined); setImageName(undefined); }} />
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]); }}
        className={`mt-3 rounded-lg border border-dashed px-4 py-2.5 text-center text-xs transition ${
          dragOver ? 'border-iq-500 bg-iq-500/5 text-iq-200' : 'border-ink-700 text-ink-500'
        }`}
      >
        <IconUpload width={15} height={15} className="mr-1 inline text-ink-500" />
        Drag &amp; drop a part photo, or{' '}
        <button className="font-semibold text-iq-400 hover:underline" onClick={() => fileRef.current?.click()}>choose image</button>{' '}·{' '}
        <button className="font-semibold text-iq-400 hover:underline" onClick={useSampleImage}>use sample brake pad</button>
      </div>

      {showPartNumber && (
        <div className="mt-3">
          <label className="label">Part number (OEM / aftermarket / partial)</label>
          <input
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            placeholder="e.g. MOCK-04465-0K160 or PIQ-BRKP…"
            className="input font-mono"
          />
        </div>
      )}
    </div>
  );
}

function ImagePreview({ image, name, onClear }: { image?: string; name?: string; onClear: () => void }) {
  const isSample = image?.startsWith('sample://');
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-2">
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-ink-700 bg-ink-800">
        {image && !isSample ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <IconCamera width={26} height={26} className="text-iq-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink-100">{name ?? 'Uploaded image'}</div>
        <div className="text-xs text-ink-400">Analysed by the vision engine (simulated)</div>
      </div>
      <button className="text-ink-500 hover:text-ink-200" onClick={onClear} aria-label="Remove image">
        <IconX width={16} height={16} />
      </button>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none py-2 disabled:opacity-40"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

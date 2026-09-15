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
  IconSpark,
} from './icons';

/**
 * The unified multimodal search console. Text, image, voice, part-number and
 * vehicle inputs are combined into ONE {@link SearchInput} and handed to the
 * search route — there is a single parts-intelligence engine behind them
 * (§4). Any combination of inputs may be active at once.
 */

type VehState = {
  make: string;
  model: string;
  series: string;
  year: string;
  engine: string;
};

const emptyVeh: VehState = { make: '', model: '', series: '', year: '', engine: '' };

// Simulated voice transcripts (used when the browser has no Speech API).
const sampleTranscripts = [
  'front brake pads for a 2019 hilux',
  'shockey for a 79',
  'rear leaf spring for a patrol',
  'wheel bearing for a prado',
  'that dust filter box thing for a ranger',
];

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
  const [showVehicle, setShowVehicle] = useState(Boolean(initial?.vehicle?.make));
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
    () =>
      vehicles.find(
        (v) =>
          v.make === veh.make &&
          v.model === veh.model &&
          (!veh.series || v.series === veh.series),
      ),
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

  // Image handling -----------------------------------------------------------
  const onFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
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
      (window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown })
        .SpeechRecognition ||
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
        /* fall through to simulation */
      }
    }
    finishSimulated();
  };
  const finishSimulated = () => {
    window.setTimeout(() => {
      const t = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
      setVoiceTranscript(t);
      setRecording(false);
    }, 1600);
  };

  // Submit -------------------------------------------------------------------
  const buildInput = (): SearchInput | null => {
    const vehicle: VehicleQuery = {};
    if (veh.make) vehicle.make = veh.make;
    if (veh.model) vehicle.model = veh.model;
    if (veh.series) vehicle.series = veh.series;
    if (veh.year) vehicle.year = Number(veh.year);
    if (veh.engine) vehicle.engine = veh.engine;
    const hasVehicle = Object.keys(vehicle).length > 0;

    const input: SearchInput = {
      text: text.trim() || undefined,
      partNumber: partNumber.trim() || undefined,
      image,
      imageName,
      voiceTranscript: voiceTranscript.trim() || undefined,
      vehicle: hasVehicle ? vehicle : undefined,
    };
    const any = input.text || input.partNumber || input.image || input.voiceTranscript || input.vehicle;
    return any ? input : null;
  };

  const submit = () => {
    const input = buildInput();
    if (!input) return;
    navigate('/search', { state: { input } });
  };

  const activeChips = [
    image && { k: 'image', label: imageName ?? 'Image' },
    voiceTranscript && { k: 'voice', label: 'Voice captured' },
    veh.make && { k: 'vehicle', label: [veh.make, veh.model, veh.series].filter(Boolean).join(' ') },
    partNumber && { k: 'pn', label: `PN ${partNumber}` },
  ].filter(Boolean) as { k: string; label: string }[];

  return (
    <div className={`card ${variant === 'hero' ? 'p-5 sm:p-6' : 'p-4'}`}>
      <div className="mb-3 flex items-center gap-2">
        <IconSpark width={16} height={16} className="text-iq-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-ink-300">What are you looking for?</span>
      </div>

      {/* Primary text row */}
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={variant === 'hero' ? 2 : 1}
            placeholder={'Describe the part in your own words — "front bushes for an 80 series", "that sensor near the engine"…'}
            className="input resize-none pr-3"
          />
        </div>
      </div>

      {/* Modality toolbar */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-ghost px-3 py-2 text-xs"
        >
          <IconCamera width={16} height={16} /> Upload Photo
        </button>
        <button
          type="button"
          onClick={startVoice}
          className={`btn-ghost px-3 py-2 text-xs ${recording ? 'border-iq-500/60 text-iq-300' : ''}`}
        >
          <IconMic width={16} height={16} />
          {recording ? 'Listening…' : 'Voice'}
        </button>
        <button
          type="button"
          onClick={() => setShowPartNumber((s) => !s)}
          className={`btn-ghost px-3 py-2 text-xs ${showPartNumber ? 'border-iq-500/60 text-iq-300' : ''}`}
        >
          <IconHash width={16} height={16} /> Part Number
        </button>
        <button
          type="button"
          onClick={() => setShowVehicle((s) => !s)}
          className={`btn-ghost px-3 py-2 text-xs ${showVehicle ? 'border-iq-500/60 text-iq-300' : ''}`}
        >
          <IconCar width={16} height={16} /> Vehicle
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        <button type="button" onClick={submit} className="btn-primary ml-auto px-5">
          Find Part
          <IconArrowRight width={16} height={16} />
        </button>
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

      {/* Voice transcript */}
      {voiceTranscript && !recording && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm">
          <IconMic width={16} height={16} className="text-iq-400" />
          <span className="text-ink-200">“{voiceTranscript}”</span>
          <button className="ml-auto text-ink-500 hover:text-ink-200" onClick={() => setVoiceTranscript('')}>
            <IconX width={14} height={14} />
          </button>
        </div>
      )}

      {/* Image dropzone / preview */}
      {(image || dragOver) && (
        <div className="mt-3">
          <ImagePreview image={image} name={imageName} onClear={() => { setImage(undefined); setImageName(undefined); }} />
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        className={`mt-3 rounded-lg border border-dashed px-4 py-3 text-center text-xs transition ${
          dragOver ? 'border-iq-500 bg-iq-500/5 text-iq-200' : 'border-ink-700 text-ink-500'
        }`}
      >
        <IconUpload width={16} height={16} className="mx-auto mb-1 text-ink-500" />
        Drag &amp; drop a part photo, or{' '}
        <button className="font-semibold text-iq-400 hover:underline" onClick={() => fileRef.current?.click()}>
          choose image
        </button>{' '}
        ·{' '}
        <button className="font-semibold text-iq-400 hover:underline" onClick={useSampleImage}>
          use sample brake pad
        </button>
      </div>

      {/* Part number input */}
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

      {/* Vehicle selector */}
      {showVehicle && (
        <div className="mt-3 rounded-lg border border-ink-700 bg-ink-900/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <IconCar width={14} height={14} /> Vehicle
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Select label="Make" value={veh.make} onChange={(v) => setVeh({ ...emptyVeh, make: v })} options={makes} />
            <Select label="Model" value={veh.model} onChange={(v) => setVeh((s) => ({ ...s, model: v, series: '', engine: '' }))} options={modelOptions} disabled={!veh.make} />
            <Select label="Series" value={veh.series} onChange={(v) => setVeh((s) => ({ ...s, series: v, engine: '' }))} options={seriesOptions} disabled={seriesOptions.length === 0} />
            <Select label="Year" value={veh.year} onChange={(v) => setVeh((s) => ({ ...s, year: v }))} options={yearOptions.map(String)} disabled={!veh.model} />
            <Select label="Engine" value={veh.engine} onChange={(v) => setVeh((s) => ({ ...s, engine: v }))} options={engineOptions} disabled={engineOptions.length === 0} />
          </div>
        </div>
      )}

      {/* Combined-signal chips */}
      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Combining</span>
          {activeChips.map((c) => (
            <span key={c.k} className="pill">{c.label}</span>
          ))}
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
        <div className="text-xs text-ink-400">Will be analysed by the vision engine (simulated)</div>
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
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

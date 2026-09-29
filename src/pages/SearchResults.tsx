import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { SearchInput, SearchResult, Part, Interpretation } from '@/types';
import { search } from '@/services/partsSearch';
import { useAppStore } from '@/store/AppStore';
import { PartCard } from '@/components/PartCard';
import { RfqModal } from '@/components/RfqModal';
import { Card, ConfidenceMeter, PartThumb, StockBadge, QualityBadge, FitmentBadge, EmptyState } from '@/components/ui';
import {
  IconSpark,
  IconCheck,
  IconArrowRight,
  IconCar,
  IconSearch,
  IconLayers,
  IconPlus,
  IconTag,
} from '@/components/icons';
import { bestPrice } from '@/services/inventory';
import { brandById } from '@/data/brands';
import { vehicleById, vehicleLabel } from '@/data/vehicles';
import { aud } from '@/lib/format';

const analysisSteps = [
  'Parsing all inputs',
  'Visual features & markings',
  'Interpreting description',
  'Matching vehicle fitment',
  'Ranking catalogue matches',
];

export function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recordSearch } = useAppStore();
  const input = (location.state as { input?: SearchInput } | null)?.input;

  const [phase, setPhase] = useState<'analyzing' | 'done'>('analyzing');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [rfqPart, setRfqPart] = useState<Part | null>(null);
  const recordedRef = useRef<string>('');

  const inputKey = useMemo(() => JSON.stringify(input ?? {}), [input]);

  useEffect(() => {
    if (!input) return;
    let cancelled = false;
    setPhase('analyzing');
    setResult(null);
    const started = Date.now();
    search(input).then((res) => {
      if (cancelled) return;
      setResult(res);
      // Hold the analysis animation briefly for perceived work.
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 1300 - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase('done');
        if (recordedRef.current !== res.ranAt) {
          recordedRef.current = res.ranAt;
          recordSearch(res);
        }
      }, wait);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);

  if (!input) {
    return (
      <EmptyState
        title="No search yet"
        subtitle="Start from the Find Parts screen to describe or photograph a part."
        icon={<IconSearch width={28} height={28} />}
      />
    );
  }

  const queryLabel =
    input.text || input.voiceTranscript || input.partNumber || (input.imageName ? `Image: ${input.imageName}` : 'Vehicle search');

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate('/')} className="mb-2 text-xs text-ink-400 hover:text-ink-200">
          ← New search
        </button>
        <div className="text-xs font-semibold uppercase tracking-widest text-ink-500">Search results for</div>
        <h1 className="text-xl font-bold text-ink-50">“{queryLabel}”</h1>
      </div>

      {phase === 'analyzing' || !result ? (
        <AnalyzingPanel input={input} interpretation={result?.interpretation} />
      ) : (
        <>
          <InterpretationPanel result={result} onClarify={(patch) => navigate('/search', { state: { input: { ...input, ...patch } }, replace: true })} />

          {result.best ? (
            <BestMatch result={result} onRequestQuote={setRfqPart} />
          ) : (
            <EmptyState
              title="No confident match yet"
              subtitle="Add a vehicle or more detail — try a category like “brake” or “suspension”, or describe the part differently."
              icon={<IconSearch width={28} height={28} />}
            />
          )}

          {result.matches.length > 1 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <IconLayers width={16} height={16} className="text-iq-400" />
                <h2 className="text-base font-bold text-ink-50">Other matches</h2>
                <span className="text-xs text-ink-400">({result.matches.length - 1})</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.matches.slice(1).map((m) => (
                  <PartCard key={m.part.id} part={m.part} score={m.score} onRequestQuote={setRfqPart} />
                ))}
              </div>
            </section>
          )}

          {result.alternatives.length > 0 && (
            <AlternativesRow result={result} />
          )}
        </>
      )}

      {rfqPart && <RfqModal part={rfqPart} onClose={() => setRfqPart(null)} />}
    </div>
  );
}

function AnalyzingPanel({ input, interpretation }: { input: SearchInput; interpretation?: Interpretation }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, analysisSteps.length)), 260);
    return () => window.clearInterval(t);
  }, []);
  const hasImage = Boolean(input.image);
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <div className="relative grid h-12 w-12 place-items-center rounded-full bg-iq-500/10">
          <span className="absolute inset-0 rounded-full ring-2 ring-iq-500/40 animate-pulse-ring" />
          <IconSpark width={22} height={22} className="text-iq-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-ink-50">Parts Intelligence Engine</div>
          <div className="text-xs text-ink-400">
            Analysing {[input.text && 'text', hasImage && 'image', input.voiceTranscript && 'voice', input.vehicle && 'vehicle', input.partNumber && 'part number'].filter(Boolean).join(' · ') || 'query'}…
          </div>
        </div>
      </div>

      {hasImage && (
        <div className="relative mt-4 h-1 overflow-hidden rounded bg-ink-800">
          <div className="absolute inset-y-0 w-1/3 animate-scan bg-gradient-to-r from-transparent via-iq-500 to-transparent" />
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {analysisSteps.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 text-sm">
            {i < step ? (
              <IconCheck width={16} height={16} className="text-signal-green" />
            ) : (
              <span className="h-4 w-4 rounded-full border-2 border-ink-600 border-t-iq-400 animate-spin" />
            )}
            <span className={i < step ? 'text-ink-200' : 'text-ink-500'}>{s}</span>
          </li>
        ))}
      </ul>

      {interpretation && (
        <div className="mt-4 text-xs text-ink-400">
          Preliminary confidence {Math.round(interpretation.confidence * 100)}%
        </div>
      )}
    </Card>
  );
}

function InterpretationPanel({
  result,
  onClarify,
}: {
  result: SearchResult;
  onClarify: (patch: Partial<SearchInput>) => void;
}) {
  const i = result.interpretation;
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <ConfidenceMeter value={i.confidence} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <IconSpark width={15} height={15} className="text-iq-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-ink-400">Parts Intelligence read this as</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Field label="Vehicle" value={i.detectedVehicleLabel} />
            <Field label="Category" value={i.detectedCategory} />
            <Field label="Part" value={i.detectedPartTerm} />
            <Field label="Position" value={i.position} />
            <Field label="Year" value={i.year ? String(i.year) : undefined} />
            <Field label="Engine" value={i.engine} />
          </div>

          {i.normalisedTerms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {i.normalisedTerms.map((n, idx) => (
                <span key={idx} className="pill border-iq-500/30 bg-iq-500/5 text-iq-200">
                  “{n.from}” <IconArrowRight width={12} height={12} /> {n.to}
                </span>
              ))}
            </div>
          )}

          <details className="mt-3 text-xs text-ink-400">
            <summary className="cursor-pointer select-none font-semibold text-ink-300 hover:text-ink-100">
              How the engine read this
            </summary>
            <ul className="mt-2 space-y-1">
              {i.reasoning.map((r, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-iq-500">›</span>
                  {r}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      {i.clarification && (
        <div className="mt-4 rounded-lg border border-iq-500/30 bg-iq-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-iq-200">
            <IconCar width={15} height={15} /> {i.clarification.question}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {i.clarification.options.map((o) => (
              <button key={o.label} onClick={() => onClarify(o.patch)} className="btn-ghost px-4 py-2 text-xs">
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`font-semibold ${value ? 'text-ink-50' : 'text-ink-600'}`}>{value ?? '—'}</div>
    </div>
  );
}

function BestMatch({ result, onRequestQuote }: { result: SearchResult; onRequestQuote: (p: Part) => void }) {
  const navigate = useNavigate();
  const { addToQuote } = useAppStore();
  const best = result.best!;
  const part = best.part;
  const brand = brandById(part.brandId);
  const fitments = part.fitments.slice(0, 4);
  const tier = part.specs.Tier?.includes('OEM')
    ? 'oem'
    : part.specs.Tier?.includes('Premium')
      ? 'premium'
      : part.specs.Tier?.includes('Budget')
        ? 'budget'
        : 'standard';

  return (
    <Card className="overflow-hidden p-0 shadow-glow ring-1 ring-iq-500/40">
      <div className="flex items-center gap-2 border-b border-ink-700 bg-iq-500/10 px-5 py-2.5">
        <IconSpark width={15} height={15} className="text-iq-400" />
        <span className="font-display text-sm font-bold uppercase tracking-widest text-iq-300">Best match</span>
        <span className="stat-num ml-auto text-xs text-ink-300">PARTS IQ match {Math.round(best.score * 100)}%</span>
      </div>
      {/* Fitment verdict banner — one of the strongest signals on the page */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-800 bg-ink-900/60 px-5 py-3">
        <FitmentBadge score={best.score} />
        {result.interpretation.detectedVehicleLabel && (
          <span className="font-display text-sm font-bold uppercase tracking-wide text-ink-100">
            {result.interpretation.detectedVehicleLabel}
            {result.interpretation.year ? ` · ${result.interpretation.year}` : ''}
            {result.interpretation.engine ? ` · ${result.interpretation.engine}` : ''}
          </span>
        )}
        {result.interpretation.position && result.interpretation.position !== 'n/a' && (
          <span className="pill uppercase">{result.interpretation.position}</span>
        )}
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[auto,1fr,auto]">
        <PartThumb part={part} size="lg" />
        <div className="min-w-0">
          <Link to={`/part/${part.id}`} className="font-display text-xl font-bold uppercase tracking-wide text-ink-50 hover:text-iq-300">
            {part.name.split(' — ')[0]}
          </Link>
          <div className="mt-0.5 text-sm text-ink-400">{part.name.split(' — ')[1]}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <QualityBadge tier={tier} />
            <span className="font-mono text-xs text-ink-300">{part.partNumber}</span>
            <span className="text-xs text-ink-500">OEM {part.oemNumber}</span>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Fits vehicles</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {fitments.map((f) => {
                const v = vehicleById(f.vehicleId);
                return (
                  <span key={f.vehicleId} className="pill border-signal-green/30 text-signal-green">
                    <IconCheck width={12} height={12} /> {v ? vehicleLabel(v) : f.vehicleId} {f.yearFrom}–{f.yearTo}
                  </span>
                );
              })}
            </div>
          </div>
          {best.reasons.length > 0 && (
            <ul className="mt-3 space-y-1">
              {best.reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-ink-300">
                  <IconCheck width={12} height={12} className="text-signal-green" /> {r}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="md:text-right">
            <div className="text-2xl font-extrabold text-ink-50">{aud(bestPrice(part))}</div>
            <div className="text-xs text-ink-400">{brand?.name}</div>
          </div>
          <StockBadge part={part} />
          <div className="flex w-full flex-col gap-2 md:w-44">
            <button onClick={() => navigate(`/part/${part.id}`)} className="btn-primary w-full">
              View Part <IconArrowRight width={15} height={15} />
            </button>
            <button onClick={() => addToQuote(part.id)} className="btn-ghost w-full">
              <IconPlus width={15} height={15} /> Add to Quote
            </button>
            <button onClick={() => onRequestQuote(part)} className="btn-subtle w-full">
              <IconTag width={15} height={15} /> Request Quote
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AlternativesRow({ result }: { result: SearchResult }) {
  const navigate = useNavigate();
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <IconLayers width={16} height={16} className="text-iq-400" />
        <h2 className="text-base font-bold text-ink-50">Alternatives &amp; cross references</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {result.alternatives.map((a) => {
          const part = a.part;
          const tier = part.specs.Tier?.includes('OEM')
            ? 'oem'
            : part.specs.Tier?.includes('Premium')
              ? 'premium'
              : part.specs.Tier?.includes('Budget')
                ? 'budget'
                : 'standard';
          return (
            <button
              key={part.id}
              onClick={() => navigate(`/part/${part.id}`)}
              className="card card-hover flex items-center gap-3 p-3 text-left"
            >
              <PartThumb part={part} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <QualityBadge tier={tier} />
                </div>
                <div className="mt-1 truncate text-xs text-ink-400">{brandById(part.brandId)?.name}</div>
                <div className="mt-1 text-sm font-bold text-ink-50">{aud(bestPrice(part))}</div>
              </div>
              <StockBadge part={part} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

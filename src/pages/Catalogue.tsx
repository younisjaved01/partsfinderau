import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { rowVariants, collapseVariants, fadeVariants, tapScale, EASE } from '@/lib/motion';
import type { Part, PartCategory, ScoredPart, SearchResult, VehicleQuery } from '@/types';
import { useAppStore } from '@/store/AppStore';
import { search } from '@/services/partsSearch';
import { browseCatalogue, catalogueTree, resolveVehicleId } from '@/services/catalogue';
import { checkFitment } from '@/services/vehicleFitment';
import { bestPrice } from '@/services/inventory';
import { vehicleById } from '@/data/vehicles';
import { partById } from '@/data/parts';
import { StockBadge, FitmentBadge } from '@/components/ui';
import { PartIntelligence } from '@/components/catalogue/PartIntelligence';
import { VehicleIdentifyModal } from '@/components/catalogue/VehicleIdentifyModal';
import { RfqModal } from '@/components/RfqModal';
import { CategoryIcon, IconSearch, IconCar, IconChevron, IconSidebar, IconCamera, IconMic } from '@/components/icons';
import { aud } from '@/lib/format';

// Map a catalogue-browse fitment verdict onto the same 0–1 scale the search
// engine produces, so one FitmentBadge covers both modes.
const verdictScore = (part: Part, v: VehicleQuery | null): number => {
  const f = checkFitment(part, v ?? {});
  if (f.verdict === 'fits') return Math.max(0.85, f.confidence);
  if (f.verdict === 'possible') return 0.7;
  if (f.verdict === 'no-fit') return 0.2;
  return 0.5;
};

interface Row {
  part: Part;
  score: number;
  reasons?: string[];
}

export function Catalogue() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { activeVehicle, setActiveVehicle, addToQuote, recordSearch, state } = useAppStore();

  const category = (params.get('category') as PartCategory | null) ?? undefined;
  const subGroup = params.get('sub') ?? undefined;
  const q = params.get('q') ?? '';

  const [text, setText] = useState(q);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightOpenMobile, setRightOpenMobile] = useState(false);
  const [vehModal, setVehModal] = useState(false);
  const [rfqPart, setRfqPart] = useState<Part | null>(null);
  const [expanded, setExpanded] = useState<PartCategory | null>((category as PartCategory) ?? 'Brake');
  const ranFor = useRef('');

  const mode: 'search' | 'browse' = q ? 'search' : 'browse';

  // Resolve the active vehicle to a catalogue vehicle for the header + filters.
  const activeVeh = useMemo(() => {
    const id = resolveVehicleId(activeVehicle);
    return id ? vehicleById(id) : undefined;
  }, [activeVehicle]);

  // Run a search (text covers free-text, part number and vehicle terminology).
  const runSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    const input = { text: trimmed, vehicle: activeVehicle ?? undefined };
    search(input).then((res) => {
      setResult(res);
      setSearching(false);
      if (ranFor.current !== res.ranAt) {
        ranFor.current = res.ranAt;
        recordSearch(res);
      }
      setSelectedId(res.best?.part.id ?? res.matches[0]?.part.id ?? null);
    });
    window.dispatchEvent(new CustomEvent('partsiq:pulse'));
  };

  // Run search automatically when arriving with a ?q= param.
  useEffect(() => {
    if (q) runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, activeVehicle]);

  const submit = () => {
    const next = new URLSearchParams(params);
    if (text.trim()) {
      next.set('q', text.trim());
      next.delete('category');
      next.delete('sub');
    } else {
      next.delete('q');
    }
    setParams(next);
  };

  const selectCategory = (c: PartCategory) => {
    setExpanded((e) => (e === c ? e : c));
    const next = new URLSearchParams();
    next.set('category', c);
    setParams(next);
    setText('');
    setResult(null);
  };
  const selectSub = (c: PartCategory, sub: string) => {
    const next = new URLSearchParams();
    next.set('category', c);
    next.set('sub', sub);
    setParams(next);
    setText('');
    setResult(null);
  };

  // Rows for the current mode.
  const rows: Row[] = useMemo(() => {
    if (mode === 'search' && result) {
      return result.matches.map((m: ScoredPart) => ({ part: m.part, score: m.score, reasons: m.reasons }));
    }
    const browse = browseCatalogue({ vehicle: activeVehicle, category, subGroup });
    return browse.map((p) => ({ part: p, score: verdictScore(p, activeVehicle) }));
  }, [mode, result, activeVehicle, category, subGroup]);

  // Keep a selection in sync.
  useEffect(() => {
    if (rows.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !rows.some((r) => r.part.id === selectedId)) {
      setSelectedId(rows[0].part.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const selectedPart = selectedId ? partById(selectedId) ?? null : null;

  const recentVehicles = useMemo(() => {
    const seen = new Set<string>();
    const out: { label: string; vehicle: VehicleQuery }[] = [];
    for (const h of state.history) {
      if (h.input.vehicle && h.vehicleLabel && !seen.has(h.vehicleLabel)) {
        seen.add(h.vehicleLabel);
        out.push({ label: h.vehicleLabel, vehicle: h.input.vehicle });
      }
    }
    return out.slice(0, 6);
  }, [state.history]);

  const heading = mode === 'search' ? `Results for “${q}”` : subGroup ? subGroup : category ? category : 'All parts';

  const onSelectRow = (id: string) => {
    setSelectedId(id);
    setRightOpenMobile(true);
  };

  return (
    <div className="flex h-[calc(100vh-7.25rem)] flex-col">
      {/* Workspace header */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setLeftCollapsed((c) => !c)}
          className="hidden rounded-lg border border-ink-700 bg-ink-900 p-2 text-ink-300 hover:text-ink-50 lg:block"
          title="Toggle catalogue panel"
        >
          <IconSidebar width={16} height={16} />
        </button>
        <div>
          <div className="flex items-center gap-2 kicker"><CategoryIcon category="Driveline" width={13} height={13} /> Catalogue Workspace</div>
          <h1 className="text-xl font-bold text-ink-50">Parts catalogue</h1>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[var(--lw)_1fr_360px]" style={{ '--lw': leftCollapsed ? '0px' : '256px' } as React.CSSProperties}>
        {/* ── LEFT: vehicle + catalogue nav ── */}
        <aside className={`card min-h-0 flex-col overflow-hidden ${leftCollapsed ? 'hidden' : 'hidden lg:flex'}`}>
          <div className="border-b border-ink-800 bg-ink-900/60 p-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-iq-500">Current vehicle</div>
            {activeVehicle ? (
              <>
                <div className="font-display text-base font-bold uppercase leading-tight tracking-wide text-ink-50">
                  {activeVehicle.make} {activeVehicle.model}
                </div>
                <div className="text-xs text-ink-300">
                  {[activeVeh?.series, activeVeh?.chassis, activeVehicle.year, activeVehicle.engine].filter(Boolean).join(' · ')}
                </div>
              </>
            ) : (
              <div className="text-sm text-ink-400">No vehicle selected</div>
            )}
            <button onClick={() => setVehModal(true)} className="btn-ghost mt-2 w-full py-1.5 text-xs">
              <IconCar width={13} height={13} /> {activeVehicle ? 'Change vehicle' : 'Identify vehicle'}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <div className="px-1 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-500">Part categories</div>
            {catalogueTree.map((g) => {
              const open = expanded === g.category;
              const activeCat = category === g.category;
              return (
                <div key={g.category}>
                  <button
                    onClick={() => { setExpanded(open ? null : g.category); selectCategory(g.category); }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                      activeCat && !subGroup ? 'bg-iq-500/10 text-iq-300' : 'text-ink-200 hover:bg-ink-800'
                    }`}
                  >
                    <CategoryIcon category={g.category} width={15} height={15} className="text-iq-400" />
                    <span className="flex-1 text-left font-medium">{g.category === 'Brake' ? 'Brakes' : g.category}</span>
                    <IconChevron width={13} height={13} className={`text-ink-500 transition-transform ${open ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="sub"
                        variants={collapseVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="overflow-hidden"
                      >
                        <div className="mb-1 ml-3 border-l border-ink-800 pl-2">
                          {g.subGroups.map((s) => (
                            <button
                              key={s.name}
                              onClick={() => selectSub(g.category, s.name)}
                              className={`block w-full rounded px-2 py-1 text-left text-xs transition ${
                                subGroup === s.name ? 'text-iq-300' : 'text-ink-400 hover:text-ink-100'
                              }`}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── CENTER: find part + results ── */}
        <section className="card flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-ink-800 p-3">
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-iq-500">
              <IconSearch width={13} height={13} /> Find a part
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="Part number, description or vehicle terminology — e.g. “exhaust gasket”, “shockey for a 79”"
                  className="input pl-9"
                />
              </div>
              <motion.button whileTap={tapScale} onClick={submit} className="btn-primary shrink-0 px-5 font-display uppercase tracking-wide">Find</motion.button>
              <button
                onClick={() => navigate('/', { state: { vehicle: activeVehicle ?? undefined } })}
                className="btn-ghost hidden shrink-0 px-3 sm:inline-flex"
                title="Photo & voice search on Find Parts"
              >
                <IconCamera width={15} height={15} /> <IconMic width={15} height={15} />
              </button>
            </div>
          </div>

          {/* Results toolbar */}
          <div className="flex items-center gap-2 border-b border-ink-800 px-3 py-2">
            <span className="font-display text-sm font-bold uppercase tracking-wide text-ink-100">{heading}</span>
            <span className="stat-num text-xs text-ink-500">{rows.length} parts</span>
            {mode === 'search' && (
              <button onClick={() => { setParams(new URLSearchParams()); setText(''); setResult(null); }} className="ml-auto text-xs text-ink-500 hover:text-ink-200">
                Clear
              </button>
            )}
          </div>

          {/* Results list (dense table/list hybrid) */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {searching ? (
                <motion.div
                  key="loading"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex items-center gap-2 p-6 text-sm text-ink-300"
                >
                  <span className="h-4 w-4 rounded-full border-2 border-ink-600 border-t-iq-400 animate-spin" />
                  Understanding your request…
                </motion.div>
              ) : rows.length === 0 ? (
                <motion.div key="empty" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-6 text-sm text-ink-400">
                  No parts here for {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : 'this filter'}. Try another category or search.
                </motion.div>
              ) : (
                <motion.table
                  key={`table:${mode}:${category ?? ''}:${subGroup ?? ''}:${q}:${rows.length}`}
                  variants={fadeVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="w-full text-left text-sm"
                >
                  <thead className="sticky top-0 z-10 bg-ink-900 text-[10px] uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Part No.</th>
                      <th className="px-3 py-2 font-semibold">Description</th>
                      <th className="hidden px-3 py-2 font-semibold md:table-cell">Fitment</th>
                      <th className="hidden px-3 py-2 font-semibold sm:table-cell">Stock</th>
                      <th className="px-3 py-2 text-right font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ part, score }, i) => {
                      const active = part.id === selectedId;
                      const stripe = score >= 0.85 ? 'bg-signal-green' : score >= 0.6 ? 'bg-signal-amber' : 'bg-signal-red';
                      return (
                        <motion.tr
                          key={part.id}
                          custom={i}
                          variants={rowVariants}
                          initial="hidden"
                          animate="show"
                          onClick={() => onSelectRow(part.id)}
                          className={`cursor-pointer border-b border-ink-800/70 transition-colors ${active ? 'bg-iq-500/10' : 'hover:bg-ink-900/60'}`}
                        >
                          <td className="relative px-3 py-2.5 pl-4">
                            <motion.span
                              className={`absolute inset-y-0 left-0 w-1 ${stripe}`}
                              initial={false}
                              animate={{ opacity: active ? 1 : 0, scaleY: active ? 1 : 0.3 }}
                              transition={{ duration: 0.18, ease: EASE }}
                              style={{ transformOrigin: 'center' }}
                            />
                            <span className="font-mono text-xs font-semibold text-iq-300">{part.partNumber}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="block font-medium text-ink-50">{part.name.split(' — ')[0]}</span>
                            <span className="block text-[11px] text-ink-500">{part.name.split(' — ')[1]}</span>
                          </td>
                          <td className="hidden px-3 py-2.5 md:table-cell"><FitmentBadge score={score} size="sm" /></td>
                          <td className="hidden px-3 py-2.5 sm:table-cell"><StockBadge part={part} /></td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="stat-num font-bold text-ink-50">{aud(bestPrice(part))}</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </motion.table>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── RIGHT: part intelligence (desktop column) ── */}
        <aside className="card hidden min-h-0 overflow-hidden lg:block">
          <PartIntelligence
            part={selectedPart}
            vehicle={activeVehicle}
            onRequestQuote={setRfqPart}
            onAddToCart={(p) => addToQuote(p.id)}
          />
        </aside>
      </div>

      {/* Right panel drawer (mobile / tablet) */}
      {rightOpenMobile && selectedPart && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setRightOpenMobile(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm border-l border-ink-800 bg-ink-950" onClick={(e) => e.stopPropagation()}>
            <PartIntelligence
              part={selectedPart}
              vehicle={activeVehicle}
              onRequestQuote={setRfqPart}
              onAddToCart={(p) => addToQuote(p.id)}
              onClose={() => setRightOpenMobile(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile catalogue/vehicle bar */}
      <button
        onClick={() => setVehModal(true)}
        className="fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 px-4 py-2 text-xs font-semibold text-ink-100 shadow-card lg:hidden"
      >
        <IconCar width={14} height={14} className="text-iq-400" />
        {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : 'Select vehicle'}
      </button>

      {vehModal && (
        <VehicleIdentifyModal
          recent={recentVehicles}
          onApply={(v) => setActiveVehicle(v)}
          onClose={() => setVehModal(false)}
        />
      )}
      {rfqPart && <RfqModal part={rfqPart} onClose={() => setRfqPart(null)} />}
    </div>
  );
}

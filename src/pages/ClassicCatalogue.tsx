import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { Part, PartCategory, VehicleQuery, Vehicle } from '@/types';
import { vehicles, vehicleById, vehicleLabel, fuelFor, productionPeriod } from '@/data/vehicles';
import { catalogueTree, browseCatalogue, partMeta, resolveVehicleId } from '@/services/catalogue';
import { search } from '@/services/partsSearch';
import { bestPrice, totalStock } from '@/services/inventory';
import { fastestDispatch } from '@/lib/fitment';
import { lookupRego, demoPlates } from '@/services/registration';
import {
  pricing,
  generalInfo,
  technical,
  references,
  referenceSource,
  fitments,
  availability,
  relatedParts,
  history,
  documents,
  confidenceMeta,
  type Field,
  type RefRow,
} from '@/services/partDetails';
import { partSpecs } from '@/data/partSpecs';
import { useAppStore } from '@/store/AppStore';
import { partById } from '@/data/parts';
import {
  LogoMark,
  IconCamera,
  IconChevron,
  IconCar,
  CategoryIcon,
  IconCheck,
  IconWarn,
  IconDoc,
  IconImage,
  IconLayers,
  IconX,
} from '@/components/icons';

/**
 * CLASSIC CATALOGUE — comprehensive 4WD parts interpreter workstation.
 * ------------------------------------------------------------------
 * Keeps the light "Windows-style" legacy catalogue layout (Make → Model →
 * Series → Group → Sub-Group, dense results table, cart) and evolves it into a
 * full information system: an expanded vehicle bar, an information-dense
 * sortable/filterable results table, part comparison, and an 8-tab part panel
 * (Overview, Specifications, Fitment, OEM References, Availability, Related
 * Parts, History, Documents). All factual data comes from the existing
 * catalogue/store; missing data is shown as "Not available", never invented.
 * The intelligent search tool (natural language / part number / rego) still
 * runs through the Parts Intelligence Engine.
 */

const money = (n: number) => n.toFixed(2);
const cap = (n: number) => (n > 10 ? '10+' : String(n));
const specWeight = (part: Part): number | null => partSpecs[part.id.split('__')[0]]?.weightKg ?? null;

const tierPrices = (part: Part) => {
  const p = pricing(part);
  return { buy: p.buy, workshop: p.workshop, list: p.list };
};

const stockCols = (part: Part) => {
  let melb = 0;
  let branch = 0;
  for (const r of part.inventory) {
    if (/melb|vic/i.test(r.warehouse)) melb += r.stock;
    else branch += r.stock;
  }
  return { branch: cap(branch || totalStock(part)), melb: cap(melb) };
};

type Tab = 'overview' | 'specs' | 'fitment' | 'oem' | 'availability' | 'related' | 'history' | 'documents';
type SortKey = 'current' | 'partno' | 'desc' | 'weight' | 'buy' | 'workshop' | 'list' | 'stock';

const TABS: [Tab, string][] = [
  ['overview', 'Overview'],
  ['specs', 'Specifications'],
  ['fitment', 'Fitment'],
  ['oem', 'OEM References'],
  ['availability', 'Availability'],
  ['related', 'Related Parts'],
  ['history', 'History'],
  ['documents', 'Documents'],
];

interface Row {
  part: Part;
  model: string;
  series: string;
  category: string;
  subGroup: string;
  position: string;
  weight: number | null;
  buy: number;
  workshop: number;
  list: number;
  branch: string;
  melb: string;
  eta: string;
  fitLabel: string;
  fitCls: string;
}

export function ClassicCatalogue() {
  const navigate = useNavigate();
  const { addToQuote, state, quoteCount } = useAppStore();

  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Hilux');
  const [series, setSeries] = useState('GUN126');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [transmission, setTransmission] = useState('');
  const [group, setGroup] = useState<PartCategory | ''>('Brake');
  const [subGroup, setSubGroup] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('current');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>('overview');
  const [searchRows, setSearchRows] = useState<Part[] | null>(null);
  const [rego, setRego] = useState('');
  const [regoMsg, setRegoMsg] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // --- option lists -------------------------------------------------------
  const makeOptions = useMemo(() => Array.from(new Set(vehicles.map((v) => v.make))), []);
  const modelOptions = useMemo(
    () => Array.from(new Set(vehicles.filter((v) => v.make === make).map((v) => v.model))),
    [make],
  );
  const seriesOptions = useMemo(
    () =>
      Array.from(
        new Set(
          vehicles
            .filter((v) => v.make === make && v.model === model)
            .map((v) => v.chassis || v.series || '')
            .filter(Boolean),
        ),
      ),
    [make, model],
  );

  const vehicleQuery: VehicleQuery = {
    make,
    model,
    series: series || undefined,
    year: year ? Number(year) : undefined,
    engine: engine || undefined,
    transmission: transmission || undefined,
  };

  // Resolved vehicle (for the info bar + year/engine options).
  const activeVehicle: Vehicle | undefined = useMemo(() => {
    const id = resolveVehicleId({ make, model, series: series || undefined });
    return id
      ? vehicleById(id)
      : vehicles.find((v) => v.make === make && v.model === model);
  }, [make, model, series]);

  const yearOptions = useMemo(() => {
    if (!activeVehicle) return [];
    const ys: string[] = [];
    for (let y = activeVehicle.yearTo; y >= activeVehicle.yearFrom; y--) ys.push(String(y));
    return ys;
  }, [activeVehicle]);
  const engineOptions = activeVehicle?.engines ?? [];
  const transOptions = activeVehicle?.transmissions ?? [];

  const groupOptions = catalogueTree.map((g) => g.category);
  const subGroupOptions = useMemo(
    () => catalogueTree.find((g) => g.category === group)?.subGroups.map((s) => s.name) ?? [],
    [group],
  );

  // --- rows ---------------------------------------------------------------
  const browseRows = useMemo(
    () => browseCatalogue({ vehicle: { make, model, series: series || undefined }, category: group || undefined, subGroup: subGroup || undefined }),
    [make, model, series, group, subGroup],
  );

  const sourceParts = searchRows ?? browseRows;

  const rows: Row[] = useMemo(() => {
    const mapped: Row[] = sourceParts.map((part) => {
      const meta = partMeta(part);
      const v = vehicleById(part.fitments[0]?.vehicleId ?? '');
      const t = tierPrices(part);
      const s = stockCols(part);
      const fitList = fitments(part, vehicleQuery);
      const selRow = fitList.find((f) => f.selected) ?? fitList[0];
      const cm = selRow ? confidenceMeta[selRow.level] : confidenceMeta['needs-verification'];
      return {
        part,
        model: v?.model ?? model,
        series: v?.chassis || v?.series || series,
        category: meta.category,
        subGroup: meta.subGroup,
        position: part.position === 'n/a' ? '—' : part.position,
        weight: specWeight(part),
        buy: t.buy,
        workshop: t.workshop,
        list: t.list,
        branch: s.branch,
        melb: s.melb,
        eta: fastestDispatch(part) ?? 'Backorder',
        fitLabel: cm.label,
        fitCls: cm.cls,
      };
    });

    const filtered = resultFilter.trim()
      ? mapped.filter((r) => {
          const hay = `${r.part.partNumber} ${r.part.name} ${r.model} ${r.series} ${r.category} ${r.subGroup}`.toLowerCase();
          return hay.includes(resultFilter.trim().toLowerCase());
        })
      : mapped;

    const sorted = [...filtered];
    const dir = sortDir;
    if (sortKey === 'partno') sorted.sort((a, b) => dir * a.part.partNumber.localeCompare(b.part.partNumber));
    else if (sortKey === 'desc') sorted.sort((a, b) => dir * a.part.name.localeCompare(b.part.name));
    else if (sortKey === 'weight') sorted.sort((a, b) => dir * ((a.weight ?? Infinity) - (b.weight ?? Infinity)));
    else if (sortKey === 'buy') sorted.sort((a, b) => dir * (a.buy - b.buy));
    else if (sortKey === 'workshop') sorted.sort((a, b) => dir * (a.workshop - b.workshop));
    else if (sortKey === 'list') sorted.sort((a, b) => dir * (a.list - b.list));
    else if (sortKey === 'stock') sorted.sort((a, b) => dir * (totalStock(b.part) - totalStock(a.part)));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceParts, resultFilter, sortKey, sortDir, year, engine, transmission]);

  const selected = selectedId ? partById(selectedId) ?? null : null;
  const compareParts = compareIds.map((id) => partById(id)).filter(Boolean) as Part[];

  // --- actions ------------------------------------------------------------
  const runFind = () => {
    if (searchText.trim()) {
      search({ text: searchText.trim(), vehicle: vehicleQuery }).then((res) => {
        setSearchRows(res.matches.map((m) => m.part));
        const id = res.best?.part.id ?? res.matches[0]?.part.id ?? null;
        setSelectedId(id);
        if (id) setTab('overview');
      });
    } else {
      setSearchRows(null);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setResultFilter('');
    setSearchRows(null);
    setGroup('Brake');
    setSubGroup('');
    setYear('');
    setEngine('');
    setTransmission('');
    setSortKey('current');
    setSelectedId(null);
    setRegoMsg(null);
    setCompareIds([]);
  };

  const lookupRegistration = async () => {
    if (!rego.trim()) return;
    const res = await lookupRego(rego);
    if (res?.vehicle) {
      setMake(res.vehicle.make ?? make);
      setModel(res.vehicle.model ?? model);
      const v = vehicles.find((x) => x.id === res.matchedVehicleId);
      setSeries(v?.chassis || v?.series || '');
      if (res.vehicle.year) setYear(String(res.vehicle.year));
      if (res.vehicle.engine) setEngine(res.vehicle.engine);
      setSearchRows(null);
      setRegoMsg(`Matched: ${res.label}`);
    } else {
      setRegoMsg('No vehicle found for that registration.');
    }
  };

  const addSelectedToCart = () => {
    if (selected) addToQuote(selected.id, qty);
  };

  const toggleCompare = (id: string) =>
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );

  const selectPart = (id: string) => {
    setSelectedId(id);
    setTab('overview');
  };

  const setSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const cartLines = state.quote.map((l) => ({ line: l, part: partById(l.partId) })).filter((x) => x.part);

  // --- shared styles (light legacy look) ----------------------------------
  const field = 'h-7 w-full rounded-sm border border-[#9aa4ad] bg-white px-1.5 text-[13px] text-[#1b1b1b] outline-none focus:border-[#2f6fb0]';
  const blueBtn = 'rounded-[3px] bg-gradient-to-b from-[#3f83c4] to-[#2a6aa6] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:from-[#4a90d0] hover:to-[#2f6fb0] active:from-[#2a6aa6] active:to-[#245e96] disabled:opacity-50';
  const label = 'mb-0.5 block text-[11px] font-bold text-[#1b3a5b]';

  return (
    <div className="min-h-screen bg-[#eef0f2] text-[#1b1b1b]" style={{ fontFamily: 'Tahoma, Segoe UI, sans-serif' }}>
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[#1c4a74] bg-gradient-to-b from-[#2f6fb0] to-[#255d96] px-3 py-2 text-white">
        <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/80 bg-[#c2410c] text-white">
          <LogoMark width={22} height={22} />
        </div>
        <h1 className="flex-1 text-center text-xl font-bold tracking-wide">Parts Catalogue</h1>
        <div className="text-sm font-semibold">
          YOUNIS SHAIKH <span className="opacity-90">({quoteCount})</span>
        </div>
        <button onClick={() => navigate('/')} className={`${blueBtn} ml-3`}>Log Off</button>
      </header>

      <div className="space-y-2 p-2">
        {/* ============================ VEHICLE BAR ============================ */}
        <section className="rounded-sm border border-[#9aa4ad] bg-white">
          <div className="flex items-center gap-2 border-b border-[#d7dbdf] bg-[#f3f5f7] px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-[#1b3a5b]">
            <IconCar width={16} height={16} /> Vehicle
          </div>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2 p-2">
            <Picker label="Make" value={make} onChange={(v) => { setMake(v); const m = vehicles.find((x) => x.make === v); setModel(m?.model ?? ''); setSeries(''); setYear(''); setEngine(''); setTransmission(''); setSearchRows(null); }} options={makeOptions} field={field} labelCls={label} w="w-[150px]" />
            <Picker label="Model" value={model} onChange={(v) => { setModel(v); setSeries(''); setYear(''); setEngine(''); setTransmission(''); setSearchRows(null); }} options={modelOptions} field={field} labelCls={label} w="w-[150px]" />
            <Picker label="Series / Chassis" value={series} onChange={(v) => { setSeries(v); setYear(''); setEngine(''); setTransmission(''); setSearchRows(null); }} options={seriesOptions} field={field} labelCls={label} w="w-[140px]" placeholder="(any)" />
            <Picker label="Year" value={year} onChange={setYear} options={yearOptions} field={field} labelCls={label} w="w-[90px]" placeholder="(any)" />
            <Picker label="Engine" value={engine} onChange={setEngine} options={engineOptions} field={field} labelCls={label} w="w-[150px]" placeholder="(any)" />
            <Picker label="Transmission" value={transmission} onChange={setTransmission} options={transOptions} field={field} labelCls={label} w="w-[120px]" placeholder="(any)" />

            {/* Rego lookup */}
            <div className="ml-auto flex items-end gap-1">
              <div className="w-[130px]">
                <span className={label}>Rego lookup <span className="font-normal text-[#8a8a8a]">(mock)</span></span>
                <input value={rego} onChange={(e) => setRego(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && lookupRegistration()} placeholder="e.g. ABC123" className={`${field} font-mono uppercase`} />
              </div>
              <button onClick={lookupRegistration} className={blueBtn}>Find</button>
            </div>
          </div>

          {/* Derived vehicle chips + rego message */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[#eceef0] px-2 py-1.5 text-[12px]">
            {activeVehicle ? (
              <>
                <VehChip k="Drive" v={activeVehicle.drive} />
                <VehChip k="Fuel" v={fuelFor(activeVehicle)} />
                <VehChip k="Body" v={activeVehicle.bodyType} />
                <VehChip k="Chassis" v={activeVehicle.chassis} />
                <VehChip k="Build" v={productionPeriod(activeVehicle)} />
                <VehChip k="Year" v={year || undefined} />
                <VehChip k="Engine" v={engine || undefined} />
              </>
            ) : (
              <span className="text-[#8a8a8a]">Select a make &amp; model.</span>
            )}
            {regoMsg && (
              <span className={`ml-auto rounded-sm border px-2 py-0.5 font-semibold ${regoMsg.startsWith('Matched') ? 'border-[#1b7a3a] bg-[#e4f6e9] text-[#1b7a3a]' : 'border-[#c0392b] bg-[#fbe4e0] text-[#a5281b]'}`}>{regoMsg}</span>
            )}
            <span className="mt-0.5 w-full text-[11px] text-[#8a8a8a]">
              Demo rego plates:{' '}
              {demoPlates.slice(0, 5).map((p) => (
                <button key={p} onClick={() => { setRego(p); }} className="mx-0.5 font-mono text-[#2a6aa6] hover:underline">{p}</button>
              ))}
            </span>
          </div>
        </section>

        {/* ============================ CATALOGUE + SEARCH ============================ */}
        <section className="flex flex-wrap items-end gap-x-3 gap-y-2 rounded-sm border border-[#9aa4ad] bg-white p-2">
          <Picker label="Group" value={group} onChange={(v) => { setGroup(v as PartCategory); setSubGroup(''); setSearchRows(null); }} options={groupOptions} field={field} labelCls={label} w="w-[150px]" uppercase />
          <Picker label="Sub-Group" value={subGroup} onChange={(v) => { setSubGroup(v); setSearchRows(null); }} options={subGroupOptions} field={field} labelCls={label} w="w-[170px]" placeholder="(all)" uppercase />

          <div className="w-[260px]">
            <span className={label}>Intelligent search <span className="font-normal text-[#8a8a8a]">(natural language / part no.)</span></span>
            <div className="flex gap-1">
              <input value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runFind()} placeholder="e.g. rear shockey for a 79" className={field} />
              <button onClick={runFind} className={blueBtn}>Find</button>
            </div>
          </div>
          <button onClick={clearFilters} className={blueBtn}>Clear Filters</button>

          <div className="w-[160px]">
            <span className={label}>Order results by</span>
            <Select value={sortKey} onChange={(v) => setSort(v as SortKey)} options={['current', 'partno', 'desc', 'weight', 'buy', 'workshop', 'list', 'stock']} labels={{ current: 'Current selection', partno: 'Part No.', desc: 'Description', weight: 'Weight', buy: 'Buy price', workshop: 'Workshop', list: 'List price', stock: 'Stock' }} className={field} />
          </div>

          <div className="ml-auto flex items-center gap-3 text-[13px]">
            {searchRows && <span className="rounded-sm border border-[#2a6aa6] bg-[#eaf2fb] px-2 py-0.5 font-semibold text-[#1b4f8a]">AI results</span>}
            <span className="font-semibold text-[#c0392b]">{rows.length} matches found</span>
          </div>
        </section>

        {/* ============================ RESULTS + CART ============================ */}
        <div className="flex flex-wrap gap-2">
          <div className="min-w-[560px] flex-1">
            <div className="mb-1 flex items-center gap-2">
              <input value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} placeholder="Filter within results…" className={`${field} w-[220px]`} />
              {compareParts.length > 0 && (
                <span className="text-[12px] font-semibold text-[#1b3a5b]">
                  {compareParts.length} selected to compare {compareParts.length < 2 && <span className="font-normal text-[#8a8a8a]">(pick 2–3)</span>}
                </span>
              )}
              {compareParts.length > 0 && (
                <button onClick={() => setCompareIds([])} className="text-[12px] text-[#2a6aa6] hover:underline">clear</button>
              )}
            </div>
            <div className="overflow-auto rounded-sm border border-[#9aa4ad] bg-white">
              <table className="w-full border-collapse font-mono text-[12.5px]">
                <thead>
                  <tr className="border-b-2 border-[#1b3a5b] bg-[#f3f5f7] text-left text-[#1b3a5b]">
                    <Th>Cmp</Th>
                    <Th sortable onClick={() => setSort('partno')} active={sortKey === 'partno'} dir={sortDir}>Part No</Th>
                    <Th sortable onClick={() => setSort('desc')} active={sortKey === 'desc'} dir={sortDir}>Description</Th>
                    <Th>Model</Th>
                    <Th>Series</Th>
                    <Th>Category</Th>
                    <Th>Sub-Group</Th>
                    <Th>Pos</Th>
                    <Th>Fitment</Th>
                    <Th sortable onClick={() => setSort('weight')} active={sortKey === 'weight'} dir={sortDir} right>Wt</Th>
                    <Th sortable onClick={() => setSort('buy')} active={sortKey === 'buy'} dir={sortDir} right>Buy</Th>
                    <Th sortable onClick={() => setSort('workshop')} active={sortKey === 'workshop'} dir={sortDir} right>Workshop</Th>
                    <Th sortable onClick={() => setSort('list')} active={sortKey === 'list'} dir={sortDir} right>List</Th>
                    <Th right>Branch</Th>
                    <Th right>Melb</Th>
                    <Th>ETA</Th>
                    <Th>Photo</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const active = r.part.id === selectedId;
                    const checked = compareIds.includes(r.part.id);
                    return (
                      <tr
                        key={r.part.id}
                        onClick={() => selectPart(r.part.id)}
                        className={`cursor-pointer border-b border-[#e3d9cf] ${active ? 'bg-[#fcd9b8]' : idx % 2 ? 'bg-[#fdeede]' : 'bg-white'} hover:bg-[#fce3cb]`}
                      >
                        <td className="px-2 py-1" onClick={(e) => { e.stopPropagation(); toggleCompare(r.part.id); }}>
                          <input type="checkbox" checked={checked} readOnly disabled={!checked && compareIds.length >= 3} />
                        </td>
                        <td className="whitespace-nowrap px-2 py-1 font-semibold text-[#1b4f8a]">{r.part.partNumber}</td>
                        <td className="max-w-[260px] truncate px-2 py-1 uppercase" title={r.part.name}>{r.part.name.split(' — ')[0]}</td>
                        <td className="whitespace-nowrap px-2 py-1 uppercase">{r.model}</td>
                        <td className="whitespace-nowrap px-2 py-1">{r.series}</td>
                        <td className="whitespace-nowrap px-2 py-1 uppercase">{r.category}</td>
                        <td className="whitespace-nowrap px-2 py-1 uppercase">{r.subGroup}</td>
                        <td className="whitespace-nowrap px-2 py-1 capitalize">{r.position}</td>
                        <td className="whitespace-nowrap px-2 py-1">
                          <span className={`rounded-sm border px-1 py-0.5 text-[10px] font-bold ${r.fitCls}`}>{r.fitLabel}</span>
                        </td>
                        <td className="px-2 py-1 text-right">{r.weight != null ? r.weight : '—'}</td>
                        <td className="px-2 py-1 text-right">{money(r.buy)}</td>
                        <td className="px-2 py-1 text-right">{money(r.workshop)}</td>
                        <td className="px-2 py-1 text-right font-semibold">{money(r.list)}</td>
                        <td className="px-2 py-1 text-right">{r.branch}</td>
                        <td className="px-2 py-1 text-right">{r.melb}</td>
                        <td className="whitespace-nowrap px-2 py-1 text-[11px]">{r.eta}</td>
                        <td className="px-2 py-1"><IconCamera width={14} height={14} className="text-[#2a6aa6]" /></td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={17} className="px-3 py-6 text-center text-[#8a8a8a]">No parts match the current selection.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-1 text-[11px] text-[#8a8a8a]">
              Buy = lowest supplier price · Workshop = indicative (list × 0.8) · List = catalogue RRP · prices AUD ex GST · stock is demo data, not live.
            </div>
          </div>

          {/* Cart */}
          <aside className="w-[280px] shrink-0">
            <div className="rounded-sm border border-[#9aa4ad] bg-white">
              <div className="flex items-center gap-2 border-b border-[#d7dbdf] bg-[#f3f5f7] px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-[#1b3a5b]">
                Cart ({quoteCount})
              </div>
              <div className="flex items-center gap-1 border-b border-[#eceef0] p-2">
                <span className="text-[11px] font-bold text-[#1b3a5b]">Qty</span>
                <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="h-7 w-12 rounded-sm border border-[#9aa4ad] bg-white px-1.5 text-[13px]" />
                <button onClick={addSelectedToCart} disabled={!selected} className={`${blueBtn} px-2`}>Add</button>
                <button onClick={addSelectedToCart} disabled={!selected} className={`${blueBtn} px-2`}>List Only</button>
              </div>
              <div className="grid grid-cols-[1fr_32px_56px] gap-1 border-b border-[#9aa4ad] px-2 py-1 text-[11px] font-bold text-[#1b3a5b]">
                <span>Part No.</span><span className="text-right">Qty</span><span className="text-right">Price</span>
              </div>
              <div className="h-[170px] overflow-y-auto p-1 text-[12px]">
                {cartLines.length === 0 ? (
                  <div className="p-2 text-[#8a8a8a]">Cart is empty</div>
                ) : (
                  cartLines.map(({ line, part }) => (
                    <div key={line.partId} className="grid cursor-pointer grid-cols-[1fr_32px_56px] gap-1 py-0.5 font-mono hover:bg-[#f3f5f7]" onClick={() => selectPart(part!.id)}>
                      <span className="truncate text-[#2a6aa6]">{part!.partNumber}</span>
                      <span className="text-right">{line.quantity}</span>
                      <span className="text-right">{money(part!.price)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-[#eceef0] p-2">
                <button onClick={() => navigate('/quotes')} className={`${blueBtn} w-full`}>Manage Cart / Quote</button>
              </div>
            </div>
          </aside>
        </div>

        {/* ============================ COMPARE PANEL ============================ */}
        <AnimatePresence>
          {compareParts.length >= 2 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden rounded-sm border border-[#9aa4ad] bg-white"
            >
              <ComparePanel parts={compareParts} vq={vehicleQuery} onRemove={toggleCompare} onSelect={selectPart} onAdd={(id) => addToQuote(id, 1)} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ============================ PART DETAIL (8 tabs) ============================ */}
        <section className="rounded-sm border border-[#9aa4ad] bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#d7dbdf] bg-[#f3f5f7] px-2 py-1.5">
            <IconLayers width={16} height={16} className="text-[#1b3a5b]" />
            {selected ? (
              <span className="text-[13px] font-bold text-[#1b3a5b]">
                <span className="font-mono text-[#1b4f8a]">{selected.partNumber}</span> — <span className="uppercase">{selected.name.split(' — ')[0]}</span>
              </span>
            ) : (
              <span className="text-[13px] font-semibold text-[#8a8a8a]">Select a part from the results to view full details</span>
            )}
            {selected && (
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => toggleCompare(selected.id)} className="rounded-sm border border-[#9aa4ad] bg-white px-2 py-1 text-[12px] font-semibold text-[#1b3a5b] hover:bg-[#eef2f6]">
                  {compareIds.includes(selected.id) ? '✓ In compare' : '+ Compare'}
                </button>
                <button onClick={addSelectedToCart} className={blueBtn}>Add to Cart</button>
              </div>
            )}
          </div>

          {/* Tab strip */}
          <div className="flex flex-wrap items-end gap-0.5 border-b border-[#9aa4ad] bg-[#e7ebef] px-1 pt-1 text-[12px]">
            {TABS.map(([k, labelTxt]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                disabled={!selected}
                className={`rounded-t-sm border border-b-0 px-2.5 py-1 ${tab === k && selected ? 'border-[#9aa4ad] bg-white font-bold text-[#1b3a5b]' : 'border-transparent text-[#4b4b4b] hover:text-[#1b3a5b]'} disabled:opacity-40`}
              >
                {labelTxt}
              </button>
            ))}
          </div>

          <div className="min-h-[220px] p-3">
            {!selected ? (
              <div className="grid h-[200px] place-items-center text-[#8a8a8a]">
                <div className="text-center">
                  <IconLayers width={40} height={40} className="mx-auto text-[#c2c8ce]" />
                  <p className="mt-2 text-[13px]">Pick a part to see Overview, Specifications, Fitment, OEM References, Availability, Related Parts, History and Documents.</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab + selected.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  {tab === 'overview' && <OverviewTab part={selected} />}
                  {tab === 'specs' && <SpecsTab part={selected} />}
                  {tab === 'fitment' && <FitmentTab part={selected} vq={vehicleQuery} />}
                  {tab === 'oem' && <OemTab part={selected} />}
                  {tab === 'availability' && <AvailabilityTab part={selected} />}
                  {tab === 'related' && <RelatedTab part={selected} vq={vehicleQuery} onSelect={selectPart} onAdd={(id) => addToQuote(id, 1)} />}
                  {tab === 'history' && <HistoryTab part={selected} />}
                  {tab === 'documents' && <DocumentsTab part={selected} />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ===========================================================================
// Tabs
// ===========================================================================

function OverviewTab({ part }: { part: Part }) {
  const g = generalInfo(part);
  const p = pricing(part);
  return (
    <div className="flex flex-wrap gap-4">
      <div className="min-w-[320px] flex-1">
        <SectionTitle>General information</SectionTitle>
        <InfoTable
          rows={[
            ['Part number', g.catalogueNumber],
            ['Description', g.description],
            ['Brand', g.brand],
            ['Category', g.category],
            ['Sub-category', g.subCategory],
            ['Part type', g.partType],
            ['Position', g.position],
            ['Side', g.side],
            ['Application', g.application],
            ['Status', g.status],
          ]}
        />
      </div>
      <div className="w-[260px]">
        <SectionTitle>Pricing <span className="font-normal text-[#8a8a8a]">(AUD ex GST)</span></SectionTitle>
        <InfoTable
          rows={[
            ['Buy price', `$${money(p.buy)}`],
            ['Workshop price', `$${money(p.workshop)}`],
            ['List / RRP', `$${money(p.list)}`],
            ['Trade price', p.trade == null ? null : `$${money(p.trade)}`],
            ['GST (10%)', `$${money(p.gst)}`],
            ['Currency', p.currency],
            ['Price validity', p.validity],
          ]}
        />
        <div className="mt-3 grid h-[90px] place-items-center rounded-sm border border-[#d7dbdf] bg-[#f6f7f9] text-[#8a9099]">
          <div className="text-center"><IconImage width={28} height={28} className="mx-auto" /><div className="text-[11px]">No product image</div></div>
        </div>
      </div>
    </div>
  );
}

function SpecsTab({ part }: { part: Part }) {
  const rows = technical(part);
  return (
    <div>
      <SectionTitle>Technical specifications</SectionTitle>
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <FieldTable rows={rows.slice(0, Math.ceil(rows.length / 2))} />
        <FieldTable rows={rows.slice(Math.ceil(rows.length / 2))} />
      </div>
      <p className="mt-2 text-[11px] text-[#8a8a8a]">Catalogue spec data (prototype). Blank fields are shown as “Not specified”, not estimated.</p>
    </div>
  );
}

function FitmentTab({ part, vq }: { part: Part; vq: VehicleQuery }) {
  const list = fitments(part, vq);
  return (
    <div>
      <SectionTitle>Vehicle fitment</SectionTitle>
      <div className="overflow-auto rounded-sm border border-[#d7dbdf]">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[#c7cdd3] bg-[#f3f5f7] text-left text-[#1b3a5b]">
              {['Vehicle', 'Years', 'Engine', 'Trans', 'Body', 'Drive', 'Pos', 'Side', 'Qty', 'Confidence'].map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-1 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((f, i) => {
              const cm = confidenceMeta[f.level];
              return (
                <tr key={i} className={`border-b border-[#eceef0] ${f.selected ? 'bg-[#eaf2fb]' : i % 2 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                  <td className="whitespace-nowrap px-2 py-1 font-semibold">{f.vehicle}{f.selected && <span className="ml-1 text-[10px] text-[#2a6aa6]">(selected)</span>}</td>
                  <td className="whitespace-nowrap px-2 py-1">{f.yearRange}</td>
                  <td className="whitespace-nowrap px-2 py-1">{f.engine}</td>
                  <td className="whitespace-nowrap px-2 py-1">{f.transmission}</td>
                  <td className="whitespace-nowrap px-2 py-1">{f.body}</td>
                  <td className="whitespace-nowrap px-2 py-1">{f.drive}</td>
                  <td className="whitespace-nowrap px-2 py-1">{f.position}</td>
                  <td className="whitespace-nowrap px-2 py-1">{f.side}</td>
                  <td className="whitespace-nowrap px-2 py-1 text-center">{f.qtyRequired}</td>
                  <td className="whitespace-nowrap px-2 py-1"><span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${cm.cls}`}>{cm.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Reasons for the selected row */}
      {(() => {
        const sel = list.find((f) => f.selected);
        if (!sel) return <p className="mt-2 text-[12px] text-[#8a8a8a]">Select a Year/Engine in the vehicle bar to verify fitment for a specific build.</p>;
        return (
          <div className="mt-2 rounded-sm border border-[#d7dbdf] bg-[#fafbfc] p-2 text-[12px]">
            <div className="font-bold text-[#1b3a5b]">Why “{confidenceMeta[sel.level].label}” for {sel.vehicle}:</div>
            <ul className="mt-1 list-disc pl-5 text-[#3a3a3a]">{sel.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        );
      })()}
      <p className="mt-2 flex items-center gap-1 text-[11px] text-[#8a6100]"><IconWarn width={13} height={13} /> Fitment confidence is a guide — an AI suggestion is never treated as confirmed fitment. Always verify before ordering.</p>
    </div>
  );
}

function OemTab({ part }: { part: Part }) {
  const refs = references(part);
  const badge = (r: RefRow) => {
    if (r.origin === 'verified') return <span className="rounded-sm border border-[#1b7a3a] bg-[#e4f6e9] px-1.5 py-0.5 text-[10px] font-bold text-[#1b7a3a]">VERIFIED</span>;
    if (r.origin === 'suggested') return <span className="rounded-sm border border-[#b8860b] bg-[#fdf3dc] px-1.5 py-0.5 text-[10px] font-bold text-[#8a6100]">SUGGESTED</span>;
    return <span className="rounded-sm border border-[#b8c0c8] bg-[#f0f2f4] px-1.5 py-0.5 text-[10px] font-bold text-[#8a8a8a]">N/A</span>;
  };
  return (
    <div>
      <SectionTitle>OEM &amp; aftermarket cross-references</SectionTitle>
      <div className="overflow-hidden rounded-sm border border-[#d7dbdf]">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-[#c7cdd3] bg-[#f3f5f7] text-left text-[#1b3a5b]">
              <th className="px-2 py-1 font-bold">Reference</th>
              <th className="px-2 py-1 font-bold">Number</th>
              <th className="px-2 py-1 font-bold">Status</th>
              <th className="px-2 py-1 font-bold">Note</th>
            </tr>
          </thead>
          <tbody>
            {refs.map((r, i) => (
              <tr key={i} className={`border-b border-[#eceef0] ${i % 2 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                <td className="whitespace-nowrap px-2 py-1 font-semibold text-[#1b3a5b]">{r.label}</td>
                <td className="whitespace-nowrap px-2 py-1 font-mono">{r.value ?? <span className="text-[#a0a0a0]">Not available</span>}</td>
                <td className="px-2 py-1">{badge(r)}</td>
                <td className="px-2 py-1 text-[11px] text-[#6b7178]">{r.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[#8a8a8a]">Source: {referenceSource}. Verified = our own catalogue number; suggested matches are not manufacturer-confirmed equivalence.</p>
    </div>
  );
}

function AvailabilityTab({ part }: { part: Part }) {
  const a = availability(part);
  const statusCls =
    a.status === 'in-stock' ? 'border-[#1b7a3a] bg-[#e4f6e9] text-[#1b7a3a]' :
    a.status === 'low' ? 'border-[#b8860b] bg-[#fdf3dc] text-[#8a6100]' :
    'border-[#c0392b] bg-[#fbe4e0] text-[#a5281b]';
  const statusLabel = a.status === 'in-stock' ? 'IN STOCK' : a.status === 'low' ? 'LOW STOCK' : 'OUT OF STOCK';
  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <SectionTitle>Availability by branch</SectionTitle>
        <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold ${statusCls}`}>{statusLabel}</span>
        <span className="text-[12px] text-[#3a3a3a]">Total available: <b>{a.totalAvailable}</b></span>
      </div>
      <div className="overflow-auto rounded-sm border border-[#d7dbdf]">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[#c7cdd3] bg-[#f3f5f7] text-left text-[#1b3a5b]">
              {['Branch', 'Warehouse', 'Available', 'Reserved', 'Incoming', 'ETA / Lead time'].map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-1 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {a.rows.map((r, i) => (
              <tr key={i} className={`border-b border-[#eceef0] ${i % 2 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                <td className="whitespace-nowrap px-2 py-1 font-semibold">{r.branch}</td>
                <td className="whitespace-nowrap px-2 py-1">{r.warehouse}</td>
                <td className={`px-2 py-1 font-semibold ${r.available > 0 ? 'text-[#1b7a3a]' : 'text-[#a5281b]'}`}>{r.available}</td>
                <td className="px-2 py-1 text-[#a0a0a0]">{r.reserved ?? '—'}</td>
                <td className="px-2 py-1 text-[#a0a0a0]">{r.incoming ?? '—'}</td>
                <td className="whitespace-nowrap px-2 py-1">{r.eta}</td>
              </tr>
            ))}
            {a.rows.length === 0 && <tr><td colSpan={6} className="px-2 py-3 text-center text-[#8a8a8a]">No supplier stock records.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-[#8a8a8a]"><IconWarn width={13} height={13} /> {a.note}</p>
    </div>
  );
}

function RelatedTab({ part, vq, onSelect, onAdd }: { part: Part; vq: VehicleQuery; onSelect: (id: string) => void; onAdd: (id: string) => void }) {
  const groups = relatedParts(part, vq);
  if (groups.length === 0) return <p className="text-[12px] text-[#8a8a8a]">No related catalogue items for this part/vehicle.</p>;
  return (
    <div className="space-y-4">
      {groups.map((grp) => (
        <div key={grp.title}>
          <SectionTitle>
            {grp.title}{' '}
            <span className={`ml-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${grp.kind === 'catalogue' ? 'border-[#1b7a3a] bg-[#e4f6e9] text-[#1b7a3a]' : 'border-[#2a6aa6] bg-[#eaf2fb] text-[#1b4f8a]'}`}>
              {grp.kind === 'catalogue' ? 'CATALOGUE RELATIONSHIP' : 'ALTERNATE GRADE'}
            </span>
          </SectionTitle>
          <div className="overflow-auto rounded-sm border border-[#d7dbdf]">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#c7cdd3] bg-[#f3f5f7] text-left text-[#1b3a5b]">
                  {['Part No', 'Description', 'Buy', 'List', 'Stock', ''].map((h) => <th key={h} className="px-2 py-1 font-bold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {grp.parts.map((p, i) => (
                  <tr key={p.id} className={`border-b border-[#eceef0] ${i % 2 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                    <td className="cursor-pointer whitespace-nowrap px-2 py-1 font-mono font-semibold text-[#1b4f8a] hover:underline" onClick={() => onSelect(p.id)}>{p.partNumber}</td>
                    <td className="max-w-[320px] truncate px-2 py-1 uppercase">{p.name.split(' — ')[0]}</td>
                    <td className="px-2 py-1 text-right">${money(bestPrice(p))}</td>
                    <td className="px-2 py-1 text-right">${money(p.price)}</td>
                    <td className="px-2 py-1 text-right">{cap(totalStock(p))}</td>
                    <td className="px-2 py-1 text-right"><button onClick={() => onAdd(p.id)} className="rounded-sm border border-[#2a6aa6] bg-[#eaf2fb] px-2 py-0.5 text-[11px] font-semibold text-[#1b4f8a] hover:bg-[#dbeafe]">+ Cart</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ part }: { part: Part }) {
  const { state } = useAppStore();
  const sections = history(part, { orders: state.orders, rfqs: state.rfqs, history: state.history });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {sections.map((s) => (
        <div key={s.title}>
          <SectionTitle>{s.title}</SectionTitle>
          {s.entries.length === 0 ? (
            <p className="text-[12px] text-[#8a8a8a]">{s.emptyNote}</p>
          ) : (
            <ul className="space-y-1">
              {s.entries.map((e, i) => (
                <li key={i} className="rounded-sm border border-[#eceef0] bg-[#fafbfc] px-2 py-1 text-[12px]">
                  <div className="font-semibold text-[#1b3a5b]">{e.primary}</div>
                  <div className="text-[11px] text-[#6b7178]">{e.secondary}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function DocumentsTab({ part }: { part: Part }) {
  const docs = documents(part);
  return (
    <div>
      <SectionTitle>Documents &amp; media</SectionTitle>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {docs.map((d) => (
          <div key={d.label} className="rounded-sm border border-[#d7dbdf] bg-[#fafbfc] p-2">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#1b3a5b]">
              {d.available ? <IconCheck width={13} height={13} className="text-[#1b7a3a]" /> : <IconDoc width={13} height={13} className="text-[#8a9099]" />}
              {d.label}
            </div>
            {d.body?.length ? (
              <ul className="mt-1 list-disc pl-5 text-[12px] text-[#3a3a3a]">{d.body.map((b, i) => <li key={i}>{b}</li>)}</ul>
            ) : (
              <div className="mt-1 text-[11px] text-[#8a8a8a]">{d.note}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Compare panel
// ===========================================================================

function ComparePanel({ parts, vq, onRemove, onSelect, onAdd }: { parts: Part[]; vq: VehicleQuery; onRemove: (id: string) => void; onSelect: (id: string) => void; onAdd: (id: string) => void }) {
  const dims = (p: Part) => {
    const x = partSpecs[p.id.split('__')[0]];
    if (!x) return '—';
    const d = [x.lengthMm, x.widthMm, x.heightMm];
    return d.every((n) => n != null) ? `${d[0]}×${d[1]}×${d[2]} mm` : '—';
  };
  const matFor = (p: Part) => partSpecs[p.id.split('__')[0]]?.material ?? '—';
  const wtFor = (p: Part) => { const w = partSpecs[p.id.split('__')[0]]?.weightKg; return w != null ? `${w} kg` : '—'; };
  const fitFor = (p: Part) => {
    const list = fitments(p, vq);
    const sel = list.find((f) => f.selected) ?? list[0];
    return sel ? confidenceMeta[sel.level] : null;
  };
  const appFor = (p: Part) => { const v = vehicleById(p.fitments[0]?.vehicleId ?? ''); return v ? vehicleLabel(v) : '—'; };

  const rowDefs: [string, (p: Part) => React.ReactNode][] = [
    ['Part No', (p) => <span className="font-mono font-semibold text-[#1b4f8a]">{p.partNumber}</span>],
    ['Description', (p) => <span className="uppercase">{p.name.split(' — ')[0]}</span>],
    ['Vehicle application', (p) => appFor(p)],
    ['Fitment', (p) => { const cm = fitFor(p); return cm ? <span className={`rounded-sm border px-1 py-0.5 text-[10px] font-bold ${cm.cls}`}>{cm.label}</span> : '—'; }],
    ['Material', (p) => matFor(p)],
    ['Dimensions', (p) => dims(p)],
    ['Weight', (p) => wtFor(p)],
    ['Buy', (p) => `$${money(bestPrice(p))}`],
    ['Workshop', (p) => `$${money(Math.round(p.price * 0.8))}`],
    ['List', (p) => `$${money(p.price)}`],
    ['Available stock', (p) => cap(totalStock(p))],
    ['ETA', (p) => fastestDispatch(p) ?? 'Backorder'],
  ];

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-[#d7dbdf] bg-[#f3f5f7] px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-[#1b3a5b]">
        Compare parts ({parts.length})
      </div>
      <div className="overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[#c7cdd3] bg-[#fafbfc]">
              <th className="w-[150px] px-2 py-1 text-left text-[#1b3a5b]">Attribute</th>
              {parts.map((p) => (
                <th key={p.id} className="px-2 py-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => onSelect(p.id)} className="font-mono text-[#1b4f8a] hover:underline">{p.partNumber}</button>
                    <button onClick={() => onRemove(p.id)} className="text-[#a5281b] hover:opacity-70" title="Remove"><IconX width={12} height={12} /></button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowDefs.map(([labelTxt, render], i) => (
              <tr key={labelTxt} className={`border-b border-[#eceef0] ${i % 2 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                <td className="px-2 py-1 font-semibold text-[#1b3a5b]">{labelTxt}</td>
                {parts.map((p) => <td key={p.id} className="px-2 py-1">{render(p)}</td>)}
              </tr>
            ))}
            <tr className="border-t border-[#c7cdd3]">
              <td className="px-2 py-1"></td>
              {parts.map((p) => (
                <td key={p.id} className="px-2 py-1"><button onClick={() => onAdd(p.id)} className="rounded-sm border border-[#2a6aa6] bg-[#eaf2fb] px-2 py-0.5 text-[11px] font-semibold text-[#1b4f8a] hover:bg-[#dbeafe]">+ Add to Cart</button></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// Small presentational helpers
// ===========================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-[#1b3a5b]">{children}</div>;
}

function InfoTable({ rows }: { rows: [string, string | null][] }) {
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={k} className={`border-b border-[#eceef0] ${i % 2 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
            <td className="w-[42%] px-2 py-1 font-semibold text-[#45505b]">{k}</td>
            <td className="px-2 py-1">{v ?? <span className="text-[#a0a0a0]">Not available</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FieldTable({ rows }: { rows: Field[] }) {
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.label + i} className={`border-b border-[#eceef0] ${i % 2 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
            <td className="w-[48%] px-2 py-1 font-semibold text-[#45505b]">{r.label}</td>
            <td className="px-2 py-1">{r.value ?? <span className="text-[#a0a0a0]">Not specified</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VehChip({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null;
  return (
    <span className="rounded-sm border border-[#c7cdd3] bg-[#f3f5f7] px-2 py-0.5">
      <span className="font-bold text-[#1b3a5b]">{k}:</span> <span className="text-[#3a3a3a]">{v}</span>
    </span>
  );
}

function Th({ children, right, sortable, onClick, active, dir }: { children: React.ReactNode; right?: boolean; sortable?: boolean; onClick?: () => void; active?: boolean; dir?: 1 | -1 }) {
  return (
    <th
      onClick={onClick}
      className={`whitespace-nowrap px-2 py-1 font-bold ${right ? 'text-right' : 'text-left'} ${sortable ? 'cursor-pointer select-none hover:text-[#2a6aa6]' : ''}`}
    >
      {children}
      {sortable && active && <span className="ml-0.5">{dir === 1 ? '▲' : '▼'}</span>}
    </th>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
  field,
  labelCls,
  w,
  placeholder,
  uppercase,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  field: string;
  labelCls: string;
  w: string;
  placeholder?: string;
  uppercase?: boolean;
}) {
  return (
    <div className={w}>
      <span className={labelCls}>{label}</span>
      <Select value={value} onChange={onChange} options={options} className={field} placeholder={placeholder} uppercase={uppercase} />
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  labels,
  placeholder,
  uppercase,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
  placeholder?: string;
  uppercase?: boolean;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} appearance-none pr-6 ${uppercase ? 'uppercase' : ''}`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>{labels?.[o] ?? (uppercase ? o.toUpperCase() : o)}</option>
        ))}
      </select>
      <IconChevron width={12} height={12} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 text-[#5b6168]" />
    </div>
  );
}

// Keep the category thumb available for future layout use.
export function PartThumbLight({ part, fallbackCategory }: { part: Part | null; fallbackCategory: PartCategory }) {
  const cat = part ? partMeta(part).category : fallbackCategory;
  return <CategoryIcon category={cat} width={54} height={54} className="text-[#6b7178]" />;
}

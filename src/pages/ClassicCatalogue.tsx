import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Part, PartCategory, VehicleQuery } from '@/types';
import { vehicles, vehicleById } from '@/data/vehicles';
import { catalogueTree, browseCatalogue, partMeta } from '@/services/catalogue';
import { search } from '@/services/partsSearch';
import { bestPrice, totalStock } from '@/services/inventory';
import { lookupRego, demoPlates } from '@/services/registration';
import { useAppStore } from '@/store/AppStore';
import { partById } from '@/data/parts';
import { LogoMark, IconCamera, IconChevron, IconCar, CategoryIcon } from '@/components/icons';

/**
 * CLASSIC CATALOGUE
 * ------------------------------------------------------------------
 * A faithful, light "Windows-style" recreation of the legacy parts-counter
 * catalogue screen (Make → Model → Series → Group → Sub-Group across the top,
 * Item Details / Admin / Vehicle Registration tabs, and a dense results table
 * with Buy / Workshop / List prices, Branch + Melb stock and a Photo column),
 * wired to PARTS IQ's existing data + services — PLUS an intelligent search
 * tool (natural language / part number / rego) powered by the Parts
 * Intelligence Engine. Standalone full-screen route; the modern app is
 * unchanged. No external branding is copied — the PARTS IQ mark is used.
 */

// Derived commercial tiers from the catalogue list price (prototype — the
// real system has buy/workshop/list columns; we present them transparently).
const tiers = (part: Part) => {
  const list = part.price;
  return { buy: bestPrice(part), workshop: Math.round(list * 0.8), list };
};

const stockCols = (part: Part) => {
  let melb = 0;
  let branch = 0;
  for (const r of part.inventory) {
    if (/melb|vic/i.test(r.warehouse)) melb += r.stock;
    else branch += r.stock;
  }
  const cap = (n: number) => (n > 10 ? '10+' : String(n));
  return { branch: cap(branch || totalStock(part)), melb: cap(melb) };
};

const money = (n: number) => n.toFixed(2);

interface Row {
  part: Part;
  model: string;
  series: string;
  group: string;
  subGroup: string;
}

type Tab = 'item' | 'admin' | 'rego';

export function ClassicCatalogue() {
  const navigate = useNavigate();
  const { addToQuote, state, quoteCount } = useAppStore();

  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Hilux');
  const [series, setSeries] = useState('GUN126');
  const [group, setGroup] = useState<PartCategory | ''>('Brake');
  const [subGroup, setSubGroup] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [orderBy, setOrderBy] = useState('current');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>('item');
  const [searchRows, setSearchRows] = useState<Part[] | null>(null);
  const [rego, setRego] = useState('');
  const [regoMsg, setRegoMsg] = useState<string | null>(null);

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
  const groupOptions = catalogueTree.map((g) => g.category);
  const subGroupOptions = useMemo(
    () => catalogueTree.find((g) => g.category === group)?.subGroups.map((s) => s.name) ?? [],
    [group],
  );

  const vehicleQuery: VehicleQuery = { make, model, series: series || undefined };

  // --- rows ---------------------------------------------------------------
  const browseRows = useMemo(() => {
    const parts = browseCatalogue({ vehicle: vehicleQuery, category: group || undefined, subGroup: subGroup || undefined });
    return parts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [make, model, series, group, subGroup]);

  const sourceParts = searchRows ?? browseRows;

  const rows: Row[] = useMemo(() => {
    const mapped = sourceParts.map((part) => {
      const meta = partMeta(part);
      const v = vehicleById(part.fitments[0]?.vehicleId ?? '');
      return {
        part,
        model: v?.model ?? model,
        series: v?.chassis || v?.series || series,
        group: meta.category,
        subGroup: meta.subGroup,
      };
    });
    const sorted = [...mapped];
    if (orderBy === 'price') sorted.sort((a, b) => tiers(a.part).list - tiers(b.part).list);
    else if (orderBy === 'stock') sorted.sort((a, b) => totalStock(b.part) - totalStock(a.part));
    else if (orderBy === 'partno') sorted.sort((a, b) => a.part.partNumber.localeCompare(b.part.partNumber));
    return sorted;
  }, [sourceParts, orderBy, model, series]);

  const selected = selectedId ? partById(selectedId) ?? null : null;

  // --- actions ------------------------------------------------------------
  const runFind = () => {
    if (searchText.trim()) {
      search({ text: searchText.trim(), vehicle: vehicleQuery }).then((res) => {
        setSearchRows(res.matches.map((m) => m.part));
        setSelectedId(res.best?.part.id ?? res.matches[0]?.part.id ?? null);
      });
    } else {
      setSearchRows(null);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setSearchRows(null);
    setGroup('Brake');
    setSubGroup('');
    setOrderBy('current');
    setSelectedId(null);
    setRegoMsg(null);
  };

  const lookupRegistration = async () => {
    if (!rego.trim()) return;
    const res = await lookupRego(rego);
    if (res?.vehicle) {
      setMake(res.vehicle.make ?? make);
      setModel(res.vehicle.model ?? model);
      const v = vehicles.find((x) => x.id === res.matchedVehicleId);
      setSeries(v?.chassis || v?.series || '');
      setRegoMsg(`Matched: ${res.label}`);
    } else {
      setRegoMsg('No vehicle found for that registration.');
    }
  };

  const addSelectedToCart = () => {
    if (selected) addToQuote(selected.id, qty);
  };

  const cartLines = state.quote.map((l) => ({ line: l, part: partById(l.partId) })).filter((x) => x.part);

  // --- shared styles (light legacy look) ----------------------------------
  const field = 'h-7 w-full rounded-sm border border-[#9aa4ad] bg-white px-1.5 text-[13px] text-[#1b1b1b] outline-none focus:border-[#2f6fb0]';
  const blueBtn = 'rounded-[3px] bg-gradient-to-b from-[#3f83c4] to-[#2a6aa6] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:from-[#4a90d0] hover:to-[#2f6fb0] active:from-[#2a6aa6] active:to-[#245e96]';
  const label = 'mb-0.5 block text-[12px] font-bold text-[#1b3a5b]';
  const thumb = 'flex h-[108px] w-full items-center justify-center overflow-hidden rounded-sm border border-[#9aa4ad] bg-[#cfd3d6]';

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

      <div className="p-2">
        {/* Top control strip */}
        <div className="flex flex-wrap items-start gap-2">
          {/* Make / Model + Clear + Search */}
          <div className="w-[220px] shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={label}>Make</span>
                <Select value={make} onChange={(v) => { setMake(v); const m = vehicles.find((x) => x.make === v); setModel(m?.model ?? ''); setSeries(''); setSearchRows(null); }} options={makeOptions} className={field} />
              </div>
              <div>
                <span className={label}>Model</span>
                <Select value={model} onChange={(v) => { setModel(v); setSeries(''); setSearchRows(null); }} options={modelOptions} className={field} />
              </div>
            </div>
            <button onClick={clearFilters} className={`${blueBtn} mt-2 w-full`}>Clear Filters</button>
            <div className="mt-4">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runFind()}
                placeholder="Search…"
                className={`${field} mb-2`}
              />
              <button onClick={runFind} className={`${blueBtn} w-full`}>Find</button>
            </div>
            <div className="mt-2 text-[13px] font-semibold text-[#c0392b]">{rows.length} matches found</div>
            <div className="mt-2">
              <span className={label}>Order results by</span>
              <Select
                value={orderBy}
                onChange={setOrderBy}
                options={['current', 'price', 'stock', 'partno']}
                labels={{ current: 'Current selection', price: 'Price', stock: 'Stock', partno: 'Part No.' }}
                className={field}
              />
            </div>
          </div>

          {/* Series + vehicle thumb */}
          <Column title="Series">
            <Select value={series} onChange={(v) => { setSeries(v); setSearchRows(null); }} options={seriesOptions} className={field} />
            <div className={`${thumb} mt-2`}>
              <div className="flex flex-col items-center text-[#5b6168]">
                <IconCar width={44} height={44} />
                <span className="mt-1 text-[11px] font-semibold">{make} {model}</span>
              </div>
            </div>
          </Column>

          {/* Group + thumb */}
          <Column title="Group">
            <Select value={group} onChange={(v) => { setGroup(v as PartCategory); setSubGroup(''); setSearchRows(null); }} options={groupOptions} uppercase className={field} />
            <div className={`${thumb} mt-2`}>
              <PartThumbLight part={selected} fallbackCategory={group || 'Brake'} />
            </div>
          </Column>

          {/* Sub-Group + thumb */}
          <Column title="Sub-Group">
            <Select value={subGroup} onChange={(v) => { setSubGroup(v); setSearchRows(null); }} options={subGroupOptions} placeholder="(all)" uppercase className={field} />
            <div className={`${thumb} mt-2`}>
              <PartThumbLight part={selected} fallbackCategory={group || 'Brake'} />
            </div>
          </Column>

          {/* Item details / tabs panel */}
          <div className="min-w-[420px] flex-1">
            <div className="flex items-end gap-0.5 text-[12px]">
              {([['item', 'Item Details'], ['admin', 'Admin'], ['rego', 'Vehicle Registration Details']] as [Tab, string][]).map(([k, labelTxt]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`rounded-t-sm border border-b-0 border-[#9aa4ad] px-2 py-1 ${tab === k ? 'bg-white font-bold text-[#1b3a5b]' : 'bg-[#dfe3e7] text-[#4b4b4b]'}`}
                >
                  {labelTxt}
                </button>
              ))}
            </div>
            <div className="min-h-[150px] rounded-b-sm rounded-tr-sm border border-[#9aa4ad] bg-white p-2">
              {tab === 'item' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="mb-2 inline-block rounded-sm border border-[#9aa4ad] bg-[#eef0f2] px-2 py-0.5 text-[12px] font-semibold text-[#1b3a5b]">More Details…</div>
                    <div className="min-h-[90px] rounded-sm border border-[#d7dbdf] bg-[#fafbfc] p-2 text-[12px] text-[#3a3a3a]">
                      {selected ? selected.description : 'Select a part to see details.'}
                    </div>
                  </div>
                  <div className="w-[170px] text-[12px]">
                    {(['Weight (kg)', 'Length (cm)', 'Height (cm)', 'Width (cm)', 'Volume (m3)'] as const).map((f) => (
                      <div key={f} className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[#333]">{f}</span>
                        <input readOnly value="" className="h-5 w-20 rounded-sm border border-[#b8c0c8] bg-[#e4e6e9]" />
                      </div>
                    ))}
                  </div>
                  <div className="grid h-8 w-8 place-items-center rounded-sm border border-[#9aa4ad] bg-[#eef0f2] text-[#2a6aa6]" title="Email part">✉</div>
                </div>
              )}
              {tab === 'admin' && (
                <div className="text-[12px] text-[#3a3a3a]">
                  <div className="font-bold text-[#1b3a5b]">Catalogue administration</div>
                  <p className="mt-1">Part master maintenance, pricing and stock adjustments map here. View-only in this prototype.</p>
                </div>
              )}
              {tab === 'rego' && (
                <div className="text-[12px]">
                  <div className="font-bold text-[#1b3a5b]">Vehicle Registration Details</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input value={rego} onChange={(e) => setRego(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && lookupRegistration()} placeholder="Enter registration" className={`${field} w-40 font-mono uppercase`} />
                    <button onClick={lookupRegistration} className={blueBtn}>Find Vehicle</button>
                  </div>
                  <div className="mt-1 text-[11px] text-[#5b6168]">Try: {demoPlates.slice(0, 4).map((p) => (
                    <button key={p} onClick={() => setRego(p)} className="mx-0.5 font-mono text-[#2a6aa6] hover:underline">{p}</button>
                  ))}</div>
                  {regoMsg && <div className="mt-2 font-semibold text-[#1b7a3a]">{regoMsg}</div>}
                </div>
              )}
            </div>
            {/* Qty + add buttons */}
            <div className="mt-2 flex items-center gap-2">
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="h-7 w-14 rounded-sm border border-[#9aa4ad] bg-white px-1.5 text-[13px]" />
              <button onClick={addSelectedToCart} disabled={!selected} className={`${blueBtn} disabled:opacity-50`}>Add to Cart</button>
              <button onClick={addSelectedToCart} disabled={!selected} className={`${blueBtn} disabled:opacity-50`}>List Only</button>
              <button onClick={() => navigate('/quotes')} className={`${blueBtn} ml-auto`}>Manage Cart</button>
            </div>
          </div>

          {/* Cart list */}
          <div className="w-[260px] shrink-0">
            <div className="grid grid-cols-[1fr_40px_60px] gap-1 border-b border-[#9aa4ad] pb-1 text-[12px] font-bold text-[#1b3a5b]">
              <span>Part No.</span><span className="text-right">Qty</span><span className="text-right">Price</span>
            </div>
            <div className="h-[150px] overflow-y-auto rounded-b-sm border border-t-0 border-[#9aa4ad] bg-white p-1 text-[12px]">
              {cartLines.length === 0 ? (
                <div className="p-2 text-[#8a8a8a]">Cart is empty</div>
              ) : (
                cartLines.map(({ line, part }) => (
                  <div key={line.partId} className="grid grid-cols-[1fr_40px_60px] gap-1 py-0.5 font-mono">
                    <span className="truncate text-[#2a6aa6]">{part!.partNumber}</span>
                    <span className="text-right">{line.quantity}</span>
                    <span className="text-right">{money(part!.price)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-1 text-right text-[12px] font-semibold text-[#3a3a3a]">Prices are in AUD ex GST</div>
          </div>
        </div>

        {/* Results table */}
        <div className="mt-2 overflow-auto rounded-sm border border-[#9aa4ad] bg-white">
          <table className="w-full border-collapse font-mono text-[13px]">
            <thead>
              <tr className="border-b-2 border-[#1b3a5b] bg-[#f3f5f7] text-left text-[#1b3a5b]">
                {['Part No', 'Req', 'Model', 'Series', 'Group', 'Sub-Group', 'Description', 'Date', 'Buy Price', 'Workshop', 'List', 'Branch', 'Melb', 'Photo'].map((h, i) => (
                  <th key={h} className={`whitespace-nowrap px-2 py-1 font-bold ${i >= 8 && i <= 10 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const t = tiers(r.part);
                const s = stockCols(r.part);
                const active = r.part.id === selectedId;
                return (
                  <tr
                    key={r.part.id}
                    onClick={() => { setSelectedId(r.part.id); }}
                    className={`cursor-pointer border-b border-[#e3d9cf] ${active ? 'bg-[#fcd9b8]' : idx % 2 ? 'bg-[#fdeede]' : 'bg-white'} hover:bg-[#fce3cb]`}
                  >
                    <td className="whitespace-nowrap px-2 py-1 font-semibold text-[#1b4f8a]">{r.part.partNumber}</td>
                    <td className="px-2 py-1">{1}</td>
                    <td className="whitespace-nowrap px-2 py-1 uppercase">{r.model}</td>
                    <td className="whitespace-nowrap px-2 py-1">{r.series}</td>
                    <td className="whitespace-nowrap px-2 py-1 uppercase">{r.group}</td>
                    <td className="whitespace-nowrap px-2 py-1 uppercase">{r.subGroup}</td>
                    <td className="max-w-[320px] truncate px-2 py-1 uppercase" title={r.part.name}>{r.part.name.split(' — ')[0]}</td>
                    <td className="whitespace-nowrap px-2 py-1">{r.part.yearFrom}–{r.part.yearTo}</td>
                    <td className="px-2 py-1 text-right">{money(t.buy)}</td>
                    <td className="px-2 py-1 text-right">{money(t.workshop)}</td>
                    <td className="px-2 py-1 text-right font-semibold">{money(t.list)}</td>
                    <td className="px-2 py-1 text-right">{s.branch}</td>
                    <td className="px-2 py-1 text-right">{s.melb}</td>
                    <td className="px-2 py-1"><IconCamera width={15} height={15} className="text-[#2a6aa6]" /></td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={14} className="px-3 py-6 text-center text-[#8a8a8a]">No parts match the current selection.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- small presentational helpers ----------------------------------------

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-[160px] shrink-0">
      <span className="mb-0.5 block text-[12px] font-bold text-[#1b3a5b]">{title}</span>
      {children}
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

function PartThumbLight({ part, fallbackCategory }: { part: Part | null; fallbackCategory: PartCategory }) {
  const cat = part ? partMeta(part).category : fallbackCategory;
  return <CategoryIcon category={cat} width={54} height={54} className="text-[#6b7178]" />;
}

import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { partById } from '@/data/parts';
import { brandById } from '@/data/brands';
import { vehicles, vehicleById, vehicleLabel, makes } from '@/data/vehicles';
import { offersForPart } from '@/services/suppliers';
import { checkFitment } from '@/services/vehicleFitment';
import { bestPrice, totalStock } from '@/services/inventory';
import { useAppStore } from '@/store/AppStore';
import { RfqModal } from '@/components/RfqModal';
import { Card, PartThumb, StockBadge, QualityBadge, ConfidenceMeter, EmptyState, Divider } from '@/components/ui';
import {
  IconCheck,
  IconX,
  IconWarn,
  IconTag,
  IconPlus,
  IconLayers,
  IconStore,
  IconArrowRight,
} from '@/components/icons';
import { aud, pct } from '@/lib/format';
import type { Part, VehicleQuery, QualityTier } from '@/types';

const tierOf = (part: Part): QualityTier => {
  const t = part.specs.Tier ?? '';
  if (t.includes('OEM')) return 'oem';
  if (t.includes('Premium')) return 'premium';
  if (t.includes('Budget')) return 'budget';
  return 'standard';
};

export function PartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToQuote, buyNow } = useAppStore();
  const part = id ? partById(id) : undefined;
  const [rfqOpen, setRfqOpen] = useState(false);
  const [ordered, setOrdered] = useState<string | null>(null);

  if (!part) {
    return (
      <EmptyState title="Part not found" subtitle="It may have been removed from the catalogue." icon={<IconLayers width={28} height={28} />} />
    );
  }

  const brand = brandById(part.brandId);
  const offers = offersForPart(part);
  const alternatives = part.alternativeIds.map((aid) => partById(aid)).filter((p): p is Part => Boolean(p));

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-xs text-ink-400 hover:text-ink-200">← Back</button>

      {/* Header */}
      <Card className="grid gap-5 p-5 md:grid-cols-[auto,1fr,auto]">
        <PartThumb part={part} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <QualityBadge tier={tierOf(part)} />
            <span className="pill">{part.category}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide text-ink-50">{part.name.split(' — ')[0]}</h1>
          <div className="text-sm text-ink-400">{part.name.split(' — ')[1]}</div>
          {/* 4WD attribute chips — only fields the data actually supports */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {part.position !== 'n/a' && (
              <span className="pill border-iq-500/30 bg-iq-500/5 uppercase text-iq-200">
                {part.position === 'front-rear' ? 'Front & Rear' : part.position}
              </span>
            )}
            {part.side !== 'n/a' && (
              <span className="pill uppercase">{part.side === 'left-right' ? 'Left & Right' : part.side}</span>
            )}
            {part.engine && <span className="pill">{part.engine}</span>}
            <span className="pill">Fits {part.yearFrom}–{part.yearTo}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
            <Meta label="Part number" value={part.partNumber} mono />
            <Meta label="OEM number" value={part.oemNumber} mono />
            <Meta label="Brand" value={brand?.name} />
            <Meta label="Position" value={part.position} />
            <Meta label="Side" value={part.side} />
            <Meta label="Fits years" value={`${part.yearFrom}–${part.yearTo}`} />
          </div>
          <p className="mt-3 text-sm text-ink-300">{part.description}</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="md:text-right">
            <div className="text-3xl font-extrabold text-ink-50">{aud(bestPrice(part))}</div>
            <div className="text-xs text-ink-400">from {offers.length} suppliers</div>
          </div>
          <StockBadge part={part} />
          <div className="flex w-full flex-col gap-2 md:w-48">
            <button onClick={() => addToQuote(part.id)} className="btn-primary w-full">
              <IconPlus width={15} height={15} /> Add to Quote
            </button>
            <button onClick={() => setRfqOpen(true)} className="btn-ghost w-full">
              <IconTag width={15} height={15} /> Request Price
            </button>
            <a href="#alternatives" className="btn-subtle w-full">
              <IconLayers width={15} height={15} /> Find Alternatives
            </a>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Supplier marketplace */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <IconStore width={16} height={16} className="text-iq-400" />
              <h2 className="text-base font-bold text-ink-50">Supplier options</h2>
              <span className="ml-auto text-xs text-ink-400">Compare price · stock · delivery</span>
            </div>
            <div className="space-y-2">
              {offers.map((o, idx) => (
                <div
                  key={o.supplier.id}
                  className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3 ${
                    idx === 0 ? 'border-iq-500/40 bg-iq-500/5' : 'border-ink-700 bg-ink-900'
                  }`}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-md text-xs font-bold text-ink-950" style={{ background: o.supplier.logoColor }}>
                    {o.supplier.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink-50">
                      {o.supplier.name}
                      {idx === 0 && <span className="pill border-iq-500/40 bg-iq-500/10 text-iq-300">Best price</span>}
                    </div>
                    <div className="text-xs text-ink-400">
                      {o.supplier.location} · ★ {o.supplier.rating.toFixed(1)} · {o.record.leadTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-ink-50">{aud(o.record.price)}</div>
                    <div className={`text-xs ${o.record.stock === 0 ? 'text-signal-red' : o.record.stock <= 5 ? 'text-signal-amber' : 'text-signal-green'}`}>
                      {o.record.stock === 0 ? 'Backorder' : `${o.record.stock} in stock`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={o.record.stock === 0}
                      onClick={() => {
                        const order = buyNow(part, o.supplier.id, 1, o.record.price);
                        setOrdered(order.reference);
                      }}
                      className="btn-primary px-3 py-2 text-xs"
                    >
                      Select
                    </button>
                    <button onClick={() => setRfqOpen(true)} className="btn-ghost px-3 py-2 text-xs">
                      Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {ordered && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-signal-green/30 bg-signal-green/5 px-3 py-2 text-sm text-signal-green">
                <IconCheck width={15} height={15} /> Order {ordered} placed.
                <Link to="/orders" className="ml-auto font-semibold underline">View orders</Link>
              </div>
            )}
          </Card>

          {/* Cross references */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <IconLayers width={16} height={16} className="text-iq-400" />
              <h2 className="text-base font-bold text-ink-50">OEM &amp; aftermarket cross references</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-500">
                    <th className="pb-2 pr-4 font-semibold">Brand</th>
                    <th className="pb-2 pr-4 font-semibold">Part number</th>
                    <th className="pb-2 pr-4 font-semibold">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-ink-700">
                    <td className="py-2 pr-4 text-ink-100">{brand?.name}</td>
                    <td className="py-2 pr-4 font-mono text-ink-200">{part.oemNumber}</td>
                    <td className="py-2 pr-4"><QualityBadge tier={tierOf(part)} /></td>
                  </tr>
                  {part.crossReferences.map((c) => (
                    <tr key={c.partNumber} className="border-t border-ink-700">
                      <td className="py-2 pr-4 text-ink-100">{brandById(c.brandId)?.name ?? c.brandId}</td>
                      <td className="py-2 pr-4 font-mono text-ink-200">{c.partNumber}</td>
                      <td className="py-2 pr-4"><QualityBadge tier={c.quality} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Alternatives */}
          <section id="alternatives">
            <div className="mb-3 flex items-center gap-2">
              <IconLayers width={16} height={16} className="text-iq-400" />
              <h2 className="text-base font-bold text-ink-50">Alternatives</h2>
            </div>
            {alternatives.length === 0 ? (
              <EmptyState title="No alternatives catalogued" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-ink-500">
                      <th className="pb-2 pr-4 font-semibold">Option</th>
                      <th className="pb-2 pr-4 font-semibold">Quality</th>
                      <th className="pb-2 pr-4 font-semibold">Price</th>
                      <th className="pb-2 pr-4 font-semibold">Stock</th>
                      <th className="pb-2 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternatives.map((alt) => (
                      <tr key={alt.id} className="border-t border-ink-700">
                        <td className="py-2.5 pr-4 text-ink-100">{brandById(alt.brandId)?.name}</td>
                        <td className="py-2.5 pr-4"><QualityBadge tier={tierOf(alt)} /></td>
                        <td className="py-2.5 pr-4 font-bold text-ink-50">{aud(bestPrice(alt))}</td>
                        <td className="py-2.5 pr-4 text-ink-300">{totalStock(alt)}</td>
                        <td className="py-2.5">
                          <Link to={`/part/${alt.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-iq-400 hover:gap-2">
                            View <IconArrowRight width={13} height={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: fitment + specs */}
        <div className="space-y-6">
          <FitmentChecker part={part} />

          <Card className="p-5">
            <h2 className="mb-3 text-base font-bold text-ink-50">Specifications</h2>
            <dl className="space-y-2 text-sm">
              {Object.entries(part.specs).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ink-800 pb-2 last:border-0">
                  <dt className="text-ink-400">{k}</dt>
                  <dd className="text-right font-medium text-ink-100">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-base font-bold text-ink-50">Catalogued fitment</h2>
            <ul className="space-y-2 text-sm">
              {part.fitments.map((f) => {
                const v = vehicleById(f.vehicleId);
                return (
                  <li key={f.vehicleId} className="flex items-center justify-between gap-3">
                    <span className="text-ink-200">{v ? vehicleLabel(v) : f.vehicleId}</span>
                    <span className="flex items-center gap-2 text-xs text-ink-400">
                      {f.yearFrom}–{f.yearTo}
                      <ConfidenceMeter value={f.confidence} size="sm" />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      {rfqOpen && <RfqModal part={part} onClose={() => setRfqOpen(false)} />}
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`font-medium text-ink-100 ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</div>
    </div>
  );
}

function FitmentChecker({ part }: { part: Part }) {
  const [q, setQ] = useState<VehicleQuery>({});
  const modelOptions = useMemo(
    () => Array.from(new Set(vehicles.filter((v) => !q.make || v.make === q.make).map((v) => v.model))),
    [q.make],
  );
  const seriesOptions = useMemo(
    () =>
      Array.from(
        new Set(
          vehicles
            .filter((v) => (!q.make || v.make === q.make) && (!q.model || v.model === q.model) && v.series)
            .map((v) => v.series as string),
        ),
      ),
    [q.make, q.model],
  );
  const resolved = vehicles.find((v) => v.make === q.make && v.model === q.model && (!q.series || v.series === q.series));
  const yearOpts = useMemo(() => {
    if (!resolved) return [];
    const out: number[] = [];
    for (let y = resolved.yearTo; y >= resolved.yearFrom; y--) out.push(y);
    return out;
  }, [resolved]);

  const check = q.make && q.model ? checkFitment(part, q) : null;
  const style =
    check?.verdict === 'fits'
      ? { cls: 'border-signal-green/40 bg-signal-green/5 text-signal-green', Icon: IconCheck, label: 'Confirmed fitment' }
      : check?.verdict === 'possible'
        ? { cls: 'border-signal-amber/40 bg-signal-amber/5 text-signal-amber', Icon: IconWarn, label: 'Verify fitment' }
        : check?.verdict === 'no-fit'
          ? { cls: 'border-signal-red/40 bg-signal-red/5 text-signal-red', Icon: IconX, label: 'Does not fit' }
          : null;

  return (
    <Card className="p-5">
      <h2 className="mb-3 text-base font-bold text-ink-50">Check fitment</h2>
      <div className="space-y-2">
        <Sel label="Make" value={q.make ?? ''} onChange={(v) => setQ({ make: v || undefined })} options={makes} />
        <Sel label="Model" value={q.model ?? ''} onChange={(v) => setQ((s) => ({ ...s, model: v || undefined, series: undefined }))} options={modelOptions} disabled={!q.make} />
        {seriesOptions.length > 0 && (
          <Sel label="Series" value={q.series ?? ''} onChange={(v) => setQ((s) => ({ ...s, series: v || undefined }))} options={seriesOptions} />
        )}
        <Sel label="Year" value={q.year ? String(q.year) : ''} onChange={(v) => setQ((s) => ({ ...s, year: v ? Number(v) : undefined }))} options={yearOpts.map(String)} disabled={!resolved} />
        <Sel label="Engine" value={q.engine ?? ''} onChange={(v) => setQ((s) => ({ ...s, engine: v || undefined }))} options={resolved?.engines ?? []} disabled={!resolved} />
      </div>

      {check && style && (
        <div className={`mt-3 rounded-lg border p-3 ${style.cls}`}>
          <div className="flex items-center gap-2 text-sm font-bold">
            <style.Icon width={16} height={16} /> {style.label}
            <span className="ml-auto text-xs opacity-80">{pct(check.confidence)} confidence</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs opacity-90">
            {check.reasons.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </div>
      )}
      <Divider />
      <p className="text-xs text-ink-500">Compatibility is shown with confidence — never claimed blindly.</p>
    </Card>
  );
}

function Sel({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-ink-400">{label}</span>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="input py-2 disabled:opacity-40">
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

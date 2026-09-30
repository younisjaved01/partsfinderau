import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { panelVariants, tapScale } from '@/lib/motion';
import type { Part, VehicleQuery } from '@/types';
import type { PartsouqRef, PartsouqImage } from '@/services/integrations';
import { offersForPart } from '@/services/suppliers';
import { checkFitment } from '@/services/vehicleFitment';
import { partsouqMatchFor } from '@/services/partsouq';
import { partMeta } from '@/services/catalogue';
import { brandById } from '@/data/brands';
import { aud } from '@/lib/format';
import {
  IconImage,
  IconCheck,
  IconWarn,
  IconX,
  IconCart,
  IconTag,
  IconDoc,
  IconExternal,
  IconArrowRight,
  IconStore,
} from '@/components/icons';
import { QualityBadge } from '@/components/ui';

function tierOf(part: Part) {
  const t = part.specs.Tier ?? '';
  if (t.includes('OEM')) return 'oem' as const;
  if (t.includes('Premium')) return 'premium' as const;
  if (t.includes('Budget')) return 'budget' as const;
  return 'standard' as const;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-ink-800 px-4 py-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-right font-medium text-ink-100">{value}</span>
    </div>
  );
}

export function PartIntelligence({
  part,
  vehicle,
  onRequestQuote,
  onAddToCart,
  onClose,
}: {
  part: Part | null;
  vehicle: VehicleQuery | null;
  onRequestQuote: (part: Part) => void;
  onAddToCart: (part: Part) => void;
  onClose?: () => void;
}) {
  const [souq, setSouq] = useState<{ ref: PartsouqRef; image: PartsouqImage } | null>(null);
  const [souqLoading, setSouqLoading] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSouq(null);
    setAdded(false);
    if (!part) return;
    let cancelled = false;
    setSouqLoading(true);
    partsouqMatchFor(part)
      .then((m) => !cancelled && setSouq(m))
      .finally(() => !cancelled && setSouqLoading(false));
    return () => {
      cancelled = true;
    };
  }, [part]);

  if (!part) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <IconDoc width={30} height={30} className="mb-3 text-ink-700" />
        <div className="text-sm font-semibold text-ink-300">No part selected</div>
        <div className="mt-1 text-xs text-ink-500">Select a part from the results to see its full intelligence, fitment and availability.</div>
      </div>
    );
  }

  const meta = partMeta(part);
  const brand = brandById(part.brandId);
  const offers = offersForPart(part);
  const fit = checkFitment(part, vehicle ?? {});
  const fitStyle =
    fit.verdict === 'fits'
      ? { cls: 'border-signal-green/45 bg-signal-green/10 text-signal-green', Icon: IconCheck, label: 'Confirmed fitment' }
      : fit.verdict === 'possible'
        ? { cls: 'border-signal-amber/45 bg-signal-amber/10 text-signal-amber', Icon: IconWarn, label: 'Verify fitment' }
        : fit.verdict === 'no-fit'
          ? { cls: 'border-signal-red/45 bg-signal-red/10 text-signal-red', Icon: IconX, label: 'Not compatible' }
          : { cls: 'border-ink-600 bg-ink-800 text-ink-300', Icon: IconWarn, label: 'Select a vehicle' };

  const specEntries = Object.entries(part.specs).filter(([k]) => k !== 'Tier');

  return (
    <div className="flex h-full flex-col">
      {/* Keyed remount → new part content fades in without an exit gap, so the
          column height stays stable (no jump) while switching parts. */}
      <motion.div
        key={part.id}
        variants={panelVariants}
        initial="hidden"
        animate="show"
        className="flex min-h-0 flex-1 flex-col"
      >
      {/* Header */}
      <div className="relative border-b border-ink-800 p-4">
        {onClose && (
          <button onClick={onClose} className="absolute right-3 top-3 text-ink-500 hover:text-ink-200 lg:hidden">
            <IconX width={18} height={18} />
          </button>
        )}
        {/* Image state — clean "unavailable" handling */}
        <div className="mb-3 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-lg border border-ink-700 bg-ink-900">
          <div className="flex flex-col items-center gap-1 text-ink-600">
            <IconImage width={30} height={30} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Image unavailable</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <QualityBadge tier={tierOf(part)} />
          <span className="text-[11px] text-ink-500">{meta.category} → {meta.subGroup}</span>
        </div>
        <h2 className="mt-1.5 font-display text-lg font-bold uppercase leading-tight tracking-wide text-ink-50">
          {part.name.split(' — ')[0]}
        </h2>
        <div className="mt-1 font-mono text-sm text-iq-300">{part.partNumber}</div>
        <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${fitStyle.cls}`}>
          <fitStyle.Icon width={15} height={15} />
          {fitStyle.label}
          <span className="ml-auto text-xs font-semibold opacity-80">{Math.round(fit.confidence * 100)}%</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Overview">
          <p className="mb-2 text-sm text-ink-300">{part.description}</p>
          <Row label="Category" value={meta.category} />
          <Row label="Sub-group" value={meta.subGroup} />
          <Row label="Brand" value={brand?.name} />
          <Row label="Position" value={part.position === 'n/a' ? '—' : part.position} />
          <Row label="Side" value={part.side === 'n/a' ? '—' : part.side} />
          <Row label="Fits years" value={`${part.yearFrom}–${part.yearTo}`} />
        </Section>

        {fit.reasons.length > 0 && (
          <Section title="Fitment reasoning">
            <ul className="space-y-1">
              {fit.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-ink-300">
                  <span className="text-iq-500">›</span>
                  {r}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {specEntries.length > 0 && (
          <Section title="Specifications">
            {specEntries.map(([k, v]) => (
              <Row key={k} label={k} value={v} />
            ))}
          </Section>
        )}

        <Section title="Cross references">
          <Row label={brand?.name ?? 'OEM'} value={<span className="font-mono">{part.oemNumber}</span>} />
          {part.crossReferences.map((c) => (
            <Row key={c.partNumber} label={brandById(c.brandId)?.name ?? c.brandId} value={<span className="font-mono">{c.partNumber}</span>} />
          ))}
        </Section>

        <Section title="Availability">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs text-ink-400">List price</span>
            <span className="stat-num text-lg font-extrabold text-ink-50">{aud(part.price)}</span>
          </div>
          <div className="space-y-1.5">
            {offers.map((o, i) => (
              <div key={o.supplier.id} className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${i === 0 ? 'border-iq-500/40 bg-iq-500/5' : 'border-ink-700 bg-ink-900'}`}>
                <span className="grid h-6 w-6 place-items-center rounded text-[10px] font-bold text-ink-950" style={{ background: o.supplier.logoColor }}>
                  {o.supplier.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink-100">{o.supplier.name}</span>
                  <span className="block truncate text-[10px] text-ink-500">{o.record.warehouse} · {o.record.leadTime}</span>
                </span>
                <span className="text-right">
                  <span className="block stat-num text-sm font-bold text-ink-50">{aud(o.record.price)}</span>
                  <span className={`block text-[10px] ${o.record.stock === 0 ? 'text-signal-red' : o.record.stock <= 5 ? 'text-signal-amber' : 'text-signal-green'}`}>
                    {o.record.stock === 0 ? 'Backorder' : `${o.record.stock} in stock`}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Partsouq external catalogue (mock) */}
        <Section title="Partsouq match">
          {souqLoading ? (
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <span className="h-3 w-3 rounded-full border-2 border-ink-600 border-t-iq-400 animate-spin" /> Querying external catalogue…
            </div>
          ) : souq ? (
            <div className="rounded-lg border border-ink-700 bg-ink-900 p-3">
              <div className="flex items-center gap-2">
                <IconExternal width={13} height={13} className="text-iq-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Source: {souq.ref.source}</span>
                <span className="pill ml-auto border-ink-600 text-[10px] text-ink-400">Mock</span>
              </div>
              <div className="mt-2 flex gap-3">
                <div className="flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-md border border-ink-700 bg-ink-850 text-ink-600">
                  <IconImage width={20} height={20} />
                  <span className="mt-0.5 text-[8px] uppercase tracking-wide">No image</span>
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-xs text-iq-300">{souq.ref.partNumber}</div>
                  <div className="truncate text-xs text-ink-200">{souq.ref.description}</div>
                  <div className="mt-1 text-[10px] text-ink-500">Fits: {souq.ref.vehicleCompatibility.join(', ') || '—'}</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-ink-600">{souq.image.note}</div>
            </div>
          ) : (
            <div className="text-xs text-ink-500">No external catalogue match in demo data.</div>
          )}
        </Section>
      </div>
      </motion.div>

      {/* Actions */}
      <div className="border-t border-ink-800 p-3">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={tapScale}
            onClick={() => {
              onAddToCart(part);
              setAdded(true);
            }}
            className={`col-span-2 font-display uppercase tracking-wide transition-colors ${added ? 'btn bg-signal-green/15 text-signal-green ring-1 ring-inset ring-signal-green/40' : 'btn-primary'}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="inline-flex items-center gap-2"
                >
                  <IconCheck width={16} height={16} /> Added to cart
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="inline-flex items-center gap-2"
                >
                  <IconCart width={16} height={16} /> Add to Cart
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button whileTap={tapScale} onClick={() => onAddToCart(part)} className="btn-ghost text-xs">
            <IconTag width={14} height={14} /> Add to Quote
          </motion.button>
          <motion.button whileTap={tapScale} onClick={() => onRequestQuote(part)} className="btn-ghost text-xs">
            <IconStore width={14} height={14} /> Supplier Quote
          </motion.button>
        </div>
        <Link to={`/part/${part.id}`} className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-iq-400 hover:gap-2">
          Open full part page <IconArrowRight width={13} height={13} />
        </Link>
      </div>
    </div>
  );
}

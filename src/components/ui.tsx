import type { ReactNode } from 'react';
import type { Part, QualityTier } from '@/types';
import { CategoryIcon, IconCheck, IconWarn, IconBolt } from './icons';
import { pct } from '@/lib/format';
import { totalStock, LOW_STOCK } from '@/services/inventory';
import { fitmentFromScore, availableToday } from '@/lib/fitment';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="mb-3">
      {kicker && <div className="kicker">{kicker}</div>}
      <h2 className="text-lg font-bold text-ink-50">{children}</h2>
    </div>
  );
}

/** Confidence ring/meter — always shown near a match. */
export function ConfidenceMeter({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const p = Math.max(0, Math.min(1, value));
  const color = p >= 0.85 ? '#5fae74' : p >= 0.6 ? '#e0a92e' : '#d9683f';
  const dims = size === 'lg' ? 72 : size === 'sm' ? 40 : 56;
  const stroke = size === 'lg' ? 6 : size === 'sm' ? 4 : 5;
  const r = (dims - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dims, height: dims }}>
      <svg width={dims} height={dims} className="-rotate-90">
        <circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke="#2b2823" strokeWidth={stroke} />
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span
        className={`stat-num absolute font-bold text-ink-50 ${size === 'lg' ? 'text-base' : size === 'sm' ? 'text-[10px]' : 'text-xs'}`}
      >
        {pct(p)}
      </span>
    </div>
  );
}

export function QualityBadge({ tier }: { tier: QualityTier }) {
  const map: Record<QualityTier, { label: string; cls: string }> = {
    oem: { label: 'OEM', cls: 'border-signal-blue/45 text-signal-blue bg-signal-blue/10' },
    premium: { label: 'Premium', cls: 'border-iq-500/45 text-iq-300 bg-iq-500/10' },
    standard: { label: 'Standard', cls: 'border-ink-500/60 text-ink-200 bg-ink-700/50' },
    budget: { label: 'Budget', cls: 'border-field-400/50 text-field-300 bg-field-500/10' },
  };
  const { label, cls } = map[tier];
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>{label}</span>;
}

/**
 * Fitment verdict badge — one of the strongest visual elements. Derived from
 * the engine's confidence score; conservative by design.
 */
export function FitmentBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const f = fitmentFromScore(score);
  const Icon = f.level === 'verify' ? IconWarn : IconCheck;
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-bold uppercase tracking-wide ${pad} ${f.cls}`}>
      <Icon width={size === 'sm' ? 11 : 13} height={size === 'sm' ? 11 : 13} />
      {f.label}
    </span>
  );
}

/** Stock / availability — "Available today" is promoted when a supplier can dispatch same-day. */
export function StockBadge({ part }: { part: Part }) {
  const units = totalStock(part);
  if (units === 0)
    return <span className="pill border-signal-red/45 bg-signal-red/10 text-signal-red">Out of stock</span>;
  if (availableToday(part))
    return (
      <span className="pill border-signal-green/45 bg-signal-green/10 text-signal-green">
        <IconBolt width={12} height={12} /> Available today
      </span>
    );
  if (units <= LOW_STOCK)
    return <span className="pill border-signal-amber/45 bg-signal-amber/10 text-signal-amber">Low stock · {units}</span>;
  return <span className="pill border-signal-green/45 bg-signal-green/10 text-signal-green">In stock · {units}</span>;
}

/** Category thumbnail tile used where a real part photo would go. */
export function PartThumb({ part, size = 'md' }: { part: Part; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-24 w-24' : size === 'sm' ? 'h-11 w-11' : 'h-16 w-16';
  const icon = size === 'lg' ? 44 : size === 'sm' ? 22 : 30;
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-700 bg-gradient-to-br from-ink-800 to-ink-900 ${dims}`}
    >
      <div className="absolute inset-0 bg-tread opacity-40" />
      <CategoryIcon category={part.category} width={icon} height={icon} className="relative text-iq-400" />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={`p-4 ${accent ? 'ring-1 ring-iq-500/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">{label}</div>
        {icon && <div className={accent ? 'text-iq-400' : 'text-ink-500'}>{icon}</div>}
      </div>
      <div className="stat-num mt-2 text-3xl font-extrabold leading-none text-ink-50">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-ink-400">{hint}</div>}
    </Card>
  );
}

export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-700 bg-ink-900/40 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink-600">{icon}</div>}
      <div className="text-sm font-semibold text-ink-200">{title}</div>
      {subtitle && <div className="mt-1 max-w-sm text-xs text-ink-400">{subtitle}</div>}
    </div>
  );
}

export function Divider() {
  return <div className="my-4 h-px w-full bg-ink-700/70" />;
}

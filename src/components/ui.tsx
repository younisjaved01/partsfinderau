import type { ReactNode } from 'react';
import type { Part, QualityTier } from '@/types';
import { CategoryIcon } from './icons';
import { pct } from '@/lib/format';
import { totalStock } from '@/services/inventory';
import { LOW_STOCK } from '@/services/inventory';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="mb-3">
      {kicker && <div className="text-[11px] font-semibold uppercase tracking-widest text-iq-500">{kicker}</div>}
      <h2 className="text-lg font-bold text-ink-50">{children}</h2>
    </div>
  );
}

/** Confidence ring/meter — always shown near a match (§5, §8). */
export function ConfidenceMeter({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const p = Math.max(0, Math.min(1, value));
  const color = p >= 0.85 ? '#34d399' : p >= 0.65 ? '#fbbf24' : '#f87171';
  const dims = size === 'lg' ? 72 : size === 'sm' ? 40 : 56;
  const stroke = size === 'lg' ? 6 : size === 'sm' ? 4 : 5;
  const r = (dims - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dims, height: dims }}>
      <svg width={dims} height={dims} className="-rotate-90">
        <circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke="#252b34" strokeWidth={stroke} />
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
        className={`absolute font-bold text-ink-50 ${size === 'lg' ? 'text-base' : size === 'sm' ? 'text-[10px]' : 'text-xs'}`}
      >
        {pct(p)}
      </span>
    </div>
  );
}

export function QualityBadge({ tier }: { tier: QualityTier }) {
  const map: Record<QualityTier, { label: string; cls: string }> = {
    oem: { label: 'OEM', cls: 'border-signal-blue/40 text-signal-blue bg-signal-blue/10' },
    premium: { label: 'Premium', cls: 'border-iq-500/40 text-iq-400 bg-iq-500/10' },
    standard: { label: 'Standard', cls: 'border-ink-500/50 text-ink-200 bg-ink-700/50' },
    budget: { label: 'Budget', cls: 'border-signal-green/40 text-signal-green bg-signal-green/10' },
  };
  const { label, cls } = map[tier];
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>;
}

export function StockBadge({ part }: { part: Part }) {
  const units = totalStock(part);
  if (units === 0)
    return <span className="pill border-signal-red/40 bg-signal-red/10 text-signal-red">Out of stock</span>;
  if (units <= LOW_STOCK)
    return <span className="pill border-signal-amber/40 bg-signal-amber/10 text-signal-amber">Low · {units}</span>;
  return <span className="pill border-signal-green/40 bg-signal-green/10 text-signal-green">In stock · {units}</span>;
}

/** Category thumbnail tile used where a real part photo would go. */
export function PartThumb({ part, size = 'md' }: { part: Part; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-24 w-24' : size === 'sm' ? 'h-11 w-11' : 'h-16 w-16';
  const icon = size === 'lg' ? 44 : size === 'sm' ? 22 : 30;
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-700 bg-gradient-to-br from-ink-800 to-ink-900 ${dims}`}
    >
      <div className="absolute inset-0 opacity-[0.15] bg-grid-faint [background-size:10px_10px]" />
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
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</div>
        {icon && <div className={accent ? 'text-iq-400' : 'text-ink-500'}>{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-ink-50">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
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

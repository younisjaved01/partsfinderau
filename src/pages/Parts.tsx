import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { filterInventory } from '@/services/inventory';
import { PartCard } from '@/components/PartCard';
import { RfqModal } from '@/components/RfqModal';
import { EmptyState } from '@/components/ui';
import { IconSearch, IconGrid } from '@/components/icons';
import type { Part, PartCategory } from '@/types';
import { brands } from '@/data/brands';

const categories: (PartCategory | 'all')[] = [
  'all', 'Brake', 'Suspension', 'Steering', 'Engine', 'Cooling', 'Electrical',
  'Filters', 'Clutch', 'Transmission', 'Driveline', 'Bearings', 'Body', 'Exhaust',
];

export function Parts() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [brandId, setBrandId] = useState<string>('all');
  const [rfqPart, setRfqPart] = useState<Part | null>(null);
  const category = (params.get('category') as PartCategory | null) ?? 'all';

  const results = useMemo(
    () => filterInventory({ query, category, brandId: brandId as string }).slice(0, 60),
    [query, category, brandId],
  );

  const setCategory = (c: PartCategory | 'all') => {
    const next = new URLSearchParams(params);
    if (c === 'all') next.delete('category');
    else next.set('category', c);
    setParams(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
          <IconGrid width={14} height={14} /> Catalogue
        </div>
        <h1 className="text-2xl font-extrabold text-ink-50">Browse parts</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, part number, brand, alias…"
            className="input pl-9"
          />
        </div>
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="input sm:w-56">
          <option value="all">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              category === c
                ? 'border-iq-500/50 bg-iq-500/10 text-iq-300'
                : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600'
            }`}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      <div className="text-xs text-ink-400">{results.length} parts</div>

      {results.length === 0 ? (
        <EmptyState title="No parts match" subtitle="Try a different category or search term." icon={<IconSearch width={26} height={26} />} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((p) => (
            <PartCard key={p.id} part={p} onRequestQuote={setRfqPart} />
          ))}
        </div>
      )}

      {rfqPart && <RfqModal part={rfqPart} onClose={() => setRfqPart(null)} />}
    </div>
  );
}

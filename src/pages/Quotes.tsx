import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/AppStore';
import { partById } from '@/data/parts';
import { bestPrice } from '@/services/inventory';
import { listSuppliers } from '@/services/suppliers';
import { Card, PartThumb, StockBadge, EmptyState } from '@/components/ui';
import { IconTag, IconX, IconArrowRight, IconSearch } from '@/components/icons';
import { aud } from '@/lib/format';
import type { Part } from '@/types';

export function Quotes() {
  const navigate = useNavigate();
  const { state, setQuoteQty, removeFromQuote, clearQuote, sendRfq } = useAppStore();

  const lines = state.quote
    .map((l) => ({ line: l, part: partById(l.partId) }))
    .filter((x): x is { line: typeof x.line; part: Part } => Boolean(x.part));

  const subtotal = lines.reduce((sum, { line, part }) => sum + bestPrice(part) * line.quantity, 0);

  const sendAll = () => {
    const supplierIds = listSuppliers().slice(0, 3).map((s) => s.id);
    lines.forEach(({ line, part }) => sendRfq(part, line.quantity, 'Standard', supplierIds));
    clearQuote();
    navigate('/rfqs');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
            <IconTag width={14} height={14} /> Quote basket
          </div>
          <h1 className="text-2xl font-extrabold text-ink-50">Quote &amp; order</h1>
        </div>
        {lines.length > 0 && (
          <button onClick={clearQuote} className="text-xs text-ink-500 hover:text-signal-red">Clear all</button>
        )}
      </div>

      {lines.length === 0 ? (
        <EmptyState
          title="Your quote basket is empty"
          subtitle="Add parts from search results or a part page, then request quotes from suppliers in one click."
          icon={<IconTag width={28} height={28} />}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {lines.map(({ line, part }) => (
              <Card key={part.id} className="flex items-center gap-3 p-3">
                <PartThumb part={part} size="sm" />
                <div className="min-w-0 flex-1">
                  <button onClick={() => navigate(`/part/${part.id}`)} className="block truncate text-sm font-semibold text-ink-50 hover:text-iq-300">
                    {part.name.split(' — ')[0]}
                  </button>
                  <div className="truncate text-xs text-ink-400">{part.name.split(' — ')[1]}</div>
                  <div className="mt-1"><StockBadge part={part} /></div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQuoteQty(part.id, line.quantity - 1)} className="btn-subtle h-8 w-8 p-0 text-base">−</button>
                  <span className="w-8 text-center text-sm font-semibold text-ink-50">{line.quantity}</span>
                  <button onClick={() => setQuoteQty(part.id, line.quantity + 1)} className="btn-subtle h-8 w-8 p-0 text-base">+</button>
                </div>
                <div className="w-20 text-right text-sm font-bold text-ink-50">{aud(bestPrice(part) * line.quantity)}</div>
                <button onClick={() => removeFromQuote(part.id)} className="text-ink-500 hover:text-signal-red">
                  <IconX width={16} height={16} />
                </button>
              </Card>
            ))}
          </div>

          <Card className="h-fit p-5">
            <h2 className="text-base font-bold text-ink-50">Summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Line items" value={String(lines.length)} />
              <Row label="Total units" value={String(lines.reduce((n, l) => n + l.line.quantity, 0))} />
              <div className="my-2 h-px bg-ink-700" />
              <Row label="Est. subtotal" value={aud(subtotal)} strong />
            </div>
            <button onClick={sendAll} className="btn-primary mt-4 w-full">
              Request quotes <IconArrowRight width={15} height={15} />
            </button>
            <button onClick={() => navigate('/')} className="btn-ghost mt-2 w-full">
              <IconSearch width={15} height={15} /> Find more parts
            </button>
            <p className="mt-3 text-xs text-ink-500">
              Sends an RFQ per line to your top suppliers. Live responses appear on the RFQs dashboard.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-400">{label}</span>
      <span className={strong ? 'text-lg font-extrabold text-ink-50' : 'font-medium text-ink-100'}>{value}</span>
    </div>
  );
}

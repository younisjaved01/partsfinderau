import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customers, type CustomerType } from '@/data/customers';
import { Card } from '@/components/ui';
import { IconUser, IconSearch, IconArrowRight } from '@/components/icons';

const typeStyle: Record<CustomerType, string> = {
  workshop: 'border-iq-500/40 bg-iq-500/10 text-iq-300',
  fleet: 'border-signal-blue/40 bg-signal-blue/10 text-signal-blue',
  retail: 'border-ink-500/50 bg-ink-700/50 text-ink-200',
  dealer: 'border-field-400/50 bg-field-500/10 text-field-300',
};

/** CUSTOMERS — legacy customer/backorder accounts, presented as trade accounts. */
export function Customers() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return customers.filter((c) => !s || `${c.name} ${c.location} ${c.type}`.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 kicker"><IconUser width={14} height={14} /> Customers</div>
        <h1 className="text-2xl font-extrabold text-ink-50">Trade accounts</h1>
      </div>

      <div className="relative max-w-md">
        <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers…" className="input pl-9" />
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-900 text-[10px] uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Account</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Type</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Location</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Terms</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.id} className="border-t border-ink-800 hover:bg-ink-900/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink-50">{c.name}</div>
                  <div className="text-[11px] text-ink-500">{c.contact}</div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${typeStyle[c.type]}`}>{c.type}</span>
                </td>
                <td className="hidden px-4 py-3 text-ink-300 md:table-cell">{c.location}</td>
                <td className="hidden px-4 py-3 text-ink-300 md:table-cell">{c.terms}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => navigate('/catalogue')} className="inline-flex items-center gap-1 text-xs font-semibold text-iq-400 hover:gap-2">
                    New quote <IconArrowRight width={13} height={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-ink-500">Trade accounts are illustrative mock data for the prototype, mapped from the legacy customer/backorder functions.</p>
    </div>
  );
}

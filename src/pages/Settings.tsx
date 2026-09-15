import { integrationStatus, isDemoMode } from '@/services/integrations';
import { Card, SectionTitle } from '@/components/ui';
import { IconSettings, IconSpark, IconCheck, IconX } from '@/components/icons';
import { catalogueSize } from '@/data/parts';

const labels: Record<string, { name: string; desc: string }> = {
  llm: { name: 'LLM reasoning', desc: 'OpenAI / Claude / Gemini — natural-language interpretation' },
  vision: { name: 'Vision model', desc: 'Part photo recognition (shape, markings, category)' },
  voice: { name: 'Voice transcription', desc: 'Speech-to-text for spoken part descriptions' },
  embeddings: { name: 'Vector search', desc: 'Embedding similarity over the catalogue' },
  catalogue: { name: 'Catalogue / TecDoc', desc: 'External fitment & OEM cross-reference data' },
  inventory: { name: 'Inventory / ERP', desc: 'Live stock and pricing from supplier systems' },
  supplierApi: { name: 'Supplier APIs', desc: 'Automated RFQ submission & responses' },
  vin: { name: 'VIN / rego lookup', desc: 'Decode registration or VIN to vehicle spec' },
};

const dataModel = ['parts', 'vehicles', 'fitments', 'brands', 'suppliers', 'inventory', 'cross_references', 'rfqs', 'quotes', 'orders', 'search_history', 'users'];

export function Settings() {
  const status = integrationStatus();
  const demo = isDemoMode();

  const resetData = () => {
    if (!confirm('Reset all demo data (quotes, RFQs, orders, history)?')) return;
    try {
      localStorage.removeItem('parts-iq-state-v1');
    } catch {
      /* ignore */
    }
    location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-iq-500">
          <IconSettings width={14} height={14} /> Settings
        </div>
        <h1 className="text-2xl font-extrabold text-ink-50">Platform &amp; integrations</h1>
      </div>

      {demo && (
        <Card className="flex items-start gap-3 p-5 ring-1 ring-iq-500/30">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-iq-500/10 text-iq-400">
            <IconSpark width={20} height={20} />
          </span>
          <div>
            <div className="text-sm font-bold text-ink-50">Demo mode is active</div>
            <p className="mt-1 text-sm text-ink-300">
              The Parts Intelligence Engine runs entirely on local mock logic against {catalogueSize} sample parts —
              no external APIs are connected. Every integration below has a clean provider interface ready to bind a
              real service without changing the UI.
            </p>
          </div>
        </Card>
      )}

      <div>
        <SectionTitle kicker="Future integrations">Provider connections</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {status.map((s) => {
            const meta = labels[s.key];
            return (
              <Card key={s.key} className="flex items-center gap-3 p-4">
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.connected ? 'bg-signal-green/10 text-signal-green' : 'bg-ink-800 text-ink-500'}`}>
                  {s.connected ? <IconCheck width={18} height={18} /> : <IconX width={18} height={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink-50">{meta.name}</div>
                  <div className="text-xs text-ink-400">{meta.desc}</div>
                </div>
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${s.connected ? 'border-signal-green/40 text-signal-green' : 'border-ink-600 text-ink-400'}`}>
                  {s.connected ? 'Connected' : 'Mock'}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle kicker="Architecture">Data model</SectionTitle>
        <Card className="p-5">
          <p className="text-sm text-ink-300">
            The prototype is structured around these entities, ready to migrate from mock JSON to PostgreSQL / Supabase.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {dataModel.map((t) => (
              <span key={t} className="pill font-mono">{t}</span>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle kicker="Danger zone">Demo data</SectionTitle>
        <Card className="flex items-center justify-between gap-4 p-5">
          <div>
            <div className="text-sm font-bold text-ink-50">Reset demo data</div>
            <div className="text-xs text-ink-400">Clears quotes, RFQs, orders and search history saved in this browser.</div>
          </div>
          <button onClick={resetData} className="btn-ghost border-signal-red/40 text-signal-red hover:bg-signal-red/10">
            Reset
          </button>
        </Card>
      </div>
    </div>
  );
}

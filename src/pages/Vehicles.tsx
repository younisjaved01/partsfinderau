import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicles, vehicleLabel, makes } from '@/data/vehicles';
import { Card } from '@/components/ui';
import { IconCar, IconArrowRight, IconSearch } from '@/components/icons';
import type { Vehicle } from '@/types';

const fuelOf = (engines: string[]): string => {
  const diesel = engines.some((e) => /diesel/i.test(e));
  const petrol = engines.some((e) => /petrol/i.test(e));
  if (diesel && petrol) return 'Diesel / Petrol';
  if (diesel) return 'Diesel';
  if (petrol) return 'Petrol';
  return '—';
};

export function Vehicles() {
  const navigate = useNavigate();
  const [make, setMake] = useState<string>('all');

  const shown = useMemo(
    () => (make === 'all' ? vehicles : vehicles.filter((v) => v.make === make)),
    [make],
  );

  const findParts = (v: Vehicle) =>
    navigate('/', {
      state: { vehicle: { make: v.make, model: v.model, series: v.series } },
    });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 kicker">
          <IconCar width={14} height={14} /> Vehicles
        </div>
        <h1 className="text-2xl font-extrabold text-ink-50">Select a vehicle</h1>
        <p className="mt-1 text-sm text-ink-400">Start from the rig — lock the vehicle, then find the part and its fitment.</p>
      </div>

      {/* Make filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setMake('all')}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            make === 'all' ? 'border-iq-500/50 bg-iq-500/10 text-iq-300' : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600'
          }`}
        >
          All makes
        </button>
        {makes.map((m) => (
          <button
            key={m}
            onClick={() => setMake(m)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              make === m ? 'border-iq-500/50 bg-iq-500/10 text-iq-300' : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((v) => (
          <Card key={v.id} className="card-hover group flex flex-col overflow-hidden p-0">
            <div className="relative flex items-center gap-3 border-b border-ink-800 bg-ink-900/60 p-4">
              <div className="absolute inset-0 bg-tread opacity-30" />
              <div className="relative grid h-11 w-11 place-items-center rounded-lg border border-ink-700 bg-ink-850 text-iq-400">
                <IconCar width={24} height={24} />
              </div>
              <div className="relative min-w-0">
                <div className="truncate font-display text-lg font-bold uppercase leading-tight tracking-wide text-ink-50">
                  {v.model}{v.series ? ` ${v.series}` : ''}
                </div>
                <div className="text-xs font-medium uppercase tracking-wide text-ink-400">{v.make}</div>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Spec label="Years" value={`${v.yearFrom}–${v.yearTo}`} />
                <Spec label="Fuel" value={fuelOf(v.engines)} />
                <Spec label="Engines" value={String(v.engines.length)} />
                <Spec label="Trans" value={v.transmissions.join(', ')} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.engines.slice(0, 3).map((e) => (
                  <span key={e} className="pill text-[10px]">{e}</span>
                ))}
              </div>
              <button
                onClick={() => findParts(v)}
                className="btn-primary mt-4 w-full font-display text-sm uppercase tracking-wide"
              >
                <IconSearch width={15} height={15} /> Find parts for {v.model}
                <IconArrowRight width={15} height={15} className="ml-auto opacity-80 transition-transform group-hover:translate-x-0.5" />
              </button>
              <div className="mt-1.5 text-center text-[11px] text-ink-500" title={vehicleLabel(v)}>
                Also known as: {v.aliases.slice(0, 3).join(', ')}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="stat-num font-semibold text-ink-100">{value}</dd>
    </div>
  );
}

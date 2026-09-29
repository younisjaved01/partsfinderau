import type { RegistrationProvider, RegoResult } from './integrations';
import { integrations } from './integrations';
import { vehicles, vehicleLabel } from '@/data/vehicles';

/**
 * REGISTRATION (REGO) LOOKUP — mock provider.
 *
 * Resolves an Australian-style rego to a vehicle. This is intentionally MOCK:
 * no real registration API is contacted, no keys, no network. A real provider
 * can be bound to `integrations.registration` later and this mock becomes the
 * fallback — callers use {@link lookupRego} and never change.
 */

// A few demo plates that map onto vehicles in our catalogue.
const DEMO_PLATES: Record<string, string> = {
  ABC123: 'veh-lc70', // Toyota LandCruiser 79 Series
  '4WD79Y': 'veh-lc70',
  HILUX1: 'veh-hilux',
  GUN126: 'veh-hilux',
  PRADO8: 'veh-prado',
  PTRL62: 'veh-patrol-y62',
  RANGA1: 'veh-ranger',
  LC200X: 'veh-lc200',
};

class MockRegistrationProvider implements RegistrationProvider {
  name = 'MockRego (demo)';

  async lookup(rego: string, state?: string): Promise<RegoResult | null> {
    const key = rego.trim().toUpperCase().replace(/\s+/g, '');
    // Simulate a little network latency.
    await new Promise((r) => setTimeout(r, 450));
    const vehId = DEMO_PLATES[key];
    const veh = vehicles.find((v) => v.id === vehId);
    if (!veh) return null;
    // Pick a plausible year/engine for the demo.
    const year = Math.min(veh.yearTo, Math.max(veh.yearFrom, 2016));
    const engine = veh.engines[0];
    return {
      rego: key,
      state,
      matchedVehicleId: veh.id,
      vehicle: { make: veh.make, model: veh.model, series: veh.series, year, engine },
      label: `${vehicleLabel(veh)} · ${engine} · ${year}`,
    };
  }
}

const mock = new MockRegistrationProvider();

/** Registered plates a demo user can try. */
export const demoPlates = Object.keys(DEMO_PLATES);

/** Uses a real provider when one is bound, else the mock. */
export const lookupRego = (rego: string, state?: string): Promise<RegoResult | null> =>
  (integrations.registration ?? mock).lookup(rego, state);

export const registrationProviderName = () => (integrations.registration ?? mock).name;

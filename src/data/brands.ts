import type { Brand } from '@/types';

/**
 * Fictional brands. Real catalogues map to TecDoc / manufacturer data; these
 * are clearly invented so the prototype can be demonstrated safely.
 */
export const brands: Brand[] = [
  { id: 'br-oem-toy', name: 'Toyota Genuine (mock)', tier: 'oem', country: 'Japan' },
  { id: 'br-oem-nis', name: 'Nissan Genuine (mock)', tier: 'oem', country: 'Japan' },
  { id: 'br-oem-frd', name: 'Ford Genuine (mock)', tier: 'oem', country: 'USA' },
  { id: 'br-oem-mit', name: 'Mitsubishi Genuine (mock)', tier: 'oem', country: 'Japan' },
  { id: 'br-oem-isu', name: 'Isuzu Genuine (mock)', tier: 'oem', country: 'Japan' },
  { id: 'br-apex', name: 'ApexLine', tier: 'premium', country: 'Germany' },
  { id: 'br-torqx', name: 'TorqX', tier: 'premium', country: 'Australia' },
  { id: 'br-ironhide', name: 'Ironhide 4x4', tier: 'premium', country: 'Australia' },
  { id: 'br-driveright', name: 'DriveRight', tier: 'standard', country: 'Taiwan' },
  { id: 'br-nucore', name: 'NuCore', tier: 'standard', country: 'South Korea' },
  { id: 'br-valuemax', name: 'ValueMax', tier: 'budget', country: 'China' },
  { id: 'br-tradepro', name: 'TradePro', tier: 'budget', country: 'China' },
];

export const brandById = (id: string): Brand | undefined => brands.find((b) => b.id === id);

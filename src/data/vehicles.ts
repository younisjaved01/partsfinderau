import type { Vehicle } from '@/types';

/**
 * Supported vehicles (§16). Aliases capture the informal ways users refer to
 * them — "79", "80 series", "landy", "cruiser" — which the intelligence engine
 * matches against.
 */
export const vehicles: Vehicle[] = [
  {
    id: 'veh-hilux',
    make: 'Toyota',
    model: 'Hilux',
    yearFrom: 2015,
    yearTo: 2024,
    engines: ['2.4L Diesel', '2.8L Diesel', '4.0L Petrol'],
    transmissions: ['Manual', 'Automatic'],
    aliases: ['hilux', 'lux', 'hi lux', 'toyota ute'],
  },
  {
    id: 'veh-lc70',
    make: 'Toyota',
    model: 'LandCruiser',
    series: '70 Series',
    yearFrom: 2007,
    yearTo: 2024,
    engines: ['4.5L Diesel V8'],
    transmissions: ['Manual'],
    aliases: ['70 series', '76', '78', '79', '79 series', 'lc70', 'landcruiser 70', 'seventy series', 'workmate'],
  },
  {
    id: 'veh-lc80',
    make: 'Toyota',
    model: 'LandCruiser',
    series: '80 Series',
    yearFrom: 1990,
    yearTo: 1998,
    engines: ['4.5L Petrol', '4.2L Diesel'],
    transmissions: ['Manual', 'Automatic'],
    aliases: ['80 series', '80', 'lc80', 'landcruiser 80', 'eighty series'],
  },
  {
    id: 'veh-lc100',
    make: 'Toyota',
    model: 'LandCruiser',
    series: '100 Series',
    yearFrom: 1998,
    yearTo: 2007,
    engines: ['4.7L Petrol V8', '4.2L Diesel'],
    transmissions: ['Manual', 'Automatic'],
    aliases: ['100 series', '100', 'lc100', 'landcruiser 100'],
  },
  {
    id: 'veh-lc200',
    make: 'Toyota',
    model: 'LandCruiser',
    series: '200 Series',
    yearFrom: 2007,
    yearTo: 2021,
    engines: ['4.5L Diesel V8', '4.6L Petrol V8'],
    transmissions: ['Automatic'],
    aliases: ['200 series', '200', 'lc200', 'landcruiser 200'],
  },
  {
    id: 'veh-lc300',
    make: 'Toyota',
    model: 'LandCruiser',
    series: '300 Series',
    yearFrom: 2021,
    yearTo: 2024,
    engines: ['3.3L Diesel V6', '3.5L Petrol V6'],
    transmissions: ['Automatic'],
    aliases: ['300 series', '300', 'lc300', 'landcruiser 300'],
  },
  {
    id: 'veh-prado',
    make: 'Toyota',
    model: 'Prado',
    yearFrom: 2009,
    yearTo: 2024,
    engines: ['2.8L Diesel', '4.0L Petrol'],
    transmissions: ['Manual', 'Automatic'],
    aliases: ['prado', '150 series', '150', 'landcruiser prado'],
  },
  {
    id: 'veh-patrol-y61',
    make: 'Nissan',
    model: 'Patrol',
    series: 'Y61 (GU)',
    yearFrom: 1997,
    yearTo: 2016,
    engines: ['4.2L Diesel', '3.0L Diesel', '4.8L Petrol'],
    transmissions: ['Manual', 'Automatic'],
    aliases: ['patrol', 'y61', 'gu', 'gu patrol', 'nissan patrol'],
  },
  {
    id: 'veh-patrol-y62',
    make: 'Nissan',
    model: 'Patrol',
    series: 'Y62',
    yearFrom: 2012,
    yearTo: 2024,
    engines: ['5.6L Petrol V8'],
    transmissions: ['Automatic'],
    aliases: ['patrol', 'y62', 'y62 patrol'],
  },
  {
    id: 'veh-ranger',
    make: 'Ford',
    model: 'Ranger',
    yearFrom: 2011,
    yearTo: 2024,
    engines: ['3.2L Diesel', '2.0L Bi-Turbo Diesel', '2.3L Petrol'],
    transmissions: ['Manual', 'Automatic'],
    aliases: ['ranger', 'ford ute', 'px', 'px ranger', 'next-gen ranger'],
  },
  {
    id: 'veh-triton',
    make: 'Mitsubishi',
    model: 'Triton',
    yearFrom: 2015,
    yearTo: 2024,
    engines: ['2.4L Diesel'],
    transmissions: ['Manual', 'Automatic'],
    aliases: ['triton', 'mq', 'mr', 'mitsi ute'],
  },
  {
    id: 'veh-dmax',
    make: 'Isuzu',
    model: 'D-Max',
    yearFrom: 2012,
    yearTo: 2024,
    engines: ['3.0L Diesel'],
    transmissions: ['Manual', 'Automatic'],
    aliases: ['d-max', 'dmax', 'd max', 'isuzu ute'],
  },
];

export const vehicleById = (id: string): Vehicle | undefined =>
  vehicles.find((v) => v.id === id);

export const vehicleLabel = (v: Vehicle): string =>
  [v.make, v.model, v.series].filter(Boolean).join(' ');

/** Distinct makes, for the vehicle selector. */
export const makes = Array.from(new Set(vehicles.map((v) => v.make)));

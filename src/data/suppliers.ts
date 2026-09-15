import type { Supplier } from '@/types';

/** Fictional suppliers for the marketplace / RFQ prototype. */
export const suppliers: Supplier[] = [
  {
    id: 'sup-outback',
    name: 'Outback Parts Co.',
    location: 'Brisbane, QLD',
    rating: 4.7,
    responseTimeHours: 2,
    fulfilment: ['same-day', 'next-day'],
    logoColor: '#f97316',
  },
  {
    id: 'sup-torque',
    name: 'Torque Distribution',
    location: 'Melbourne, VIC',
    rating: 4.5,
    responseTimeHours: 4,
    fulfilment: ['next-day'],
    logoColor: '#60a5fa',
  },
  {
    id: 'sup-nationwide',
    name: 'Nationwide Auto Supply',
    location: 'Sydney, NSW',
    rating: 4.2,
    responseTimeHours: 6,
    fulfilment: ['next-day', '2-3-days'],
    logoColor: '#34d399',
  },
  {
    id: 'sup-desert',
    name: 'Desert 4x4 Spares',
    location: 'Perth, WA',
    rating: 4.6,
    responseTimeHours: 3,
    fulfilment: ['2-3-days'],
    logoColor: '#fbbf24',
  },
  {
    id: 'sup-metro',
    name: 'Metro Parts Warehouse',
    location: 'Adelaide, SA',
    rating: 4.0,
    responseTimeHours: 8,
    fulfilment: ['next-day', '2-3-days'],
    logoColor: '#c084fc',
  },
];

export const supplierById = (id: string): Supplier | undefined =>
  suppliers.find((s) => s.id === id);

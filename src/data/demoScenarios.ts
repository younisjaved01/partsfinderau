import type { SearchInput } from '@/types';

/**
 * DEMO MODE sample searches (§24). Each produces realistic results against the
 * mock catalogue with zero external APIs connected.
 */
export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  input: SearchInput;
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'demo-hilux-brakes',
    label: 'Front brake pads for 2019 Hilux',
    description: 'Clean text + vehicle. High-confidence exact match.',
    input: {
      text: 'Front brake pads for 2019 Hilux',
      vehicle: { make: 'Toyota', model: 'Hilux', year: 2019, engine: '2.8L Diesel' },
    },
  },
  {
    id: 'demo-shockey-79',
    label: '"Shockey for a 79"',
    description: 'Messy slang. Engine translates it to a shock absorber for the LandCruiser 79 Series and asks front/rear.',
    input: { text: 'shockey for a 79' },
  },
  {
    id: 'demo-patrol-leaf',
    label: 'Rear leaf spring for Patrol Y61',
    description: 'Colloquial part + vehicle series.',
    input: { text: 'rear leaf spring for patrol Y61' },
  },
  {
    id: 'demo-prado-oil',
    label: 'Oil filter for Prado',
    description: 'Simple consumable lookup across suppliers.',
    input: { text: 'oil filter for prado' },
  },
  {
    id: 'demo-image-brake',
    label: 'Upload sample brake pad image',
    description: 'Simulated vision recognises a disc-brake component.',
    input: {
      image: 'sample://brake-pad.jpg',
      imageName: 'brake-pad-sample.jpg',
      text: '',
    },
  },
  {
    id: 'demo-messy-filter',
    label: '"that dust filter box thing"',
    description: 'Extreme slang → air filter.',
    input: { text: 'that dust filter box thing for a ranger' },
  },
];

import type { Build } from '@/types';

/**
 * Seed community builds. Each mod's `partId` references a REAL generated
 * catalogue part (`<templateKey>__<vehicleId>__<tier>`) so a build doubles as a
 * shoppable spec sheet. Mods with no catalogue equivalent (bar work, tents,
 * lighting) carry no partId and render as text — never faked into a part.
 *
 * The builds/owners are fictional demo content.
 */

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const seedBuilds: Build[] = [
  {
    id: 'build-redcentre-79',
    owner: 'Col R.',
    ownerHandle: '@coilover_col',
    title: 'Red Centre 79',
    tagline: 'Simpson-ready 79 Series — built for load, heat and corrugations.',
    vehicleId: 'veh-lc70',
    region: 'WA',
    story:
      'Daily-driven touring 79 that spends its holidays crossing the Simpson. Focus has been a compliant long-travel setup that carries a loaded tray without bottoming, plus heavy-duty front end parts to survive the washouts.',
    specs: [
      { label: 'Lift', value: '2" heavy-duty' },
      { label: 'Tyres', value: '35" mud-terrain' },
      { label: 'Wheels', value: '17" steel' },
      { label: 'Use', value: 'Desert touring' },
    ],
    mods: [
      { id: 'm1', category: 'Suspension', title: 'Front shocks — heavy-duty gas', partId: 'shock-front__veh-lc70__premium', status: 'fitted' },
      { id: 'm2', category: 'Suspension', title: 'Rear shocks — heavy-duty gas', partId: 'shock-rear__veh-lc70__premium', status: 'fitted' },
      { id: 'm3', category: 'Suspension', title: 'Rear leaf pack — constant load', partId: 'leaf-spring-rear__veh-lc70__premium', status: 'fitted' },
      { id: 'm4', category: 'Steering', title: 'Steering damper', partId: 'steering-damper__veh-lc70__premium', status: 'fitted' },
      { id: 'm5', category: 'Brake', title: 'Front brake pads — OEM', partId: 'brake-pad-front__veh-lc70__oem', status: 'fitted' },
      { id: 'm6', category: 'Driveline', title: 'Front hub assembly (spare set)', partId: 'hub-assembly__veh-lc70__premium', status: 'planned' },
      { id: 'm7', category: 'Protection', title: 'Steel bull bar + 12,000lb winch', note: 'Fabricated, not a catalogue part', status: 'fitted' },
      { id: 'm8', category: 'Wheels & Tyres', title: '35" muddies on 17" steel rims', status: 'fitted' },
      { id: 'm9', category: 'Touring', title: 'Long-range tank + dual battery', status: 'fitted' },
    ],
    likes: 184,
    featured: true,
    createdAt: daysAgo(6),
  },
  {
    id: 'build-weekend-lux',
    owner: 'Hannah D.',
    ownerHandle: '@hilux_hannah',
    title: 'Weekend Warrior Lux',
    tagline: 'Mild-but-capable Hilux — beach runs, high-country tracks, tow rig.',
    vehicleId: 'veh-hilux',
    region: 'QLD',
    story:
      'Kept it sensible: enough suspension to carry a camper and soak up corrugations, better brakes for towing, and protection underneath. Everything bolt-on so it stays reliable for work during the week.',
    specs: [
      { label: 'Lift', value: '40mm' },
      { label: 'Tyres', value: '33" all-terrain' },
      { label: 'Use', value: 'Tour + tow' },
    ],
    mods: [
      { id: 'm1', category: 'Suspension', title: 'Front shocks', partId: 'shock-front__veh-hilux__premium', status: 'fitted' },
      { id: 'm2', category: 'Suspension', title: 'Front control arm bushes', partId: 'control-arm-bush__veh-hilux__premium', status: 'fitted' },
      { id: 'm3', category: 'Brake', title: 'Front brake pads', partId: 'brake-pad-front__veh-hilux__premium', status: 'fitted' },
      { id: 'm4', category: 'Filters', title: 'Air filter', partId: 'air-filter__veh-hilux__premium', status: 'fitted' },
      { id: 'm5', category: 'Driveline', title: 'Front CV joint (spare)', partId: 'cv-joint__veh-hilux__premium', status: 'planned' },
      { id: 'm6', category: 'Protection', title: 'Underbody bash plates', note: 'Fabricated', status: 'fitted' },
      { id: 'm7', category: 'Lighting', title: 'LED light bar + driving lights', status: 'wishlist' },
    ],
    likes: 97,
    createdAt: daysAgo(12),
  },
  {
    id: 'build-gu-slayer',
    owner: 'Pete M.',
    ownerHandle: '@patrol_pete',
    title: 'GU Troopy-Slayer',
    tagline: 'Coil-sprung GU Patrol set up for serious remote work.',
    vehicleId: 'veh-patrol-y61',
    region: 'NSW',
    story:
      'Old-school 4.2 GU that just keeps going. Rebuilt the front end with new steering and hubs after years of hard tracks, and freshened the coils and shocks for a loaded touring weight.',
    specs: [
      { label: 'Lift', value: '2" constant load' },
      { label: 'Tyres', value: '33" mud-terrain' },
      { label: 'Engine', value: '4.2L diesel' },
    ],
    mods: [
      { id: 'm1', category: 'Suspension', title: 'Front coil springs', partId: 'coil-spring-front__veh-patrol-y61__premium', status: 'fitted' },
      { id: 'm2', category: 'Suspension', title: 'Front shocks', partId: 'shock-front__veh-patrol-y61__premium', status: 'fitted' },
      { id: 'm3', category: 'Steering', title: 'Idler arm', partId: 'idler-arm__veh-patrol-y61__premium', status: 'fitted' },
      { id: 'm4', category: 'Steering', title: 'Steering damper', partId: 'steering-damper__veh-patrol-y61__premium', status: 'fitted' },
      { id: 'm5', category: 'Driveline', title: 'Front hub assembly', partId: 'hub-assembly__veh-patrol-y61__premium', status: 'fitted' },
      { id: 'm6', category: 'Touring', title: 'Long range tank + dual batteries', status: 'fitted' },
    ],
    likes: 142,
    createdAt: daysAgo(20),
  },
  {
    id: 'build-nextgen-tourer',
    owner: 'Raj S.',
    ownerHandle: '@ranger_raj',
    title: 'Next-Gen Tourer',
    tagline: 'PX Ranger family tourer — comfort first, capable when it counts.',
    vehicleId: 'veh-ranger',
    region: 'VIC',
    story:
      'Set up for long-haul family trips with the van. Suspension to handle tongue weight, a spare CV on the shelf, and a clutch upgrade on the list before the next big lap.',
    specs: [
      { label: 'Lift', value: '45mm' },
      { label: 'Tyres', value: '32" all-terrain' },
      { label: 'Use', value: 'Tour + caravan' },
    ],
    mods: [
      { id: 'm1', category: 'Suspension', title: 'Front shocks', partId: 'shock-front__veh-ranger__premium', status: 'fitted' },
      { id: 'm2', category: 'Suspension', title: 'Rear leaf pack', partId: 'leaf-spring-rear__veh-ranger__premium', status: 'planned' },
      { id: 'm3', category: 'Driveline', title: 'Front CV joint', partId: 'cv-joint__veh-ranger__premium', status: 'fitted' },
      { id: 'm4', category: 'Clutch', title: 'Heavy-duty clutch kit', partId: 'clutch-kit__veh-ranger__premium', status: 'wishlist' },
      { id: 'm5', category: 'Exhaust', title: 'DPF replacement', partId: 'dpf__veh-ranger__premium', status: 'planned' },
      { id: 'm6', category: 'Lighting', title: 'Light bar + spotties', status: 'fitted' },
    ],
    likes: 68,
    createdAt: daysAgo(3),
  },
  {
    id: 'build-80-classic',
    owner: 'Eddie T.',
    ownerHandle: '@eighty_eddie',
    title: '80 Series Classic',
    tagline: 'Factory-feel 80 Series, quietly rebuilt front to back.',
    vehicleId: 'veh-lc80',
    region: 'SA',
    story:
      'Keeping a tidy 80 on the road the right way — genuine-feel ride height, fresh steering and hubs. No lift chasing, just a solid, reliable classic cruiser.',
    specs: [
      { label: 'Lift', value: 'OE height' },
      { label: 'Tyres', value: '31" all-terrain' },
      { label: 'Engine', value: '4.5L petrol' },
    ],
    mods: [
      { id: 'm1', category: 'Suspension', title: 'Front coil springs', partId: 'coil-spring-front__veh-lc80__premium', status: 'fitted' },
      { id: 'm2', category: 'Suspension', title: 'Front shocks', partId: 'shock-front__veh-lc80__premium', status: 'fitted' },
      { id: 'm3', category: 'Steering', title: 'Idler arm', partId: 'idler-arm__veh-lc80__premium', status: 'fitted' },
      { id: 'm4', category: 'Driveline', title: 'Front hub assembly', partId: 'hub-assembly__veh-lc80__premium', status: 'fitted' },
      { id: 'm5', category: 'Protection', title: 'Rock sliders', status: 'fitted' },
    ],
    likes: 55,
    createdAt: daysAgo(30),
  },
  {
    id: 'build-200-overlander',
    owner: 'Casey W.',
    ownerHandle: '@cruiser_casey',
    title: '200 Series Overlander',
    tagline: 'Big-km 200 Series set up for comfortable remote travel.',
    vehicleId: 'veh-lc200',
    region: 'NT',
    story:
      'High-km 200 that still does the big trips. Suspension refreshed for touring weight and a caliper rebuild planned before the dry season. Rooftop tent and drawers for the long hauls.',
    specs: [
      { label: 'Lift', value: '50mm touring' },
      { label: 'Tyres', value: '34" all-terrain' },
      { label: 'Use', value: 'Remote overlanding' },
    ],
    mods: [
      { id: 'm1', category: 'Suspension', title: 'Front coil springs', partId: 'coil-spring-front__veh-lc200__premium', status: 'fitted' },
      { id: 'm2', category: 'Suspension', title: 'Front shocks', partId: 'shock-front__veh-lc200__premium', status: 'fitted' },
      { id: 'm3', category: 'Brake', title: 'Front brake caliper', partId: 'brake-caliper-front__veh-lc200__premium', status: 'planned' },
      { id: 'm4', category: 'Driveline', title: 'Front CV joint', partId: 'cv-joint__veh-lc200__premium', status: 'fitted' },
      { id: 'm5', category: 'Touring', title: 'Rooftop tent + drawer system', status: 'fitted' },
    ],
    likes: 121,
    createdAt: daysAgo(9),
  },
];

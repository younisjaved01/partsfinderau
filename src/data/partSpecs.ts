/**
 * CATALOGUE SPEC EXTRAS
 * ------------------------------------------------------------------
 * Physical / technical catalogue data for each part TEMPLATE (keyed by
 * template.key). This is the prototype catalogue's own product data — the UI
 * labels it as catalogue spec, never as a manufacturer-verified datasheet.
 *
 * `related` lists the CANONICAL TERMS of genuinely related catalogue items
 * (e.g. brake pads ↔ brake rotors). The related-parts resolver only surfaces
 * ones that actually exist for the selected vehicle, so no relationship is
 * fabricated — anything unresolved is simply not shown.
 *
 * Templates without an entry fall back to "Not specified" in the UI; nothing
 * is invented to fill a blank.
 */

export interface PartSpecExtras {
  /** Primary construction material. */
  material?: string;
  /** Shipped weight, kg. */
  weightKg?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  /** Units supplied per pack / kit. */
  packQty?: number;
  /** Quantity typically required to complete the job on one vehicle. */
  vehicleQty?: number;
  /** Canonical terms of related catalogue items (resolved against real parts). */
  related?: string[];
  /** Product notes. */
  notes?: string[];
  /** Installation notes. */
  install?: string[];
  /** Safety warnings / special requirements. */
  warnings?: string[];
}

export const partSpecs: Record<string, PartSpecExtras> = {
  // ---------------- Brake ----------------
  'brake-pad-front': {
    material: 'Ceramic friction compound',
    weightKg: 2.4,
    lengthMm: 131,
    widthMm: 59,
    heightMm: 17,
    packQty: 4,
    vehicleQty: 1,
    related: ['brake rotor', 'brake caliper'],
    notes: ['Axle set — enough for both front wheels.', 'Wear sensor included where fitted.'],
    install: ['Replace in axle sets only.', 'Bed in pads per the supplied procedure before heavy use.'],
    warnings: ['Brake dust may contain irritants — use appropriate PPE.'],
  },
  'brake-pad-rear': {
    material: 'Semi-metallic friction compound',
    weightKg: 1.9,
    lengthMm: 116,
    widthMm: 52,
    heightMm: 16,
    packQty: 4,
    vehicleQty: 1,
    related: ['brake rotor'],
    notes: ['Axle set for both rear wheels.'],
    install: ['Replace in axle sets only.'],
  },
  'brake-rotor-front': {
    material: 'Cast iron, anti-corrosion coated',
    weightKg: 8.6,
    lengthMm: 319,
    widthMm: 319,
    heightMm: 78,
    packQty: 1,
    vehicleQty: 2,
    related: ['brake pad', 'brake caliper', 'wheel bearing'],
    notes: ['Sold individually — two required per axle.'],
    install: ['Replace rotors as an axle pair for even braking.', 'Clean protective coating from friction faces before fitting.'],
  },
  'brake-caliper-front': {
    material: 'Cast iron body, alloy pistons',
    weightKg: 4.2,
    packQty: 1,
    vehicleQty: 2,
    related: ['brake pad', 'brake rotor'],
    install: ['Bleed the brake system after fitting.'],
    warnings: ['Brake fluid is corrosive — avoid contact with paintwork.'],
  },

  // ---------------- Suspension ----------------
  'shock-front': {
    material: 'Steel body, gas-charged',
    weightKg: 3.1,
    lengthMm: 540,
    widthMm: 60,
    heightMm: 60,
    packQty: 1,
    vehicleQty: 2,
    related: ['coil spring', 'control arm bush', 'sway bar link'],
    notes: ['Sold individually — replace in pairs per axle.'],
    install: ['Replace shocks in axle pairs.', 'Support the axle before removing the lower mount.'],
    warnings: ['Gas-charged — do not puncture or incinerate.'],
  },
  'shock-rear': {
    material: 'Steel body, gas-charged',
    weightKg: 3.0,
    lengthMm: 560,
    widthMm: 60,
    heightMm: 60,
    packQty: 1,
    vehicleQty: 2,
    related: ['leaf spring', 'coil spring', 'control arm bush'],
    notes: ['Sold individually — replace in pairs per axle.'],
    warnings: ['Gas-charged — do not puncture or incinerate.'],
  },
  'coil-spring-front': {
    material: 'Spring steel, powder-coated',
    weightKg: 6.4,
    packQty: 1,
    vehicleQty: 2,
    related: ['shock absorber', 'control arm bush'],
    install: ['Use a certified spring compressor.'],
    warnings: ['Stored energy — compress springs with rated tooling only.'],
  },
  'leaf-spring-rear': {
    material: 'Spring steel leaf pack',
    weightKg: 22,
    packQty: 1,
    vehicleQty: 2,
    related: ['shock absorber', 'universal joint'],
    notes: ['Constant-load rating.'],
    install: ['Torque U-bolts to spec and re-torque after first 500 km.'],
  },
  'control-arm-bush': {
    material: 'Natural rubber / steel sleeve',
    weightKg: 0.3,
    packQty: 2,
    vehicleQty: 1,
    related: ['sway bar link', 'tie rod end'],
    notes: ['Press-fit — supplied as a pair.'],
    install: ['Press out/in with the correct bush tool; do not hammer.'],
  },
  'sway-bar-link': {
    material: 'Steel with sealed ball joints',
    weightKg: 0.5,
    lengthMm: 95,
    packQty: 1,
    vehicleQty: 2,
    related: ['control arm bush'],
  },

  // ---------------- Steering ----------------
  'tie-rod-end': {
    material: 'Forged steel, sealed ball joint',
    weightKg: 0.7,
    packQty: 1,
    vehicleQty: 2,
    related: ['idler arm', 'steering damper'],
    install: ['Wheel alignment required after fitting.'],
  },
  'idler-arm': {
    material: 'Cast steel, sealed bearing',
    weightKg: 1.2,
    packQty: 1,
    vehicleQty: 1,
    related: ['tie rod end', 'steering damper'],
  },
  'steering-damper': {
    material: 'Steel body, gas-charged',
    weightKg: 1.1,
    lengthMm: 420,
    packQty: 1,
    vehicleQty: 1,
    related: ['tie rod end'],
    warnings: ['Gas-charged — do not puncture or incinerate.'],
  },

  // ---------------- Engine ----------------
  'engine-mount': {
    material: 'Hydraulic rubber / steel',
    weightKg: 1.3,
    packQty: 1,
    vehicleQty: 2,
    related: ['gearbox mount'],
  },
  'timing-belt-kit': {
    material: 'HNBR belt, steel tensioner/idlers',
    weightKg: 2.2,
    packQty: 1,
    vehicleQty: 1,
    related: ['water pump', 'drive belt'],
    notes: ['Kit includes belt, tensioner and idler pulleys.'],
    install: ['Replace at the manufacturer service interval.', 'Set engine to TDC before removing the old belt.'],
    warnings: ['Interference engine — incorrect timing can cause engine damage.'],
  },
  'serpentine-belt': {
    material: 'EPDM rubber, 6-rib',
    weightKg: 0.3,
    lengthMm: 2050,
    packQty: 1,
    vehicleQty: 1,
    related: ['water pump'],
  },

  // ---------------- Cooling ----------------
  radiator: {
    material: 'Aluminium core, plastic tanks',
    weightKg: 6.8,
    lengthMm: 700,
    widthMm: 480,
    heightMm: 40,
    packQty: 1,
    vehicleQty: 1,
    related: ['water pump', 'thermostat'],
    install: ['Refill with the specified coolant and bleed air after fitting.'],
    warnings: ['Do not open the cooling system while hot.'],
  },
  'water-pump': {
    material: 'Cast housing, steel impeller',
    weightKg: 1.6,
    packQty: 1,
    vehicleQty: 1,
    related: ['thermostat', 'drive belt', 'timing belt kit'],
    notes: ['Gasket/seal included.'],
  },
  thermostat: {
    material: 'Brass / wax element',
    weightKg: 0.2,
    packQty: 1,
    vehicleQty: 1,
    related: ['radiator', 'water pump'],
  },

  // ---------------- Electrical ----------------
  alternator: {
    material: 'Alloy housing',
    weightKg: 5.4,
    packQty: 1,
    vehicleQty: 1,
    related: ['drive belt'],
    warnings: ['Disconnect the battery before fitting.'],
  },
  'starter-motor': {
    material: 'Steel / alloy housing',
    weightKg: 4.1,
    packQty: 1,
    vehicleQty: 1,
    warnings: ['Disconnect the battery before fitting.'],
  },
  'o2-sensor': {
    material: 'Zirconia element, steel body',
    weightKg: 0.2,
    packQty: 1,
    vehicleQty: 1,
    install: ['Apply anti-seize to the thread only — keep off the sensor tip.'],
  },
  'ignition-coil': {
    material: 'Epoxy-moulded pencil coil',
    weightKg: 0.3,
    packQty: 1,
    vehicleQty: 1,
    notes: ['One required per cylinder.'],
  },

  // ---------------- Filters ----------------
  'oil-filter': {
    material: 'Steel can, cellulose media',
    weightKg: 0.3,
    packQty: 1,
    vehicleQty: 1,
    related: ['air filter', 'fuel filter'],
    install: ['Lightly oil the seal and hand-tighten only.'],
  },
  'air-filter': {
    material: 'Dry paper panel media',
    weightKg: 0.4,
    packQty: 1,
    vehicleQty: 1,
    related: ['oil filter', 'fuel filter'],
  },
  'fuel-filter': {
    material: '10-micron media, water separator',
    weightKg: 0.5,
    packQty: 1,
    vehicleQty: 1,
    related: ['oil filter', 'air filter'],
    install: ['Prime the fuel system after fitting (diesel).'],
  },
  'cabin-filter': {
    material: 'Activated carbon media',
    weightKg: 0.2,
    packQty: 1,
    vehicleQty: 1,
  },

  // ---------------- Clutch ----------------
  'clutch-kit': {
    material: 'Organic friction disc, steel cover',
    weightKg: 7.2,
    lengthMm: 275,
    packQty: 1,
    vehicleQty: 1,
    related: ['clutch master cylinder', 'gearbox mount'],
    notes: ['Kit includes cover, driven plate and release bearing.'],
    install: ['Machine or replace the flywheel as required.', 'Align the driven plate with a clutch alignment tool.'],
  },
  'clutch-master': {
    material: 'Alloy body, alloy piston',
    weightKg: 0.6,
    packQty: 1,
    vehicleQty: 1,
    related: ['clutch kit'],
    install: ['Bleed the clutch hydraulics after fitting.'],
  },

  // ---------------- Transmission ----------------
  'auto-trans-filter': {
    material: 'Media filter + pan gasket',
    weightKg: 0.8,
    packQty: 1,
    vehicleQty: 1,
    notes: ['Includes pan gasket.'],
    install: ['Refill with the specified ATF to the correct level.'],
  },
  'gearbox-mount': {
    material: 'Rubber / steel',
    weightKg: 1.0,
    packQty: 1,
    vehicleQty: 1,
    related: ['engine mount'],
  },

  // ---------------- Driveline ----------------
  'cv-joint': {
    material: 'Hardened steel, 26-spline',
    weightKg: 2.3,
    packQty: 1,
    vehicleQty: 1,
    related: ['wheel bearing', 'wheel hub', 'universal joint'],
    notes: ['Boot and grease included.'],
    warnings: ['Pack with the supplied CV grease only.'],
  },
  'tailshaft-uni': {
    material: 'Hardened steel journal cross',
    weightKg: 0.5,
    packQty: 1,
    vehicleQty: 2,
    related: ['CV joint'],
  },

  // ---------------- Bearings ----------------
  'wheel-bearing-front': {
    material: 'Taper roller bearing + seals',
    weightKg: 1.4,
    packQty: 1,
    vehicleQty: 2,
    related: ['wheel hub', 'CV joint', 'brake rotor'],
    notes: ['Kit includes bearings and seals.'],
    install: ['Pre-load/torque the hub nut to specification.'],
  },
  'wheel-bearing-rear': {
    material: 'Sealed bearing + seal',
    weightKg: 1.6,
    packQty: 1,
    vehicleQty: 2,
    related: ['wheel hub'],
  },
  'hub-assembly': {
    material: 'Cast hub, 6-stud',
    weightKg: 3.2,
    packQty: 1,
    vehicleQty: 2,
    related: ['wheel bearing', 'CV joint'],
  },

  // ---------------- Body ----------------
  headlight: {
    material: 'Polycarbonate lens, ABS housing',
    weightKg: 2.1,
    packQty: 1,
    vehicleQty: 1,
    notes: ['Side-specific — confirm left or right.'],
    install: ['Headlight aim adjustment required after fitting.'],
  },
  'door-mirror': {
    material: 'ABS housing, electric glass',
    weightKg: 1.3,
    packQty: 1,
    vehicleQty: 1,
    notes: ['Side-specific — confirm left or right.'],
  },

  // ---------------- Exhaust ----------------
  muffler: {
    material: 'Aluminised steel',
    weightKg: 6.0,
    lengthMm: 600,
    packQty: 1,
    vehicleQty: 1,
    warnings: ['Allow the exhaust to cool before working on it.'],
  },
  dpf: {
    material: 'Cordierite substrate, steel can',
    weightKg: 7.5,
    packQty: 1,
    vehicleQty: 1,
    install: ['A forced DPF regeneration / relearn may be required after fitting.'],
    warnings: ['Handle used DPFs as hazardous — soot is a respiratory irritant.'],
  },
};

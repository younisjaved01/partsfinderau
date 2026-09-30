import type {
  SearchInput,
  Interpretation,
  PartCategory,
  PartPosition,
  PartSide,
  SearchModality,
  Vehicle,
  Clarification,
} from '@/types';
import { vehicles, vehicleLabel } from '@/data/vehicles';
import { partTemplates } from '@/data/partTemplates';
import { requestLlmInterpretation } from './llm/client';
import type { PartsSearchRequest } from './llm/types';

/**
 * PARTS INTELLIGENCE ENGINE (§17)
 * ------------------------------------------------------------------
 * The single, unified reasoning layer that converts *any* combination of
 * clues — text, voice transcript, part number, vehicle data, image — into a
 * structured Interpretation.
 *
 * This prototype implements the reasoning with local, deterministic mock
 * logic. It deliberately hides that behind the {@link PartsIntelligence}
 * interface and the {@link interpret} entry point so the mock can later be
 * swapped for a real LLM / vision model / embedding search WITHOUT changing
 * any caller. See `integrations.ts` for the provider seam.
 */

export interface PartsIntelligence {
  interpret(input: SearchInput): Promise<Interpretation>;
}

// ---------------------------------------------------------------------------
// Lexicon derived from the catalogue templates.
// ---------------------------------------------------------------------------

interface TermEntry {
  phrase: string;
  canonicalTerm: string;
  category: PartCategory;
  position: PartPosition;
  side: PartSide;
}

const termIndex: TermEntry[] = (() => {
  const entries: TermEntry[] = [];
  for (const t of partTemplates) {
    const phrases = new Set<string>([
      t.canonicalTerm.toLowerCase(),
      t.name.toLowerCase(),
      ...t.aliases.map((a) => a.toLowerCase()),
    ]);
    for (const phrase of phrases) {
      entries.push({
        phrase,
        canonicalTerm: t.canonicalTerm,
        category: t.category,
        position: t.position,
        side: t.side,
      });
    }
  }
  // Longer phrases first so the most specific alias wins.
  return entries.sort((a, b) => b.phrase.length - a.phrase.length);
})();

const categoryKeywords: { kw: string; category: PartCategory }[] = [
  { kw: 'brake', category: 'Brake' },
  { kw: 'suspension', category: 'Suspension' },
  { kw: 'steering', category: 'Steering' },
  { kw: 'engine', category: 'Engine' },
  { kw: 'cooling', category: 'Cooling' },
  { kw: 'electrical', category: 'Electrical' },
  { kw: 'filter', category: 'Filters' },
  { kw: 'clutch', category: 'Clutch' },
  { kw: 'transmission', category: 'Transmission' },
  { kw: 'gearbox', category: 'Transmission' },
  { kw: 'driveline', category: 'Driveline' },
  { kw: 'bearing', category: 'Bearings' },
  { kw: 'body', category: 'Body' },
  { kw: 'exhaust', category: 'Exhaust' },
];

const normalise = (s: string): string =>
  ` ${s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

function detectVehicle(
  text: string,
  vq: SearchInput['vehicle'],
): { vehicle?: Vehicle; label?: string; reason?: string } {
  // 1) Structured vehicle query wins.
  if (vq?.make || vq?.model) {
    const match = vehicles.find(
      (v) =>
        (!vq.make || v.make.toLowerCase() === vq.make.toLowerCase()) &&
        (!vq.model || v.model.toLowerCase() === vq.model.toLowerCase()) &&
        (!vq.series || (v.series ?? '').toLowerCase().includes(vq.series.toLowerCase())),
    );
    if (match) return { vehicle: match, label: vehicleLabel(match), reason: 'Matched structured vehicle selection' };
  }

  // 2) Alias / make-model scan of free text.
  const hay = normalise(text);
  let best: { vehicle: Vehicle; score: number; phrase: string } | undefined;
  for (const v of vehicles) {
    const candidates = [
      ...v.aliases.map((a) => a.toLowerCase()),
      v.model.toLowerCase(),
      v.series?.toLowerCase() ?? '',
    ].filter(Boolean);
    for (const c of candidates) {
      if (hay.includes(` ${c} `) || hay.includes(` ${c}`)) {
        const score = c.length;
        if (!best || score > best.score) best = { vehicle: v, score, phrase: c };
      }
    }
  }
  if (best) {
    return {
      vehicle: best.vehicle,
      label: vehicleLabel(best.vehicle),
      reason: `Recognised "${best.phrase}" → ${vehicleLabel(best.vehicle)}`,
    };
  }
  return {};
}

function detectYear(text: string, vq: SearchInput['vehicle']): number | undefined {
  if (vq?.year) return vq.year;
  const m = text.match(/\b(19\d{2}|20\d{2})\b/);
  if (m) return parseInt(m[1], 10);
  return undefined;
}

function detectPosition(text: string): PartPosition | undefined {
  const hay = normalise(text);
  const hasFront = /\bfront\b|\bfronts\b/.test(hay);
  const hasRear = /\brear\b|\bback\b|\brears\b/.test(hay);
  if (hasFront && hasRear) return 'front-rear';
  if (hasFront) return 'front';
  if (hasRear) return 'rear';
  return undefined;
}

function detectSide(text: string): PartSide | undefined {
  const hay = normalise(text);
  const left = /\bleft\b|\bdriver\b|\bl h\b|\blhs\b/.test(hay);
  const right = /\bright\b|\bpassenger\b|\br h\b|\brhs\b/.test(hay);
  if (left && right) return 'left-right';
  if (left) return 'left';
  if (right) return 'right';
  return undefined;
}

function detectPartTerm(text: string): {
  entry?: TermEntry;
  matchedPhrase?: string;
} {
  const hay = normalise(text);
  for (const entry of termIndex) {
    if (hay.includes(` ${entry.phrase} `) || hay.includes(` ${entry.phrase}`)) {
      return { entry, matchedPhrase: entry.phrase };
    }
  }
  return {};
}

function detectCategory(text: string): PartCategory | undefined {
  const hay = normalise(text);
  for (const { kw, category } of categoryKeywords) {
    if (hay.includes(kw)) return category;
  }
  return undefined;
}

/**
 * Does the detected term have both front and rear catalogue variants, so we
 * should ask the user which they need? (§6 clarification flow.)
 */
function needsPositionClarification(canonicalTerm: string): boolean {
  const variants = partTemplates.filter((t) => t.canonicalTerm === canonicalTerm);
  const positions = new Set(variants.map((t) => t.position));
  return positions.has('front') && positions.has('rear');
}

// ---------------------------------------------------------------------------
// Image (simulated vision). Honest placeholder — no real pixels analysed.
// ---------------------------------------------------------------------------

function imageHint(imageName?: string): { category?: PartCategory; term?: string; reason: string } | undefined {
  if (imageName === undefined) return undefined;
  const name = imageName.toLowerCase();
  const found = categoryKeywords.find(({ kw }) => name.includes(kw));
  if (found) {
    return {
      category: found.category,
      reason: `Simulated vision matched filename hint → ${found.category}`,
    };
  }
  // Default plausible guess for the demo brake-pad image.
  return {
    category: 'Brake',
    term: 'brake pad',
    reason: 'Simulated vision: matched a disc-brake component silhouette (demo model — connect a real vision API to enable true recognition)',
  };
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

/**
 * Local, deterministic interpretation — the offline mock. Always runs, and is
 * the fallback whenever the real LLM is unavailable (Demo Mode / no key).
 */
function computeLocal(input: SearchInput): Interpretation {
  {
    const reasoning: string[] = [];
    const normalisedTerms: { from: string; to: string }[] = [];
    const modalities: SearchModality[] = [];

    const textParts = [input.text, input.voiceTranscript, input.partNumber]
      .filter(Boolean)
      .join(' ');
    if (input.text) modalities.push('text');
    if (input.voiceTranscript) modalities.push('voice');
    if (input.partNumber) modalities.push('partNumber');
    if (input.image) modalities.push('image');
    if (input.vehicle && (input.vehicle.make || input.vehicle.model)) modalities.push('vehicle');

    let confidence = 0.35;

    // --- Vehicle ---
    const veh = detectVehicle(textParts, input.vehicle);
    if (veh.vehicle) {
      confidence += 0.2;
      reasoning.push(veh.reason ?? `Vehicle: ${veh.label}`);
    } else {
      reasoning.push('No vehicle identified yet — results shown across all fitments');
    }

    // --- Part term ---
    let detectedCategory: PartCategory | undefined;
    let detectedPartTerm: string | undefined;
    const termMatch = detectPartTerm(textParts);
    if (termMatch.entry) {
      detectedCategory = termMatch.entry.category;
      detectedPartTerm = termMatch.entry.canonicalTerm;
      confidence += 0.28;
      if (termMatch.matchedPhrase && termMatch.matchedPhrase !== detectedPartTerm) {
        normalisedTerms.push({ from: termMatch.matchedPhrase, to: detectedPartTerm });
        reasoning.push(`Translated "${termMatch.matchedPhrase}" → catalogue term "${detectedPartTerm}"`);
      } else {
        reasoning.push(`Part term: ${detectedPartTerm}`);
      }
    } else {
      const cat = detectCategory(textParts);
      if (cat) {
        detectedCategory = cat;
        confidence += 0.12;
        reasoning.push(`Category inferred: ${cat}`);
      }
    }

    // --- Image (simulated vision) ---
    if (input.image !== undefined) {
      const hint = imageHint(input.imageName);
      if (hint) {
        reasoning.push(hint.reason);
        if (!detectedCategory && hint.category) {
          detectedCategory = hint.category;
          detectedPartTerm = detectedPartTerm ?? hint.term;
          confidence += 0.15;
        } else if (hint.category && detectedCategory === hint.category) {
          confidence += 0.08;
          reasoning.push('Image and text agree on part category (+confidence)');
        }
      }
    }

    // --- Position / side / year / engine ---
    const position = detectPosition(textParts);
    if (position) {
      confidence += 0.06;
      reasoning.push(`Position: ${position}`);
    }
    const side = detectSide(textParts);
    if (side) reasoning.push(`Side: ${side}`);
    const year = detectYear(textParts, input.vehicle);
    if (year) {
      confidence += 0.05;
      reasoning.push(`Year: ${year}`);
    }
    const engine = input.vehicle?.engine;
    if (engine) reasoning.push(`Engine: ${engine}`);

    // --- Part number direct signal ---
    if (input.partNumber) {
      confidence += 0.1;
      reasoning.push(`Part number provided: ${input.partNumber}`);
    }

    // --- Clarification (§6) ---
    let clarification: Clarification | undefined;
    if (detectedPartTerm && !position && needsPositionClarification(detectedPartTerm)) {
      clarification = {
        question: `Do you need front or rear ${detectedPartTerm}?`,
        field: 'position',
        options: [
          { label: 'Front', patch: { text: `front ${textParts}` } },
          { label: 'Rear', patch: { text: `rear ${textParts}` } },
          { label: 'Not sure — show both', patch: {} },
        ],
      };
      reasoning.push('Ambiguous position — asking front vs rear');
    }

    confidence = Math.min(0.98, confidence);

    return {
      detectedVehicle: veh.vehicle,
      detectedVehicleLabel: veh.label,
      detectedCategory,
      detectedPartTerm,
      position,
      side,
      year,
      engine,
      confidence,
      reasoning,
      modalities,
      clarification,
      normalisedTerms,
    };
  }
}

/** Offline mock provider — wraps the local interpreter. Preserves Demo Mode. */
class MockPartsIntelligence implements PartsIntelligence {
  async interpret(input: SearchInput): Promise<Interpretation> {
    return { ...computeLocal(input), aiProvider: 'offline' };
  }
}

/** The offline engine (always available, no API key required). */
export const partsIntelligence: PartsIntelligence = new MockPartsIntelligence();

// --- LLM grounding helpers -------------------------------------------------

const categoryByName: Record<string, PartCategory> = {
  brake: 'Brake', brakes: 'Brake', suspension: 'Suspension', steering: 'Steering',
  engine: 'Engine', cooling: 'Cooling', electrical: 'Electrical', filter: 'Filters',
  filters: 'Filters', clutch: 'Clutch', transmission: 'Transmission', gearbox: 'Transmission',
  driveline: 'Driveline', drivetrain: 'Driveline', bearing: 'Bearings', bearings: 'Bearings',
  body: 'Body', exhaust: 'Exhaust',
};
function mapCategory(s: string | null): PartCategory | undefined {
  if (!s) return undefined;
  const key = s.toLowerCase().trim();
  return categoryByName[key] ?? categoryByName[key.replace(/s$/, '')];
}

/** Ground an LLM part type onto our catalogue lexicon when possible. */
function groundTerm(type: string | null): TermEntry | undefined {
  if (!type) return undefined;
  const t = ` ${type.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  return (
    termIndex.find((e) => t.trim() === e.phrase) ??
    termIndex.find((e) => t.includes(` ${e.phrase} `) || t.includes(` ${e.phrase}`))
  );
}

function resolveLlmVehicle(v: PartsSearchRequest['vehicle']): Vehicle | undefined {
  if (!v.make && !v.model) return undefined;
  const matches = vehicles.filter(
    (x) =>
      (!v.make || x.make.toLowerCase() === v.make!.toLowerCase()) &&
      (!v.model ||
        x.model.toLowerCase().includes(v.model!.toLowerCase()) ||
        v.model!.toLowerCase().includes(x.model.toLowerCase())),
  );
  if (matches.length <= 1) return matches[0];
  const s = (v.series ?? '').toLowerCase();
  return (
    matches.find((x) => s && ((x.series ?? '').toLowerCase().includes(s) || (x.chassis ?? '').toLowerCase() === s)) ??
    matches.find((x) => s && x.aliases.some((a) => a.toLowerCase().includes(s))) ??
    matches[0]
  );
}

/** Merge a real LLM structured request onto the local interpretation. */
function mergeLlm(
  local: Interpretation,
  req: PartsSearchRequest,
  input: SearchInput,
  model?: string,
): Interpretation {
  // If the LLM added no usable signal, keep the local interpretation.
  if (!req.part.type && !req.part.category && !req.vehicle.make && !req.vehicle.model) {
    return { ...local, aiProvider: 'offline' };
  }

  const reasoning: string[] = [`Understood by OpenAI${model ? ` (${model})` : ''}`];
  const normalisedTerms: { from: string; to: string }[] = [];

  const veh = resolveLlmVehicle(req.vehicle) ?? local.detectedVehicle;
  if (veh) reasoning.push(`Vehicle: ${vehicleLabel(veh)}`);

  // Part term / category grounded to our catalogue lexicon.
  const grounded = groundTerm(req.part.type);
  const detectedPartTerm = grounded?.canonicalTerm ?? req.part.type?.toLowerCase() ?? local.detectedPartTerm;
  const detectedCategory = grounded?.category ?? mapCategory(req.part.category) ?? local.detectedCategory;
  if (req.part.type && detectedPartTerm && req.part.type.toLowerCase() !== detectedPartTerm) {
    normalisedTerms.push({ from: req.part.type, to: detectedPartTerm });
    reasoning.push(`Translated "${req.part.type}" → catalogue term "${detectedPartTerm}"`);
  } else if (detectedPartTerm) {
    reasoning.push(`Part: ${detectedPartTerm}`);
  }

  const pos = req.part.position;
  const position: PartPosition | undefined = pos === 'Front' ? 'front' : pos === 'Rear' ? 'rear' : local.position;
  if (position) reasoning.push(`Position: ${position}`);
  const year = req.vehicle.year ?? local.year;
  if (year) reasoning.push(`Year: ${year}`);
  const engine = req.vehicle.engine ?? input.vehicle?.engine ?? local.engine;
  if (engine) reasoning.push(`Engine: ${engine}`);
  if (req.part.application) reasoning.push(`Application: ${req.part.application}`);
  for (const m of req.missingInformation ?? []) reasoning.push(`Needs confirmation: ${m}`);

  // Reuse the local front/rear clarification when position is still unknown.
  const textParts = [input.text, input.voiceTranscript, input.partNumber].filter(Boolean).join(' ');
  let clarification: Interpretation['clarification'];
  if (detectedPartTerm && !position && needsPositionClarification(detectedPartTerm)) {
    clarification = {
      question: `Do you need front or rear ${detectedPartTerm}?`,
      field: 'position',
      options: [
        { label: 'Front', patch: { text: `front ${textParts}` } },
        { label: 'Rear', patch: { text: `rear ${textParts}` } },
        { label: 'Not sure — show both', patch: {} },
      ],
    };
  }

  return {
    detectedVehicle: veh,
    detectedVehicleLabel: veh ? vehicleLabel(veh) : undefined,
    detectedCategory,
    detectedPartTerm,
    position,
    side: local.side,
    year,
    engine,
    confidence: Math.max(0, Math.min(0.98, req.confidence || local.confidence)),
    reasoning,
    modalities: local.modalities,
    clarification,
    normalisedTerms,
    aiProvider: 'openai',
    aiModel: model,
    missingInformation: req.missingInformation,
  };
}

/**
 * Public entry point. Tries the real LLM (via OUR backend) to STRUCTURE the
 * request, then continues through the existing engine and catalogue. Falls back
 * to the offline mock whenever the LLM is unavailable — so Demo Mode always
 * works with no API key. The LLM never supplies part data (numbers, price,
 * stock, fitment) — only the structured understanding of the request.
 */
export async function interpret(input: SearchInput): Promise<Interpretation> {
  const local = computeLocal(input);
  const textParts = [input.text, input.voiceTranscript, input.partNumber].filter(Boolean).join(' ').trim();
  if (!textParts) return { ...local, aiProvider: 'offline' };
  try {
    const llm = await requestLlmInterpretation(textParts, input.vehicle);
    if (llm) return mergeLlm(local, llm.request, input, llm.model);
  } catch {
    /* fall through to offline */
  }
  return { ...local, aiProvider: 'offline' };
}

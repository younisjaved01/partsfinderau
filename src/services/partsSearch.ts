import type {
  SearchInput,
  SearchResult,
  ScoredPart,
  Part,
  Interpretation,
} from '@/types';
import { parts, partById } from '@/data/parts';
import { interpret } from './partsIntelligence';

/**
 * PARTS SEARCH SERVICE (§18)
 * ------------------------------------------------------------------
 * Ranks the catalogue against a structured {@link Interpretation}. Kept out of
 * the UI entirely: components call {@link search} and render the result.
 *
 * The scoring is a transparent, explainable heuristic (each part carries the
 * reasons it matched). It can later be replaced by / blended with vector
 * similarity search over embeddings without changing the return shape.
 */

const normalise = (s: string): string =>
  ` ${s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;

function partNumberMatches(part: Part, query: string): boolean {
  const q = query.toLowerCase().replace(/\s+/g, '');
  if (!q) return false;
  const candidates = [
    part.partNumber,
    part.oemNumber,
    ...part.crossReferences.map((c) => c.partNumber),
  ].map((c) => c.toLowerCase().replace(/\s+/g, ''));
  return candidates.some((c) => c.includes(q) || q.includes(c));
}

function scorePart(part: Part, interp: Interpretation, input: SearchInput): ScoredPart | null {
  let score = 0;
  const reasons: string[] = [];
  let anySignal = false;

  // Part number is the strongest possible signal.
  if (input.partNumber && partNumberMatches(part, input.partNumber)) {
    score += 0.6;
    anySignal = true;
    reasons.push(`Part number matches ${input.partNumber}`);
  }

  // Catalogue term.
  if (interp.detectedPartTerm) {
    if (normalise(part.name).includes(` ${interp.detectedPartTerm.toLowerCase()} `) ||
        normalise(part.name).includes(interp.detectedPartTerm.toLowerCase())) {
      score += 0.4;
      anySignal = true;
      reasons.push(`Matches part type "${interp.detectedPartTerm}"`);
    } else if (interp.detectedCategory && part.category === interp.detectedCategory) {
      // Same category but different exact type — partial.
      score += 0.12;
      anySignal = true;
    }
  } else if (interp.detectedCategory && part.category === interp.detectedCategory) {
    score += 0.3;
    anySignal = true;
    reasons.push(`In category ${part.category}`);
  }

  // A detected category rules out unrelated categories — a brake-pad query
  // should not surface headlights just because they fit the same vehicle.
  if (interp.detectedCategory && part.category !== interp.detectedCategory) {
    score -= 0.45;
  }

  // Vehicle fitment.
  if (interp.detectedVehicle) {
    const fits = part.fitments.some((f) => f.vehicleId === interp.detectedVehicle!.id);
    if (fits) {
      score += 0.3;
      anySignal = true;
      reasons.push(`Fits ${interp.detectedVehicleLabel}`);
    } else {
      // Wrong vehicle heavily penalised.
      score -= 0.35;
    }
  }

  // Position.
  if (interp.position && interp.position !== 'front-rear') {
    if (part.position === interp.position) {
      score += 0.1;
      reasons.push(`${interp.position} position`);
    } else if (part.position !== 'n/a') {
      score -= 0.18;
    }
  }

  // Year.
  if (interp.year) {
    if (interp.year >= part.yearFrom && interp.year <= part.yearTo) {
      score += 0.06;
    } else {
      score -= 0.12;
    }
  }

  // Slight quality preference so a sensible "best match" surfaces.
  const tier = part.specs.Tier ?? '';
  if (tier.includes('OEM')) score += 0.04;
  else if (tier.includes('Premium')) score += 0.03;

  if (!anySignal) return null;
  if (score <= 0) return null;

  // Blend engine confidence into the part score, clamp 0-1.
  const blended = Math.max(0, Math.min(0.99, score * 0.72 + interp.confidence * 0.28));

  return { part, score: blended, reasons };
}

export interface PartsSearchService {
  search(input: SearchInput): Promise<SearchResult>;
}

class LocalPartsSearch implements PartsSearchService {
  async search(input: SearchInput): Promise<SearchResult> {
    const interpretation = await interpret(input);

    const scored: ScoredPart[] = [];
    for (const part of parts) {
      const s = scorePart(part, interpretation, input);
      if (s) scored.push(s);
    }
    scored.sort((a, b) => b.score - a.score);

    // Deduplicate variant groups for the primary match list so we don't show
    // four tiers of the same part as four separate "matches".
    const seenGroup = new Set<string>();
    const matches: ScoredPart[] = [];
    for (const sp of scored) {
      const group = sp.part.id.split('__').slice(0, 2).join('__');
      if (seenGroup.has(group)) continue;
      seenGroup.add(group);
      matches.push(sp);
      if (matches.length >= 12) break;
    }

    const best = matches[0];

    // Alternatives = other tiers of the best match (real cross-tier options).
    let alternatives: ScoredPart[] = [];
    if (best) {
      alternatives = best.part.alternativeIds
        .map((id) => partById(id))
        .filter((p): p is Part => Boolean(p))
        .map((p) => ({
          part: p,
          score: best.score * 0.9,
          reasons: [`Alternative to ${best.part.name.split(' — ')[0]}`],
        }));
    }

    return {
      input,
      interpretation,
      best,
      matches,
      alternatives,
      ranAt: new Date().toISOString(),
    };
  }
}

export const partsSearchService: PartsSearchService = new LocalPartsSearch();

export const search = (input: SearchInput): Promise<SearchResult> =>
  partsSearchService.search(input);

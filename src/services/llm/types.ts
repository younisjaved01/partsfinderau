/**
 * LLM reasoning contract (shared by the frontend client and the server).
 *
 * IMPORTANT: the LLM is ONLY a reasoning/understanding layer. It structures the
 * user's request. It is NEVER the source of truth for part numbers, prices,
 * stock, ETA, suppliers, fitment or OEM data — those always come from the
 * catalogue / provider layer downstream of the Parts Intelligence Engine.
 *
 * The JSON schema enforced on the server (server/prompt.mjs) mirrors this type.
 */

export interface LlmVehicle {
  make: string | null;
  model: string | null;
  series: string | null;
  year: number | null;
  engine: string | null;
}

export interface LlmPart {
  /** Broad system, e.g. "Suspension", "Brakes". */
  category: string | null;
  /** Catalogue term, e.g. "Shock Absorber", "Brake Pads". */
  type: string | null;
  /** "Front" | "Rear" | null. */
  position: string | null;
  /** e.g. "Heavy Duty", "Standard", or null. */
  application: string | null;
}

/** Strongly-typed structured request the LLM returns. */
export interface PartsSearchRequest {
  vehicle: LlmVehicle;
  part: LlmPart;
  searchTerms: string[];
  confidence: number;
  missingInformation: string[];
}

export type LlmProviderName = 'openai' | 'mock';

/** What the frontend receives from POST /api/interpret. */
export interface InterpretResponse {
  provider: LlmProviderName;
  request?: PartsSearchRequest;
  /** User-friendly, non-sensitive notice when the AI layer was unavailable. */
  notice?: string;
  model?: string;
}

/** What GET /api/interpret reports (no secrets — model name only). */
export interface LlmStatus {
  provider: LlmProviderName;
  model?: string;
}

/**
 * System prompt + structured-output schema for the PARTS IQ reasoning layer.
 * Shared by the dev middleware and the production server. Plain ESM so Node can
 * run it directly (never bundled into the browser).
 */

// Default model — overridable via OPENAI_MODEL. Never hard-code elsewhere.
export const DEFAULT_MODEL = 'gpt-4o-mini';

// Compact taxonomy so the model maps onto OUR catalogue terms. This is guidance
// for structuring the request only; it is NOT the source of truth for data.
const TAXONOMY = `Supported vehicles (make / model / series or chassis):
- Toyota Hilux (chassis GUN126)
- Toyota LandCruiser 70 Series (incl. 76/78/79)
- Toyota LandCruiser 80 / 100 / 200 / 300 Series
- Toyota Prado (chassis GDJ150)
- Nissan Patrol Y61 (GU) / Y62
- Ford Ranger (PX)
- Mitsubishi Triton (MR)
- Isuzu D-Max (RG)
Systems (category): Brakes, Suspension, Steering, Driveline, Engine, Cooling, Electrical, Exhaust, Transmission, Clutch, Bearings, Filters, Body.`;

export const SYSTEM_PROMPT = `You are the reasoning layer for PARTS IQ, a professional Australian 4WD parts identification system.

Your ONLY job is to understand a mechanic's request and convert it into a structured parts search. You use Australian / 4WD workshop terminology.

${TAXONOMY}

Rules:
- Map slang and messy terms to catalogue terms. Examples:
  "shockey for a 79" -> Toyota LandCruiser, series "79 Series", Suspension, "Shock Absorber", position null.
  "front shockies for my 79" -> same, position "Front".
  "brake pads hilux gun126" -> Toyota Hilux, series "GUN126", Brakes, "Brake Pads".
  "clutch kit for a 2015 hilux" -> Toyota Hilux, year 2015, Clutch, "Clutch Kit".
- Do NOT guess unknown vehicle information — leave a field null if the user did not imply it.
- Do NOT invent part numbers, prices, stock, ETA, suppliers, fitment or OEM data. You never output those.
- If the request is vague (e.g. "the part that connects the shock to the diff"), give your best structured interpretation, keep confidence low, and list what is unclear in missingInformation.
- position must be exactly "Front", "Rear", or null.
- confidence is 0..1 reflecting how sure you are of the interpretation.
- searchTerms: 1-3 concise catalogue phrases a parts system could match (e.g. "front heavy duty shock absorber").
- Return ONLY the structured object.`;

// JSON schema for OpenAI Responses structured output (strict mode).
export const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    vehicle: {
      type: 'object',
      additionalProperties: false,
      properties: {
        make: { type: ['string', 'null'] },
        model: { type: ['string', 'null'] },
        series: { type: ['string', 'null'] },
        year: { type: ['integer', 'null'] },
        engine: { type: ['string', 'null'] },
      },
      required: ['make', 'model', 'series', 'year', 'engine'],
    },
    part: {
      type: 'object',
      additionalProperties: false,
      properties: {
        category: { type: ['string', 'null'] },
        type: { type: ['string', 'null'] },
        position: { type: ['string', 'null'] },
        application: { type: ['string', 'null'] },
      },
      required: ['category', 'type', 'position', 'application'],
    },
    searchTerms: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number' },
    missingInformation: { type: 'array', items: { type: 'string' } },
  },
  required: ['vehicle', 'part', 'searchTerms', 'confidence', 'missingInformation'],
};

/** Build the user message, folding in any structured vehicle context. */
export function buildUserMessage(text, vehicle) {
  let msg = `Mechanic request: "${text}"`;
  if (vehicle && (vehicle.make || vehicle.model)) {
    const ctx = [vehicle.make, vehicle.model, vehicle.series, vehicle.year, vehicle.engine]
      .filter(Boolean)
      .join(' ');
    if (ctx) msg += `\nKnown vehicle context (already selected by the user): ${ctx}`;
  }
  return msg;
}

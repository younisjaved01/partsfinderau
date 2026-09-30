/**
 * Server-side interpret handler — the ONLY place the OpenAI API key is used.
 * Runs in the Vite dev middleware and in the production server. Never bundled
 * into the browser.
 *
 * Provider selection:
 *   LLM_PROVIDER=openai  + OPENAI_API_KEY  -> real OpenAI reasoning
 *   LLM_PROVIDER=mock    (or no key)       -> tells the frontend to use its mock
 *
 * The OpenAI call uses the current Responses API with strict JSON-schema
 * structured output. The model is configurable via OPENAI_MODEL.
 */

import { SYSTEM_PROMPT, RESPONSE_SCHEMA, DEFAULT_MODEL, buildUserMessage } from './prompt.mjs';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const REQUEST_TIMEOUT_MS = 12000;

function resolveConfig(env) {
  const apiKey = env.OPENAI_API_KEY || '';
  const explicit = (env.LLM_PROVIDER || '').toLowerCase();
  // Default to openai only when a key exists; otherwise mock.
  const provider = explicit === 'openai' ? 'openai' : explicit === 'mock' ? 'mock' : apiKey ? 'openai' : 'mock';
  const model = env.OPENAI_MODEL || DEFAULT_MODEL;
  return { provider, model, apiKey };
}

/** Public: what GET /api/interpret reports (no secrets). */
export function statusInfo(env) {
  const { provider, model, apiKey } = resolveConfig(env);
  const active = provider === 'openai' && apiKey;
  return { provider: active ? 'openai' : 'mock', ...(active ? { model } : {}) };
}

function clamp01(n) {
  const x = typeof n === 'number' && isFinite(n) ? n : 0.5;
  return Math.max(0, Math.min(1, x));
}

/** Coerce arbitrary parsed JSON into a safe PartsSearchRequest shape. */
function coerceRequest(o) {
  const v = o?.vehicle ?? {};
  const p = o?.part ?? {};
  const str = (x) => (typeof x === 'string' && x.trim() ? x.trim() : null);
  const pos = str(p.position);
  return {
    vehicle: {
      make: str(v.make),
      model: str(v.model),
      series: str(v.series),
      year: Number.isFinite(v.year) ? v.year : null,
      engine: str(v.engine),
    },
    part: {
      category: str(p.category),
      type: str(p.type),
      position: pos === 'Front' || pos === 'Rear' ? pos : null,
      application: str(p.application),
    },
    searchTerms: Array.isArray(o?.searchTerms) ? o.searchTerms.filter((s) => typeof s === 'string').slice(0, 5) : [],
    confidence: clamp01(o?.confidence),
    missingInformation: Array.isArray(o?.missingInformation)
      ? o.missingInformation.filter((s) => typeof s === 'string').slice(0, 8)
      : [],
  };
}

/** Extract the JSON string from a Responses API payload (SDK-independent). */
function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text) return data.output_text;
  const out = Array.isArray(data?.output) ? data.output : [];
  for (const item of out) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if ((c?.type === 'output_text' || c?.type === 'text') && typeof c?.text === 'string') return c.text;
    }
  }
  return '';
}

async function callOpenAI({ text, vehicle, apiKey, model }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(text, vehicle) },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'parts_search_request',
            schema: RESPONSE_SCHEMA,
            strict: true,
          },
        },
        temperature: 0.1,
        max_output_tokens: 600,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`);
    }
    const data = await res.json();
    const jsonStr = extractOutputText(data);
    if (!jsonStr) throw new Error('OpenAI returned no structured output');
    return coerceRequest(JSON.parse(jsonStr));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Handle a POST body (string). Returns { status, json } — never throws to the
 * caller, so the app never crashes on an LLM failure.
 */
export async function handleInterpret(bodyString, env) {
  const { provider, model, apiKey } = resolveConfig(env);
  if (provider !== 'openai' || !apiKey) {
    return { status: 200, json: { provider: 'mock' } };
  }
  let body = {};
  try {
    body = bodyString ? JSON.parse(bodyString) : {};
  } catch {
    return { status: 400, json: { provider: 'mock', notice: 'Invalid request.' } };
  }
  const text = typeof body.text === 'string' ? body.text : '';
  if (!text.trim()) return { status: 200, json: { provider: 'mock' } };

  try {
    const request = await callOpenAI({ text, vehicle: body.vehicle, apiKey, model });
    return { status: 200, json: { provider: 'openai', model, request } };
  } catch (err) {
    // Log technical detail server-side only; never leak to the browser.
    console.error('[PARTS IQ] OpenAI interpret failed:', err?.message || err);
    return {
      status: 200,
      json: {
        provider: 'mock',
        notice: 'AI reasoning is temporarily unavailable — using offline interpretation.',
      },
    };
  }
}

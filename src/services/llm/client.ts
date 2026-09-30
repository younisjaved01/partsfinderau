import type { SearchInput } from '@/types';
import type { InterpretResponse, PartsSearchRequest, LlmStatus } from './types';

/**
 * Frontend LLM client — the ONLY thing the browser knows about the LLM. It
 * talks to our own backend (`/api/interpret`), never to OpenAI directly, so the
 * API key is never present in the browser. If the backend is absent (e.g. the
 * static GitHub Pages build) or returns the mock provider, this resolves to
 * null and the engine falls back to the local mock interpretation.
 */

const TIMEOUT_MS = 12000;

export async function requestLlmInterpretation(
  text: string,
  vehicle?: SearchInput['vehicle'],
): Promise<{ request: PartsSearchRequest; model?: string } | null> {
  if (!text.trim()) return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, vehicle }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    // Guard against static hosts returning HTML for /api/interpret.
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) return null;
    const data = (await res.json()) as InterpretResponse;
    if (data.provider === 'openai' && data.request) {
      return { request: data.request, model: data.model };
    }
    return null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

let cachedStatus: LlmStatus | null = null;

/** Reports whether the backend has a real LLM provider configured (no secrets). */
export async function getLlmStatus(): Promise<LlmStatus> {
  if (cachedStatus) return cachedStatus;
  try {
    const res = await fetch('/api/interpret', { method: 'GET' });
    if (res.ok && (res.headers.get('content-type') ?? '').includes('application/json')) {
      cachedStatus = (await res.json()) as LlmStatus;
      return cachedStatus;
    }
  } catch {
    /* ignore */
  }
  cachedStatus = { provider: 'mock' };
  return cachedStatus;
}

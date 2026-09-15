/**
 * FUTURE INTEGRATION SEAMS (§26)
 * ------------------------------------------------------------------
 * The prototype ships with local mock implementations everywhere. This file
 * documents the provider interfaces we will implement against real services,
 * plus a registry so a real provider can be bound at startup without touching
 * calling code.
 *
 * NONE of these are implemented yet — they are the contract, on purpose.
 */

import type { Interpretation, SearchInput } from '@/types';

// --- LLM / reasoning provider (OpenAI, Claude, Gemini, ...) ---------------
export interface LlmProvider {
  name: string;
  /** Structured extraction of a parts query from free text. */
  interpretText(text: string, context?: Record<string, unknown>): Promise<Partial<Interpretation>>;
}

// --- Vision provider (part photo → category / features) -------------------
export interface VisionProvider {
  name: string;
  analyseImage(imageData: string): Promise<{
    category?: string;
    labels: { label: string; confidence: number }[];
    markings?: string[];
  }>;
}

// --- Voice transcription provider -----------------------------------------
export interface VoiceProvider {
  name: string;
  transcribe(audio: Blob): Promise<{ transcript: string; confidence: number }>;
}

// --- Embeddings / vector search over the catalogue ------------------------
export interface EmbeddingProvider {
  name: string;
  embed(text: string): Promise<number[]>;
  similaritySearch(vector: number[], k: number): Promise<{ partId: string; score: number }[]>;
}

// --- External catalogue / TecDoc-style fitment ----------------------------
export interface CatalogueProvider {
  name: string;
  lookupByOem(oem: string): Promise<{ partId: string }[]>;
  fitmentsForVin(vin: string): Promise<{ vehicleId: string; year: number }[]>;
}

// --- ERP / inventory / supplier APIs --------------------------------------
export interface InventoryProvider {
  name: string;
  liveStock(partNumber: string): Promise<{ supplierId: string; stock: number; price: number }[]>;
}

export interface SupplierApiProvider {
  name: string;
  submitRfq(payload: unknown): Promise<{ ok: boolean; reference: string }>;
}

// --- VIN / registration lookup --------------------------------------------
export interface VinProvider {
  name: string;
  decode(vinOrRego: string): Promise<{ make: string; model: string; year: number; engine?: string }>;
}

/**
 * Central registry. Everything defaults to `null` (→ the local mock path is
 * used). Wiring a real provider is a one-line assignment at app startup.
 */
export interface IntegrationRegistry {
  llm: LlmProvider | null;
  vision: VisionProvider | null;
  voice: VoiceProvider | null;
  embeddings: EmbeddingProvider | null;
  catalogue: CatalogueProvider | null;
  inventory: InventoryProvider | null;
  supplierApi: SupplierApiProvider | null;
  vin: VinProvider | null;
}

export const integrations: IntegrationRegistry = {
  llm: null,
  vision: null,
  voice: null,
  embeddings: null,
  catalogue: null,
  inventory: null,
  supplierApi: null,
  vin: null,
};

/** True when running purely on mock logic (drives the "DEMO MODE" badge). */
export const isDemoMode = (): boolean =>
  Object.values(integrations).every((p) => p === null);

/** Convenience for the seam docs / settings screen. */
export const integrationStatus = (): { key: keyof IntegrationRegistry; connected: boolean }[] =>
  (Object.keys(integrations) as (keyof IntegrationRegistry)[]).map((key) => ({
    key,
    connected: integrations[key] !== null,
  }));

export type { SearchInput };

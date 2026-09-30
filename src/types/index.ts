/**
 * PARTS IQ — Core domain model.
 *
 * These types mirror the eventual relational schema (see §19 of the product
 * spec: parts, vehicles, fitments, brands, suppliers, inventory,
 * cross_references, rfqs, quotes, orders, search_history, users).
 *
 * The prototype fulfils them from local mock data, but every service is typed
 * against these interfaces so the storage layer can be swapped for
 * PostgreSQL / Supabase without touching the UI.
 */

export type ID = string;

// ---------------------------------------------------------------------------
// Vehicles & fitment
// ---------------------------------------------------------------------------

export interface Vehicle {
  id: ID;
  make: string;
  model: string;
  series?: string;
  /** Manufacturer chassis / body code (e.g. Hilux GUN126), when known. */
  chassis?: string;
  yearFrom: number;
  yearTo: number;
  engines: string[];
  transmissions: string[];
  /** Common informal names a user might type: "79", "80 series", "landy". */
  aliases: string[];
}

export type PartPosition = 'front' | 'rear' | 'front-rear' | 'n/a';
export type PartSide = 'left' | 'right' | 'left-right' | 'n/a';

export interface Fitment {
  vehicleId: ID;
  yearFrom: number;
  yearTo: number;
  engine?: string;
  position?: PartPosition;
  side?: PartSide;
  /** How confident the catalogue is in this fitment (0-1). */
  confidence: number;
  note?: string;
}

// ---------------------------------------------------------------------------
// Brands, suppliers, inventory
// ---------------------------------------------------------------------------

export type QualityTier = 'oem' | 'premium' | 'standard' | 'budget';

export interface Brand {
  id: ID;
  name: string;
  tier: QualityTier;
  country: string;
}

export interface Supplier {
  id: ID;
  name: string;
  location: string;
  rating: number; // 0-5
  responseTimeHours: number;
  fulfilment: string[]; // e.g. ['same-day', 'next-day']
  logoColor: string; // brand accent used in UI avatars
}

export interface InventoryRecord {
  supplierId: ID;
  warehouse: string;
  stock: number;
  price: number; // AUD
  leadTime: string; // human readable
  quality: QualityTier;
}

// ---------------------------------------------------------------------------
// Cross references & parts
// ---------------------------------------------------------------------------

export interface CrossReference {
  brandId: ID;
  partNumber: string;
  quality: QualityTier;
  note?: string;
}

export type PartCategory =
  | 'Brake'
  | 'Suspension'
  | 'Steering'
  | 'Engine'
  | 'Cooling'
  | 'Electrical'
  | 'Filters'
  | 'Clutch'
  | 'Transmission'
  | 'Driveline'
  | 'Bearings'
  | 'Body'
  | 'Exhaust';

export interface Part {
  id: ID;
  partNumber: string;
  oemNumber: string;
  name: string;
  brandId: ID;
  category: PartCategory;
  description: string;
  /** Informal / colloquial names used to match messy queries. */
  aliases: string[];
  fitments: Fitment[];
  yearFrom: number;
  yearTo: number;
  engine?: string;
  position: PartPosition;
  side: PartSide;
  specs: Record<string, string>;
  /** Base list price in AUD; suppliers may differ. */
  price: number;
  inventory: InventoryRecord[];
  /** Illustrative icon key (we don't ship real part photos in the prototype). */
  image: string;
  /** IDs of alternative parts (same function, different tier). */
  alternativeIds: ID[];
  crossReferences: CrossReference[];
}

// ---------------------------------------------------------------------------
// RFQ / Quotes / Orders
// ---------------------------------------------------------------------------

export type RfqStatus = 'open' | 'partial' | 'complete' | 'awarded' | 'cancelled';
export type QuoteStatus = 'waiting' | 'quoted' | 'declined' | 'expired';

export interface Quote {
  id: ID;
  supplierId: ID;
  status: QuoteStatus;
  price?: number;
  stock?: number;
  leadTime?: string;
  respondedAt?: string;
  note?: string;
}

export interface Rfq {
  id: ID;
  reference: string; // e.g. "RFQ #10482"
  partId: ID;
  partName: string;
  quantity: number;
  delivery: string;
  createdAt: string;
  status: RfqStatus;
  quotes: Quote[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: ID;
  reference: string;
  partId: ID;
  partName: string;
  supplierId: ID;
  quantity: number;
  unitPrice: number;
  status: OrderStatus;
  createdAt: string;
  eta: string;
}

// ---------------------------------------------------------------------------
// Quote basket (parts staged before an RFQ is sent)
// ---------------------------------------------------------------------------

export interface QuoteLine {
  partId: ID;
  quantity: number;
  addedAt: string;
}

// ---------------------------------------------------------------------------
// Search intelligence
// ---------------------------------------------------------------------------

export type SearchModality = 'text' | 'image' | 'voice' | 'partNumber' | 'vehicle';

export interface VehicleQuery {
  make?: string;
  model?: string;
  series?: string;
  year?: number;
  engine?: string;
  transmission?: string;
}

/** The unified input accepted by the Parts Intelligence Engine (§17). */
export interface SearchInput {
  text?: string;
  /** Object URL / data URL of an uploaded image (prototype does not analyse pixels). */
  image?: string;
  imageName?: string;
  voiceTranscript?: string;
  vehicle?: VehicleQuery;
  partNumber?: string;
}

export interface ClarificationOption {
  label: string;
  /** A partial SearchInput patch applied when the user picks this option. */
  patch: Partial<SearchInput>;
}

export interface Clarification {
  question: string;
  field: string;
  options: ClarificationOption[];
}

/** Structured interpretation returned by the intelligence engine. */
export interface Interpretation {
  detectedVehicle?: Vehicle;
  detectedVehicleLabel?: string;
  detectedCategory?: PartCategory;
  detectedPartTerm?: string;
  position?: PartPosition;
  side?: PartSide;
  year?: number;
  engine?: string;
  confidence: number; // 0-1
  /** Human-readable trace of how the engine read the query. */
  reasoning: string[];
  modalities: SearchModality[];
  clarification?: Clarification;
  /** Normalised phrases the engine mapped colloquial terms onto. */
  normalisedTerms: { from: string; to: string }[];
  /** Which reasoning provider produced this: real LLM ('openai') or 'offline' mock. */
  aiProvider?: 'openai' | 'offline';
  /** Model name when a real LLM was used (never a secret). */
  aiModel?: string;
  /** Structured gaps the LLM flagged (e.g. "position unknown"). */
  missingInformation?: string[];
}

export interface ScoredPart {
  part: Part;
  score: number; // 0-1 relevance/confidence
  reasons: string[];
}

export interface SearchResult {
  input: SearchInput;
  interpretation: Interpretation;
  best?: ScoredPart;
  matches: ScoredPart[];
  alternatives: ScoredPart[];
  ranAt: string;
}

export interface SearchHistoryEntry {
  id: ID;
  query: string;
  modalities: SearchModality[];
  imageName?: string;
  vehicleLabel?: string;
  matchedPartId?: ID;
  matchedPartName?: string;
  confidence: number;
  createdAt: string;
  input: SearchInput;
}

// ---------------------------------------------------------------------------
// Fitment check result (§8)
// ---------------------------------------------------------------------------

export type FitmentVerdict = 'fits' | 'possible' | 'no-fit' | 'unknown';

export interface FitmentCheck {
  verdict: FitmentVerdict;
  confidence: number;
  reasons: string[];
}

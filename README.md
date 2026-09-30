# PARTS IQ

**Find any part. From any clue.**

An AI-powered automotive parts discovery and sourcing platform — a working
prototype. PARTS IQ combines an **AI parts-intelligence engine**, an
**automotive parts catalogue**, and a **supplier marketplace** into one piece
of professional software for mechanics, workshops, parts interpreters,
spare-parts stores, dealerships and fleet teams.

The core idea: a user may not know the exact part number. They might have a
photo, a broken part, a voice description, messy text, a partial number, a
VIN/rego, or just a make/model/year. PARTS IQ uses **whatever clue is
available** to identify the right part, then shows compatible vehicles, OEM
equivalents, aftermarket alternatives, suppliers, stock, price, delivery and
confidence — through to request-for-quote and ordering.

> This is a prototype. The intelligence engine runs on **local mock logic** by
> default (Demo Mode). Clean provider interfaces are in place so real Vision /
> Voice / LLM / catalogue / ERP / supplier APIs can be connected later without
> changing the UI.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check (tsc -b) + production build
npm run preview    # serve the production build (static, no API)
npm run start      # run the production server (dist + /api) — node server.mjs
npm run serve      # build + start in one step
npm run typecheck  # types only
```

No API keys, environment variables or external services are required — the app
boots straight into **Demo Mode** with the offline reasoning engine.

## AI reasoning (OpenAI) — optional

PARTS IQ can use a **real OpenAI model** as its reasoning layer. The LLM's only
job is to *understand and structure* the request ("shockey for a 79" → Toyota
LandCruiser 79 Series · Suspension · Shock Absorber). It is **never** the source
of truth for part numbers, prices, stock, ETA, suppliers, fitment or OEM data —
those always come from the catalogue / provider layer.

### How it works

```
User → PARTS IQ frontend → /api/interpret (our backend) → OpenAI Responses API
     → structured PartsSearchRequest → Parts Intelligence Engine
     → catalogue / provider data → verified PARTS IQ result
```

- The browser only ever calls **our own** `/api/interpret`, never OpenAI. The
  API key lives **only** on the server (Vite dev middleware in dev, `server.mjs`
  in production) and is never in the client bundle.
- The backend calls the **OpenAI Responses API** with **strict JSON-schema
  structured output** (`server/prompt.mjs`, `server/interpretHandler.mjs`).
- The frontend engine (`src/services/partsIntelligence.ts`) grounds the LLM's
  structured output onto our catalogue lexicon, then runs the existing scoring,
  fitment and catalogue search unchanged.

### Configure OpenAI locally

```bash
cp .env.example .env      # .env is git-ignored — never commit it
# edit .env:
#   OPENAI_API_KEY=sk-...        (your key; blank = Demo Mode)
#   OPENAI_MODEL=gpt-4o-mini     (any current model; optional)
#   LLM_PROVIDER=openai          (or "mock"; optional)
npm run dev                # dev middleware serves /api/interpret with your key
```

When a key is present the header shows an **AI · <model>** badge; without one it
shows **Demo Mode**.

### Environment variables (server-side only)

| Variable | Purpose | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI key — **server-side only**, blank = Demo Mode | _(none)_ |
| `OPENAI_MODEL` | Model for request understanding | `gpt-4o-mini` |
| `LLM_PROVIDER` | Force `openai` or `mock` | `openai` if key set, else `mock` |
| `PORT` | Production server port (`server.mjs`) | `4173` |

None are prefixed `VITE_`, so none are ever exposed to the browser.

### Mock vs OpenAI providers

- **Mock (offline)** — `computeLocal()` in `partsIntelligence.ts`: deterministic
  alias/keyword interpretation. Always available, zero cost, powers Demo Mode.
- **OpenAI** — real reasoning via the backend. Used only when a key is set; on
  any error or timeout it falls back to the mock so the app never breaks.

### Adding another provider (e.g. Claude) later

Implement a sibling of the OpenAI call in `server/interpretHandler.mjs` (same
`PartsSearchRequest` shape and JSON schema), select it via `LLM_PROVIDER`, and
nothing on the frontend changes — it consumes the same `/api/interpret`
contract (`src/services/llm/types.ts`).

### Security notes

The key must stay server-side because anything in the frontend bundle (or a
`VITE_`-prefixed variable) is shipped to and readable by every visitor. Keeping
it in `server.mjs` / the dev middleware means it never leaves your machine/host.
`.env` is git-ignored; only `.env.example` (no secret) is committed.

> Data ownership stays clear: **LLM = understands the request**, **Catalogue =
> source of truth**, **Vehicle/rego provider = vehicle identification**,
> **Supplier/ERP = stock, price, availability**, **future OEM provider = OEM
> references**. OEM/parts data does **not** come from OpenAI.

## Try it (Demo Mode)

On the home screen, run any of the built-in sample searches:

1. `Front brake pads for 2019 Hilux` — clean text + vehicle, high-confidence match
2. `"Shockey for a 79"` — slang → shock absorber for LandCruiser 79 Series, asks front/rear
3. `Rear leaf spring for Patrol Y61`
4. `Oil filter for Prado`
5. **Upload sample brake pad image** — simulated vision recognises a disc-brake component
6. `"that dust filter box thing"` → air filter

Or type your own messy description, add a vehicle, attach a photo, or record
voice — all at once. There is **one** unified engine behind every input.

---

## What's included

| Capability | Where |
|---|---|
| Multimodal search (photo · voice · text · part number · vehicle) | `components/SearchConsole.tsx` |
| AI interpretation + confidence + clarification (front/rear) | `pages/SearchResults.tsx`, `services/partsIntelligence.ts` |
| Colloquial → catalogue term translation ("shocky" → shock absorber) | `services/partsIntelligence.ts`, `data/partTemplates.ts` |
| Ranked results, best match, other matches, alternatives | `pages/SearchResults.tsx`, `services/partsSearch.ts` |
| Part detail: specs, cross references, suppliers, fitment | `pages/PartDetail.tsx` |
| Vehicle fitment check with confidence (never blind) | `services/vehicleFitment.ts` |
| OEM ↔ aftermarket cross references | `pages/PartDetail.tsx` |
| Supplier marketplace comparison | `services/suppliers.ts`, `pages/Suppliers.tsx` |
| Request for Quote (RFQ) workflow + live responses | `components/RfqModal.tsx`, `services/rfq.ts` |
| Quotes dashboard, award best offer → order | `pages/Rfqs.tsx` |
| Quote basket | `pages/Quotes.tsx` |
| Inventory dashboard + filters | `pages/Inventory.tsx`, `services/inventory.ts` |
| Supplier-facing portal | `pages/SupplierPortal.tsx` |
| Dashboard, orders, search history | `pages/Dashboard.tsx`, `Orders.tsx`, `History.tsx` |
| Mock catalogue (1,100+ parts, 12 vehicles, 13 categories) | `data/` |
| Future-integration seams | `services/integrations.ts`, `pages/Settings.tsx` |

---

## Architecture

The product is deliberately **modular**: business logic lives in a service
layer, not in React components, so mock functionality can be progressively
replaced with real AI and real data.

```
src/
  types/            Domain model (mirrors the eventual SQL schema)
  data/             Mock database — generated deterministically
    brands.ts       Fictional brands (OEM / premium / standard / budget)
    suppliers.ts    Fictional suppliers
    vehicles.ts     Supported vehicles + colloquial aliases ("79", "80 series")
    partTemplates.ts Part "kinds" with aliases, specs, fitment rules
    parts.ts        Generator → 1,100+ parts across templates × vehicles × tiers
    demoScenarios.ts The Demo Mode sample searches
  services/         The logic layer (§18)
    partsIntelligence.ts  ← the Parts Intelligence Engine (§17)
    partsSearch.ts        ← ranking / scoring
    vehicleFitment.ts     ← compatibility with confidence (§8)
    inventory.ts          ← stock rollups + filtering
    suppliers.ts          ← marketplace offers
    rfq.ts                ← RFQ + simulated supplier responses
    integrations.ts       ← provider seams for real APIs (§26)
  store/            App state (quote basket, RFQs, orders, history) + localStorage
  components/       Layout, SearchConsole, PartCard, RfqModal, icons, UI primitives
  pages/            One file per screen
```

### The Parts Intelligence Engine

`services/partsIntelligence.ts` exposes a single `interpret(input)` entry point
behind the `PartsIntelligence` interface. It accepts the unified input:

```ts
interpret({ text, image, imageName, voiceTranscript, vehicle, partNumber })
```

and returns a structured `Interpretation`:

```ts
{ detectedVehicle, detectedCategory, detectedPartTerm, position, side,
  year, engine, confidence, reasoning[], modalities[], clarification?,
  normalisedTerms[] }
```

The prototype implements this with transparent, deterministic mock logic (alias
lexicon + keyword detection + a simulated-vision placeholder). The UI is built
against the **interface**, never the mock — so a real model can be bound in one
place.

### Future integrations (`services/integrations.ts`)

A registry of provider interfaces — `LlmProvider`, `VisionProvider`,
`VoiceProvider`, `EmbeddingProvider`, `CatalogueProvider` (TecDoc-style),
`InventoryProvider` (ERP), `SupplierApiProvider`, `VinProvider` — all default to
`null` (mock path). `isDemoMode()` drives the "Demo Mode" badge. The Settings
screen visualises which seams are connected vs mocked.

### Data model → database

Types in `src/types` are shaped for a straightforward migration from mock JSON
to PostgreSQL / Supabase, around these entities: `parts`, `vehicles`,
`fitments`, `brands`, `suppliers`, `inventory`, `cross_references`, `rfqs`,
`quotes`, `orders`, `search_history`, `users`.

---

## Design

An in-house identity: **industrial charcoal + molten-orange** on a dark
background, thin borders, large data cards, monospaced part numbers, minimal
motion. Desktop-first (built for a parts counter) and responsive down to
mobile, where photo/voice/text stay one tap away. It does **not** copy any
existing product's branding, copy or layout.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · React Router. State via React
context + `useReducer`, persisted to `localStorage` so a demo survives reloads.

## Notes & limitations

- Image search is a **simulated** vision placeholder — it does not analyse
  pixels until a real vision API is connected.
- Voice uses the browser Web Speech API when available, otherwise a simulated
  transcript.
- All part numbers, brands and suppliers are **clearly fictional / mock**.
- Prices are in AUD.

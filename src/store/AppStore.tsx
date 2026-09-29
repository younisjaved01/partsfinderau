import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  QuoteLine,
  Rfq,
  Order,
  SearchHistoryEntry,
  Part,
  SearchResult,
  VehicleQuery,
} from '@/types';
import { partById } from '@/data/parts';
import { createRfq, simulateQuote, rollupStatus } from '@/services/rfq';
import { bestPrice } from '@/services/inventory';
import { supplierById } from '@/data/suppliers';

/**
 * Global application state (quote basket, RFQs, orders, search history,
 * activity feed). Persisted to localStorage so a demo survives reloads.
 *
 * All mutations flow through action methods on the context so components never
 * reach into the reducer directly.
 */

interface ActivityItem {
  id: string;
  label: string;
  kind: 'search' | 'rfq' | 'quote' | 'order' | 'alternative';
  at: string;
}

interface AppState {
  quote: QuoteLine[];
  rfqs: Rfq[];
  orders: Order[];
  history: SearchHistoryEntry[];
  activity: ActivityItem[];
  searchesToday: number;
  /** Vehicle context that persists across the Find Part → Catalogue workflow. */
  activeVehicle: VehicleQuery | null;
}

type Action =
  | { type: 'ADD_TO_QUOTE'; partId: string; quantity: number }
  | { type: 'REMOVE_FROM_QUOTE'; partId: string }
  | { type: 'SET_QUOTE_QTY'; partId: string; quantity: number }
  | { type: 'CLEAR_QUOTE' }
  | { type: 'ADD_RFQ'; rfq: Rfq }
  | { type: 'SET_QUOTE_RESPONSE'; rfqId: string; supplierId: string; quote: Rfq['quotes'][number] }
  | { type: 'AWARD_RFQ'; rfqId: string; supplierId: string }
  | { type: 'CANCEL_RFQ'; rfqId: string }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'ADD_HISTORY'; entry: SearchHistoryEntry }
  | { type: 'PUSH_ACTIVITY'; item: ActivityItem }
  | { type: 'SET_ACTIVE_VEHICLE'; vehicle: VehicleQuery | null };

const STORAGE_KEY = 'parts-iq-state-v2';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function activity(kind: ActivityItem['kind'], label: string): ActivityItem {
  return { id: uid('act'), kind, label, at: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Seed data — makes the dashboard/RFQ/quote screens meaningful on first load.
// ---------------------------------------------------------------------------

function seedState(): AppState {
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();

  const hiluxPad = partById('brake-pad-front__veh-hilux__premium');
  const cruiserShock = partById('shock-front__veh-lc70__premium');

  const rfqs: Rfq[] = [];
  if (hiluxPad) {
    rfqs.push({
      id: 'seed-rfq-1',
      reference: 'RFQ #10480',
      partId: hiluxPad.id,
      partName: hiluxPad.name,
      quantity: 2,
      delivery: 'Standard',
      createdAt: iso(180),
      status: 'partial',
      quotes: [
        { id: 's1', supplierId: 'sup-outback', status: 'quoted', price: 89, stock: 23, leadTime: 'Same day', respondedAt: iso(178) },
        { id: 's2', supplierId: 'sup-torque', status: 'waiting' },
        { id: 's3', supplierId: 'sup-nationwide', status: 'declined', note: 'Out of stock', respondedAt: iso(160) },
      ],
    });
  }
  if (cruiserShock) {
    rfqs.push({
      id: 'seed-rfq-2',
      reference: 'RFQ #10481',
      partId: cruiserShock.id,
      partName: cruiserShock.name,
      quantity: 4,
      delivery: 'Express',
      createdAt: iso(90),
      status: 'complete',
      quotes: [
        { id: 's4', supplierId: 'sup-desert', status: 'quoted', price: 198, stock: 12, leadTime: '2–3 days', respondedAt: iso(80) },
        { id: 's5', supplierId: 'sup-outback', status: 'quoted', price: 205, stock: 6, leadTime: 'Next day', respondedAt: iso(75) },
        { id: 's6', supplierId: 'sup-metro', status: 'quoted', price: 189, stock: 3, leadTime: '2–3 days', respondedAt: iso(70) },
      ],
    });
  }

  const orders: Order[] = [];
  if (hiluxPad) {
    orders.push({
      id: 'seed-order-1',
      reference: 'ORD-20591',
      partId: hiluxPad.id,
      partName: hiluxPad.name,
      supplierId: 'sup-outback',
      quantity: 2,
      unitPrice: 89,
      status: 'shipped',
      createdAt: iso(1440),
      eta: 'Tomorrow',
    });
  }

  const history: SearchHistoryEntry[] = [];
  if (hiluxPad) {
    history.push({
      id: 'seed-h1',
      query: 'front brake pads for 2019 hilux',
      modalities: ['text', 'vehicle'],
      vehicleLabel: 'Toyota Hilux',
      matchedPartId: hiluxPad.id,
      matchedPartName: hiluxPad.name,
      confidence: 0.96,
      createdAt: iso(30),
      input: { text: 'front brake pads for 2019 hilux', vehicle: { make: 'Toyota', model: 'Hilux', year: 2019 } },
    });
  }
  history.push({
    id: 'seed-h2',
    query: 'shockey for a 79',
    modalities: ['text'],
    vehicleLabel: 'Toyota LandCruiser 70 Series',
    matchedPartId: cruiserShock?.id,
    matchedPartName: cruiserShock?.name,
    confidence: 0.88,
    createdAt: iso(55),
    input: { text: 'shockey for a 79' },
  });

  return {
    quote: hiluxPad ? [{ partId: hiluxPad.id, quantity: 2, addedAt: iso(10) }] : [],
    rfqs,
    orders,
    history,
    activity: [
      activity('order', 'Supplier shipped Hilux brake pads (ORD-20591)'),
      activity('quote', 'Metro Parts responded to RFQ #10481'),
      activity('search', 'Brake pad identified — Toyota Hilux'),
      activity('rfq', 'RFQ #10480 sent to 3 suppliers'),
    ],
    searchesToday: 7,
    activeVehicle: { make: 'Toyota', model: 'Hilux', year: 2021, engine: '2.8L Diesel' },
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* ignore */
  }
  return seedState();
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TO_QUOTE': {
      const existing = state.quote.find((l) => l.partId === action.partId);
      const quote = existing
        ? state.quote.map((l) =>
            l.partId === action.partId ? { ...l, quantity: l.quantity + action.quantity } : l,
          )
        : [...state.quote, { partId: action.partId, quantity: action.quantity, addedAt: new Date().toISOString() }];
      return { ...state, quote };
    }
    case 'REMOVE_FROM_QUOTE':
      return { ...state, quote: state.quote.filter((l) => l.partId !== action.partId) };
    case 'SET_QUOTE_QTY':
      return {
        ...state,
        quote: state.quote.map((l) =>
          l.partId === action.partId ? { ...l, quantity: Math.max(1, action.quantity) } : l,
        ),
      };
    case 'CLEAR_QUOTE':
      return { ...state, quote: [] };
    case 'ADD_RFQ':
      return { ...state, rfqs: [action.rfq, ...state.rfqs] };
    case 'SET_QUOTE_RESPONSE': {
      const rfqs = state.rfqs.map((r) => {
        if (r.id !== action.rfqId) return r;
        const quotes = r.quotes.map((q) => (q.supplierId === action.supplierId ? action.quote : q));
        const updated = { ...r, quotes };
        return { ...updated, status: rollupStatus(updated) };
      });
      return { ...state, rfqs };
    }
    case 'AWARD_RFQ': {
      const rfq = state.rfqs.find((r) => r.id === action.rfqId);
      if (!rfq) return state;
      const quote = rfq.quotes.find((q) => q.supplierId === action.supplierId);
      const order: Order = {
        id: uid('order'),
        reference: `ORD-${Math.floor(20000 + Math.random() * 9999)}`,
        partId: rfq.partId,
        partName: rfq.partName,
        supplierId: action.supplierId,
        quantity: rfq.quantity,
        unitPrice: quote?.price ?? 0,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        eta: quote?.leadTime ?? 'TBC',
      };
      const rfqs = state.rfqs.map((r) =>
        r.id === action.rfqId ? { ...r, status: 'awarded' as const } : r,
      );
      const item = activity('order', `Awarded ${rfq.reference} → order ${order.reference}`);
      return {
        ...state,
        rfqs,
        orders: [order, ...state.orders],
        activity: [item, ...state.activity].slice(0, 30),
      };
    }
    case 'CANCEL_RFQ':
      return {
        ...state,
        rfqs: state.rfqs.map((r) => (r.id === action.rfqId ? { ...r, status: 'cancelled' as const } : r)),
      };
    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };
    case 'ADD_HISTORY':
      return {
        ...state,
        history: [action.entry, ...state.history].slice(0, 50),
        searchesToday: state.searchesToday + 1,
      };
    case 'PUSH_ACTIVITY':
      return { ...state, activity: [action.item, ...state.activity].slice(0, 30) };
    case 'SET_ACTIVE_VEHICLE':
      return { ...state, activeVehicle: action.vehicle };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  addToQuote: (partId: string, quantity?: number) => void;
  removeFromQuote: (partId: string) => void;
  setQuoteQty: (partId: string, quantity: number) => void;
  clearQuote: () => void;
  quoteCount: number;
  sendRfq: (part: Part, quantity: number, delivery: string, supplierIds: string[]) => Rfq;
  respondRfq: (rfqId: string, supplierId: string, part: Part) => void;
  awardRfq: (rfqId: string, supplierId: string) => void;
  cancelRfq: (rfqId: string) => void;
  recordSearch: (result: SearchResult) => void;
  buyNow: (part: Part, supplierId: string, quantity: number, unitPrice: number) => Order;
  activeVehicle: VehicleQuery | null;
  setActiveVehicle: (vehicle: VehicleQuery | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [state]);

  const addToQuote = useCallback((partId: string, quantity = 1) => {
    dispatch({ type: 'ADD_TO_QUOTE', partId, quantity });
    const p = partById(partId);
    dispatch({ type: 'PUSH_ACTIVITY', item: activity('quote', `Added ${p?.name.split(' — ')[0] ?? 'part'} to quote`) });
  }, []);

  const removeFromQuote = useCallback((partId: string) => dispatch({ type: 'REMOVE_FROM_QUOTE', partId }), []);
  const setQuoteQty = useCallback((partId: string, quantity: number) => dispatch({ type: 'SET_QUOTE_QTY', partId, quantity }), []);
  const clearQuote = useCallback(() => dispatch({ type: 'CLEAR_QUOTE' }), []);

  const sendRfq = useCallback(
    (part: Part, quantity: number, delivery: string, supplierIds: string[]) => {
      const rfq = createRfq(part, quantity, delivery, supplierIds);
      dispatch({ type: 'ADD_RFQ', rfq });
      dispatch({ type: 'PUSH_ACTIVITY', item: activity('rfq', `${rfq.reference} sent to ${supplierIds.length} suppliers`) });
      // Simulate staggered supplier responses.
      supplierIds.forEach((supplierId, i) => {
        const delay = 1500 + i * 1800 + Math.random() * 2500;
        window.setTimeout(() => {
          const q = simulateQuote(part, supplierId);
          dispatch({ type: 'SET_QUOTE_RESPONSE', rfqId: rfq.id, supplierId, quote: q });
          const sup = supplierById(supplierId);
          dispatch({
            type: 'PUSH_ACTIVITY',
            item: activity('quote', `${sup?.name ?? 'Supplier'} responded to ${rfq.reference}`),
          });
        }, delay);
      });
      return rfq;
    },
    [],
  );

  const respondRfq = useCallback((rfqId: string, supplierId: string, part: Part) => {
    const quote = simulateQuote(part, supplierId);
    // Force a positive quote when a supplier chooses to respond in the portal.
    if (quote.status === 'declined') {
      quote.status = 'quoted';
      quote.price = quote.price ?? Math.round(bestPrice(part));
      quote.stock = quote.stock ?? Math.floor(Math.random() * 15) + 1;
      quote.leadTime = quote.leadTime ?? 'Next day';
    }
    dispatch({ type: 'SET_QUOTE_RESPONSE', rfqId, supplierId, quote });
    const sup = supplierById(supplierId);
    dispatch({ type: 'PUSH_ACTIVITY', item: activity('quote', `${sup?.name ?? 'You'} quoted ${quote.price ? `$${quote.price}` : ''}`) });
  }, []);

  const awardRfq = useCallback((rfqId: string, supplierId: string) => {
    dispatch({ type: 'AWARD_RFQ', rfqId, supplierId });
  }, []);

  const cancelRfq = useCallback((rfqId: string) => dispatch({ type: 'CANCEL_RFQ', rfqId }), []);

  const recordSearch = useCallback((result: SearchResult) => {
    const { input, interpretation, best } = result;
    const entry: SearchHistoryEntry = {
      id: uid('h'),
      query:
        input.text ||
        input.voiceTranscript ||
        input.partNumber ||
        (input.imageName ? `Image: ${input.imageName}` : 'Vehicle search'),
      modalities: interpretation.modalities,
      imageName: input.imageName,
      vehicleLabel: interpretation.detectedVehicleLabel,
      matchedPartId: best?.part.id,
      matchedPartName: best?.part.name,
      confidence: best?.score ?? interpretation.confidence,
      createdAt: new Date().toISOString(),
      input,
    };
    dispatch({ type: 'ADD_HISTORY', entry });
    if (best) {
      dispatch({
        type: 'PUSH_ACTIVITY',
        item: activity('search', `${best.part.name.split(' — ')[0]} identified`),
      });
    }
  }, []);

  const buyNow = useCallback(
    (part: Part, supplierId: string, quantity: number, unitPrice: number) => {
      const sup = supplierById(supplierId);
      const order: Order = {
        id: uid('order'),
        reference: `ORD-${Math.floor(20000 + Math.random() * 9999)}`,
        partId: part.id,
        partName: part.name,
        supplierId,
        quantity,
        unitPrice,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        eta: sup ? `${sup.responseTimeHours}h dispatch` : 'TBC',
      };
      dispatch({ type: 'ADD_ORDER', order });
      dispatch({ type: 'PUSH_ACTIVITY', item: activity('order', `Order ${order.reference} placed`) });
      return order;
    },
    [],
  );

  const setActiveVehicle = useCallback(
    (vehicle: VehicleQuery | null) => dispatch({ type: 'SET_ACTIVE_VEHICLE', vehicle }),
    [],
  );

  const quoteCount = state.quote.reduce((n, l) => n + l.quantity, 0);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      addToQuote,
      removeFromQuote,
      setQuoteQty,
      clearQuote,
      quoteCount,
      sendRfq,
      respondRfq,
      awardRfq,
      cancelRfq,
      recordSearch,
      buyNow,
      activeVehicle: state.activeVehicle,
      setActiveVehicle,
    }),
    [state, addToQuote, removeFromQuote, setQuoteQty, clearQuote, quoteCount, sendRfq, respondRfq, awardRfq, cancelRfq, recordSearch, buyNow, setActiveVehicle],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}

/** Derived dashboard metrics. */
export function useDashboardMetrics() {
  const { state } = useAppStore();
  const successfulMatches = state.history.filter((h) => (h.confidence ?? 0) >= 0.7).length;
  const activeRfqs = state.rfqs.filter((r) => r.status === 'open' || r.status === 'partial').length;

  // Potential savings: for each order, gap between an OEM-tier equivalent and paid price.
  let potentialSavings = 0;
  for (const order of state.orders) {
    const part = partById(order.partId);
    if (!part) continue;
    const oemAlt = part.alternativeIds
      .map((id) => partById(id))
      .find((p) => p?.specs.Tier?.includes('OEM'));
    const oemPrice = oemAlt ? bestPrice(oemAlt) : part.price * 1.5;
    potentialSavings += Math.max(0, (oemPrice - order.unitPrice) * order.quantity);
  }

  return {
    searchesToday: state.searchesToday,
    successfulMatches,
    activeRfqs,
    orders: state.orders.length,
    potentialSavings: Math.round(potentialSavings),
  };
}

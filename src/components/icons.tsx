import type { SVGProps } from 'react';
import type { PartCategory } from '@/types';

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

// --- Brand logo: a hex-nut framing a topographic summit ("IQ" terrain) -----
export function LogoMark(p: P) {
  return (
    <svg {...base({ ...p, strokeWidth: 1.6 })}>
      <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1l8-4.6z" />
      <path d="M6.5 15.5l3-4 2.2 2.6 2-3.2 3.8 4.6" />
      <circle cx="9.4" cy="9" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);
export const IconCamera = (p: P) => (
  <svg {...base(p)}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" /><circle cx="12" cy="13" r="3.2" /></svg>
);
export const IconMic = (p: P) => (
  <svg {...base(p)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3M8 21h8" /></svg>
);
export const IconHash = (p: P) => (
  <svg {...base(p)}><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" /></svg>
);
export const IconCar = (p: P) => (
  <svg {...base(p)}><path d="M3 13l2-5a2 2 0 011.9-1.3h10.2A2 2 0 0119 8l2 5M3 13h18v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-4z" /><circle cx="7.5" cy="15.5" r="1" /><circle cx="16.5" cy="15.5" r="1" /></svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
);
export const IconBox = (p: P) => (
  <svg {...base(p)}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></svg>
);
export const IconTruck = (p: P) => (
  <svg {...base(p)}><path d="M3 6h10v9H3zM13 9h4l3 3v3h-7z" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></svg>
);
export const IconDoc = (p: P) => (
  <svg {...base(p)}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></svg>
);
export const IconTag = (p: P) => (
  <svg {...base(p)}><path d="M3 12l8-8h8v8l-8 8-8-8z" /><circle cx="15" cy="9" r="1.4" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>
);
export const IconGauge = (p: P) => (
  <svg {...base(p)}><path d="M4 18a8 8 0 1116 0" /><path d="M12 18l4-5" /><circle cx="12" cy="18" r="1" /></svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2l1.5 3 3.3-.6 1 3.2 3 1.4-1.4 3 1.4 3-3 1.4-1 3.2-3.3-.6L12 22l-1.5-3-3.3.6-1-3.2-3-1.4 1.4-3-1.4-3 3-1.4 1-3.2 3.3.6L12 2z" /></svg>
);
export const IconStore = (p: P) => (
  <svg {...base(p)}><path d="M4 9l1-4h14l1 4M4 9v11h16V9M4 9h16M9 20v-6h6v6" /></svg>
);
export const IconChevron = (p: P) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="M20 6L9 17l-5-5" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconWarn = (p: P) => (
  <svg {...base(p)}><path d="M12 3l9 16H3l9-16z" /><path d="M12 10v4M12 17h.01" /></svg>
);
export const IconUpload = (p: P) => (
  <svg {...base(p)}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
);
export const IconSpark = (p: P) => (
  <svg {...base(p)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconLayers = (p: P) => (
  <svg {...base(p)}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>
);
export const IconWrench = (p: P) => (
  <svg {...base(p)}><path d="M14.5 5.5a4 4 0 00-5.2 5.2L4 16v4h4l5.3-5.3a4 4 0 005.2-5.2l-2.6 2.6-2.3-.6-.6-2.3 2.5-2.5z" /></svg>
);
export const IconWheel = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" /></svg>
);
export const IconTopo = (p: P) => (
  <svg {...base(p)}><path d="M3 17c3-4 6-4 9 0M6 13c3-4 6-4 9 0M9 9c2-2 4-2 6 0" /></svg>
);
export const IconShield = (p: P) => (
  <svg {...base(p)}><path d="M12 3l7 2.5v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10v-5L12 3z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const IconBolt = (p: P) => (
  <svg {...base(p)}><path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z" /></svg>
);
export const IconImage = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M4 17l4.5-4.5 3 3L15 11l5 5" /></svg>
);
export const IconExternal = (p: P) => (
  <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h6" /></svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0114 0" /></svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" /></svg>
);
export const IconCart = (p: P) => (
  <svg {...base(p)}><path d="M3 4h2l2.2 11.5a1 1 0 001 .8h8.8a1 1 0 001-.8L21 8H6" /><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></svg>
);
export const IconSidebar = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>
);
export const IconSales = (p: P) => (
  <svg {...base(p)}><path d="M4 20V4M4 17l5-5 3 3 7-8" /><path d="M18 7h3v3" /></svg>
);

// --- Category icons -------------------------------------------------------
export function CategoryIcon({ category, ...p }: P & { category: PartCategory }) {
  switch (category) {
    case 'Brake':
      return <svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.2" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2" /></svg>;
    case 'Suspension':
      return <svg {...base(p)}><path d="M8 3h8M8 21h8M9 4c6 2-6 4 0 6s-6 2 0 4-6 2 0 4 6 2 0 4" /></svg>;
    case 'Steering':
      return <svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" /><path d="M12 4v6M6 17l4-3M18 17l-4-3" /></svg>;
    case 'Engine':
      return <svg {...base(p)}><path d="M4 12V9h3V7h5v2h3l3 3v4h2v3h-4v-2H8v2H4v-5z" /></svg>;
    case 'Cooling':
      return <svg {...base(p)}><rect x="5" y="4" width="14" height="16" rx="1.5" /><path d="M8 7v10M12 7v10M16 7v10" /></svg>;
    case 'Electrical':
      return <svg {...base(p)}><path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z" /></svg>;
    case 'Filters':
      return <svg {...base(p)}><path d="M4 5h16l-2 4H6L4 5z" /><path d="M6 9l1 10h10l1-10" /><path d="M9 13h6" /></svg>;
    case 'Clutch':
      return <svg {...base(p)}><circle cx="12" cy="12" r="8" /><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" /></svg>;
    case 'Transmission':
      return <svg {...base(p)}><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><path d="M7 10v7h7M10 7h7v7" /></svg>;
    case 'Driveline':
      return <svg {...base(p)}><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" /></svg>;
    case 'Bearings':
      return <svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="5" r="0.6" /><circle cx="12" cy="19" r="0.6" /><circle cx="5" cy="12" r="0.6" /><circle cx="19" cy="12" r="0.6" /></svg>;
    case 'Body':
      return <svg {...base(p)}><path d="M3 15l2-6h14l2 6M3 15h18v3H3zM6 9l2-3h8l2 3" /></svg>;
    case 'Exhaust':
      return <svg {...base(p)}><path d="M3 14a4 4 0 014-4h6l5 4-5 4H7a4 4 0 01-4-4z" /><path d="M13 10v8" /></svg>;
    default:
      return <IconBox {...p} />;
  }
}

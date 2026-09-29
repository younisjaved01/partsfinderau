export type CustomerType = 'workshop' | 'fleet' | 'retail' | 'dealer';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  location: string;
  terms: string;
  contact: string;
}

/** Small illustrative trade-account list (mock), analogous to suppliers. */
export const customers: Customer[] = [
  { id: 'cus-redcentre', name: 'Red Centre 4WD & Mechanical', type: 'workshop', location: 'Alice Springs, NT', terms: '30 days', contact: 'Dane M.' },
  { id: 'cus-pilbara', name: 'Pilbara Fleet Services', type: 'fleet', location: 'Karratha, WA', terms: '45 days', contact: 'Fleet desk' },
  { id: 'cus-highcountry', name: 'High Country Cruisers', type: 'workshop', location: 'Wodonga, VIC', terms: '30 days', contact: 'Sam P.' },
  { id: 'cus-outbackmine', name: 'Outback Mining Haulage', type: 'fleet', location: 'Mount Isa, QLD', terms: 'COD', contact: 'Procurement' },
  { id: 'cus-coastal', name: 'Coastal Auto Spares', type: 'dealer', location: 'Coffs Harbour, NSW', terms: '14 days', contact: 'Trade counter' },
  { id: 'cus-walkin', name: 'Walk-in / Retail', type: 'retail', location: 'Counter sale', terms: 'Prepaid', contact: '—' },
];

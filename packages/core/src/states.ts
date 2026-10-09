export type StateKind = 'state' | 'ut';

export type StateInfo = {
  code: string;
  name: string;
  kind: StateKind;
};

export const STATES: ReadonlyMap<string, StateInfo> = new Map([
  ['01', { code: '01', name: 'Jammu and Kashmir', kind: 'ut' }],
  ['02', { code: '02', name: 'Himachal Pradesh', kind: 'state' }],
  ['03', { code: '03', name: 'Punjab', kind: 'state' }],
  ['04', { code: '04', name: 'Chandigarh', kind: 'ut' }],
  ['05', { code: '05', name: 'Uttarakhand', kind: 'state' }],
  ['06', { code: '06', name: 'Haryana', kind: 'state' }],
  ['07', { code: '07', name: 'Delhi', kind: 'ut' }],
  ['08', { code: '08', name: 'Rajasthan', kind: 'state' }],
  ['09', { code: '09', name: 'Uttar Pradesh', kind: 'state' }],
  ['10', { code: '10', name: 'Bihar', kind: 'state' }],
  ['11', { code: '11', name: 'Sikkim', kind: 'state' }],
  ['12', { code: '12', name: 'Arunachal Pradesh', kind: 'state' }],
  ['13', { code: '13', name: 'Nagaland', kind: 'state' }],
  ['14', { code: '14', name: 'Manipur', kind: 'state' }],
  ['15', { code: '15', name: 'Mizoram', kind: 'state' }],
  ['16', { code: '16', name: 'Tripura', kind: 'state' }],
  ['17', { code: '17', name: 'Meghalaya', kind: 'state' }],
  ['18', { code: '18', name: 'Assam', kind: 'state' }],
  ['19', { code: '19', name: 'West Bengal', kind: 'state' }],
  ['20', { code: '20', name: 'Jharkhand', kind: 'state' }],
  ['21', { code: '21', name: 'Odisha', kind: 'state' }],
  ['22', { code: '22', name: 'Chhattisgarh', kind: 'state' }],
  ['23', { code: '23', name: 'Madhya Pradesh', kind: 'state' }],
  ['24', { code: '24', name: 'Gujarat', kind: 'state' }],
  ['26', { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', kind: 'ut' }],
  ['27', { code: '27', name: 'Maharashtra', kind: 'state' }],
  ['28', { code: '28', name: 'Andhra Pradesh', kind: 'state' }],
  ['29', { code: '29', name: 'Karnataka', kind: 'state' }],
  ['30', { code: '30', name: 'Goa', kind: 'state' }],
  ['31', { code: '31', name: 'Lakshadweep', kind: 'ut' }],
  ['32', { code: '32', name: 'Kerala', kind: 'state' }],
  ['33', { code: '33', name: 'Tamil Nadu', kind: 'state' }],
  ['34', { code: '34', name: 'Puducherry', kind: 'ut' }],
  ['35', { code: '35', name: 'Andaman and Nicobar Islands', kind: 'ut' }],
  ['36', { code: '36', name: 'Telangana', kind: 'state' }],
  ['37', { code: '37', name: 'Andhra Pradesh (New)', kind: 'state' }],
  ['38', { code: '38', name: 'Ladakh', kind: 'ut' }],
]);

export function lookupState(code: string): StateInfo | null {
  return STATES.get(code) ?? null;
}

export function isIntraState(sellerCode: string, buyerCode: string): boolean {
  return sellerCode === buyerCode;
}

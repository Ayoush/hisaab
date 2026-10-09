// HSN (Harmonized System of Nomenclature) chapter prefix lookup.
// Chapter 99 is used for services (SAC codes) in GST.

const HSN_CHAPTERS: ReadonlyMap<string, string> = new Map([
  ['01', 'Live animals'],
  ['02', 'Meat and edible meat offal'],
  ['03', 'Fish and crustaceans'],
  ['04', 'Dairy produce; birds eggs; natural honey'],
  ['07', 'Edible vegetables'],
  ['08', 'Edible fruit and nuts'],
  ['09', 'Coffee, tea, spices'],
  ['10', 'Cereals'],
  ['17', 'Sugars and sugar confectionery'],
  ['18', 'Cocoa and cocoa preparations'],
  ['22', 'Beverages, spirits and vinegar'],
  ['24', 'Tobacco and manufactured tobacco substitutes'],
  ['27', 'Mineral fuels, mineral oils'],
  ['30', 'Pharmaceutical products'],
  ['39', 'Plastics and articles thereof'],
  ['40', 'Rubber and articles thereof'],
  ['52', 'Cotton'],
  ['61', 'Articles of apparel (knitted)'],
  ['62', 'Articles of apparel (not knitted)'],
  ['64', 'Footwear'],
  ['72', 'Iron and steel'],
  ['84', 'Nuclear reactors, boilers, machinery'],
  ['85', 'Electrical machinery and equipment'],
  ['87', 'Vehicles other than railway or tramway rolling stock'],
  ['90', 'Optical, photographic, medical instruments'],
  ['99', 'Services (SAC codes)'],
]);

export function lookupHsnChapter(hsn: string): string | null {
  if (hsn.length < 2) return null;
  const prefix = hsn.substring(0, 2);
  return HSN_CHAPTERS.get(prefix) ?? null;
}

import NepaliDate from "nepali-date-converter";

export const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];

export const BS_MONTHS_NP = [
  "बैशाख", "जेठ", "आषाढ", "श्रावण", "भाद्र", "आश्विन",
  "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुन", "चैत्र",
];

/** AD ISO string (YYYY-MM-DD) → { year, month (0-indexed), day } in BS */
export function adToBs(adIso: string): { year: number; month: number; day: number } | null {
  if (!adIso) return null;
  try {
    const nd = new NepaliDate(new Date(adIso + "T00:00:00"));
    return { year: nd.getYear(), month: nd.getMonth(), day: nd.getDate() };
  } catch {
    return null;
  }
}

/** BS { year, month (0-indexed), day } → AD ISO string (YYYY-MM-DD) */
export function bsToAd(year: number, month: number, day: number): string | null {
  try {
    const nd = new NepaliDate(year, month, day);
    const d = nd.toJsDate();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return null;
  }
}

/** Format an AD ISO string as "15 Baisakh 2083 BS" */
export function fmtBS(adIso: string, short = false): string {
  if (!adIso) return "—";
  const bs = adToBs(adIso);
  if (!bs) return "—";
  const m = short
    ? BS_MONTHS[bs.month].slice(0, 3)
    : BS_MONTHS[bs.month];
  return `${bs.day} ${m} ${bs.year} BS`;
}

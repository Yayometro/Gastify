// Price snapshots are intentionally short-lived. Do not show an expired
// merchant price as if it were current. No automatic scraping or affiliate link.
export const MX_CAR_EXAMPLE = {
  model: "Hyundai Grand i10 Hatchback GL TM 2026",
  listPriceMxn: 286_600,
  exampleDepositFraction: 0.2,
  sourceUrl: "https://www.hyundai.com.mx/modelos/grand-i10-hb-2026/especificaciones",
  checkedOn: "2026-10-30",
  showUntil: "2026-11-15",
} as const;

export function currentMxCarExample(today: string, currency: string) {
  return currency === "MXN" && today >= MX_CAR_EXAMPLE.checkedOn && today <= MX_CAR_EXAMPLE.showUntil ? MX_CAR_EXAMPLE : null;
}

// JNTO's guide is a planning reference, not a live booking price. Keep the
// amount in JPY; no guessed FX conversion into the wallet currency.
export const JAPAN_LODGING_REFERENCE = {
  sourceUrl: "https://www.japan.travel/en/guide/japan-on-a-budget/",
  budgetHotelJpyPerNight: 6_000,
  nights: 7,
} as const;

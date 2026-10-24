// The banks an account can be tied to. Each has an id (what is stored on the account), a name, the color of its brand
// and the country. More countries are added by adding rows here. `tier` splits the list in the main banks and the rest,
// which is how the account form offers them. The logo of each bank lives in the app (assets/banks/<id>.webp); until it is
// there the app draws the initials on the bank's color.

export type BankTier = "main" | "other";

export interface Bank {
  id: string;
  name: string;
  short: string;
  color: string;
  country: string;
  tier: BankTier;
}

const bank = (id: string, name: string, short: string, color: string, tier: BankTier, country = "MX"): Bank => ({ id, name, short, color, country, tier });

export const BANKS: Bank[] = [
  // México — main banks
  bank("bbva", "BBVA México", "BBVA", "#004481", "main"),
  bank("santander", "Santander", "SAN", "#EC0000", "main"),
  bank("banorte", "Banorte", "BNT", "#EB0029", "main"),
  bank("banamex", "Citibanamex", "BMX", "#E1262D", "main"),
  bank("hsbc", "HSBC México", "HSBC", "#DB0011", "main"),
  bank("scotiabank", "Scotiabank", "SCO", "#EC111A", "main"),
  bank("inbursa", "Inbursa", "INB", "#003B7B", "main"),
  bank("azteca", "Banco Azteca", "AZT", "#00A94F", "main"),
  bank("bancoppel", "BanCoppel", "COP", "#F9C80E", "main"),
  bank("afirme", "Afirme", "AFI", "#00A3E0", "main"),
  bank("banregio", "Banregio", "REG", "#F26B21", "main"),
  // México — other banks and digital ones
  bank("nu", "Nu México", "NU", "#820AD1", "other"),
  bank("mercadopago", "Mercado Pago", "MP", "#009EE3", "other"),
  bank("hey", "Hey Banco", "HEY", "#1B1B1B", "other"),
  bank("spin", "Spin by OXXO", "SPIN", "#E4002B", "other"),
  bank("klar", "Klar", "KLAR", "#111827", "other"),
  bank("stori", "Stori", "STO", "#00B4A6", "other"),
  bank("uala", "Ualá", "UALA", "#2F54EB", "other"),
  bank("revolut", "Revolut", "REV", "#000000", "other"),
  bank("openbank", "Openbank", "OPEN", "#E10500", "other"),
  bank("albo", "Albo", "ALBO", "#7B2CBF", "other"),
  bank("bajio", "BanBajío", "BAJ", "#00A651", "other"),
  bank("bienestar", "Banco del Bienestar", "BIEN", "#9D2449", "other"),
  bank("mifel", "Mifel", "MIF", "#0B5FA5", "other"),
  bank("multiva", "Multiva", "MUL", "#00539B", "other"),
  bank("intercam", "Intercam", "INT", "#0D7C3B", "other"),
  bank("monex", "Monex", "MON", "#0F4C81", "other"),
  bank("vepormas", "Ve por Más", "VXM", "#E30613", "other"),
  bank("invex", "Invex", "INV", "#1F3A5F", "other"),
  bank("actinver", "Actinver", "ACT", "#0033A0", "other"),
  bank("compartamos", "Compartamos Banco", "COM", "#F58220", "other"),
  bank("otro", "Otro banco", "···", "#6B7280", "other"),
];

export function bankById(id: string | null | undefined): Bank | null {
  return id ? BANKS.find((entry) => entry.id === id) ?? null : null;
}

export function banksForCountry(country: string): { main: Bank[]; other: Bank[] } {
  const list = BANKS.filter((entry) => entry.country === country);
  return { main: list.filter((entry) => entry.tier === "main"), other: list.filter((entry) => entry.tier === "other") };
}

// The country whose banks are offered for a currency (only Mexico for now).
export function bankCountryForCurrency(currency: string | null | undefined): string {
  return currency === "MXN" ? "MX" : "MX";
}

// An account or card number as the person typed it: digits only, 4 to 19 of them, or nothing. The CVV is never kept.
export function normalizeCardNumber(value: unknown): { ok: boolean; value: string | null; message?: string } {
  if (value === null || value === undefined || String(value).trim() === "") return { ok: true, value: null };
  const digits = String(value).replace(/[\s-]/g, "");
  if (!/^\d{4,19}$/.test(digits)) return { ok: false, value: null, message: "accounts.error.cardNumber" };
  return { ok: true, value: digits };
}

// "•••• 1234" for hidden, the number in groups of four for shown.
export function formatCardNumber(value: string | null | undefined, reveal: boolean): string {
  if (!value) return "";
  if (reveal) return value.replace(/(\d{4})(?=\d)/g, "$1 ");
  return `•••• ${value.slice(-4)}`;
}

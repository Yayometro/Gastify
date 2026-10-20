// Lowercase and without accents, so "Categoría" and "categoria" match when searching.
export function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").trim();
}

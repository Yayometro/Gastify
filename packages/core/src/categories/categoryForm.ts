// Rules for the category and sub-category forms. Colors are the palette the web offers in its
// category editor, so a category looks the same on both apps.
export const CATEGORY_COLORS = [
  "#F57C00",
  "#2196F3",
  "#26A69A",
  "#EF5350",
  "#AB47BC",
  "#66BB6A",
  "#FFCA28",
  "#8D6E63",
  "#78909C",
  "#EC407A",
] as const;

// The id of a populated reference or a plain id, as a string.
export function idOf(value: unknown): string {
  const raw = (value as { _id?: unknown } | null | undefined)?._id ?? value;
  return raw === null || raw === undefined ? "" : String(raw);
}

export function validateCategoryName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "accounts.error.nameRequired";
  if (trimmed.length > 40) return "accounts.error.nameTooLong";
  return null;
}

export function subCategoriesOf<T extends { fatherCategory?: unknown }>(list: T[], categoryId: string): T[] {
  return list.filter((item) => idOf(item.fatherCategory) === categoryId);
}

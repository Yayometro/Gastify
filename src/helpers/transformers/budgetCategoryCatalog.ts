import type { CategoryData } from "@/lib/features/categoriesSlice";

/**
 * Normalize the category payload consumed by budget coverage. The app context
 * normally provides the Redux group shape, while isolated clients may pass a
 * flat array.
 */
export function normalizeBudgetCategoryCatalog(categories: unknown): CategoryData[] {
  if (Array.isArray(categories)) return categories as CategoryData[];
  if (!categories || typeof categories !== "object") return [];

  const grouped = categories as { user?: unknown; default?: unknown };
  return [
    ...(Array.isArray(grouped.user) ? grouped.user : []),
    ...(Array.isArray(grouped.default) ? grouped.default : []),
  ] as CategoryData[];
}

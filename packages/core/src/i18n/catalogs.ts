import type { Dict } from "./translate";
import type { Locale } from "./locales";

// The namespaces: one catalog file per namespace and language, under messages/<locale>/<namespace>.ts. A screen loads only the
// namespaces it shows, so the first paint carries the text of its own screen and nothing else.
export const NAMESPACES = ["common", "auth", "movements", "navbar", "dashboard", "budgets", "accounts", "categories", "profile", "history", "analyzer", "projections", "info", "errors", "inicio", "shared"] as const;
export type Namespace = (typeof NAMESPACES)[number];

type Loader = () => Promise<{ default: Dict }>;

const LOADERS: Record<Locale, Partial<Record<Namespace, Loader>>> = {
  es: {
    shared: () => import("./messages/es/shared"),
    analyzer: () => import("./messages/es/analyzer"),
    budgets: () => import("./messages/es/budgets"),
    inicio: () => import("./messages/es/inicio"),
    profile: () => import("./messages/es/profile"),
    auth: () => import("./messages/es/auth"),
    common: () => import("./messages/es/common"),
    movements: () => import("./messages/es/movements"),
    navbar: () => import("./messages/es/navbar"),
  },
  en: {
    shared: () => import("./messages/en/shared"),
    analyzer: () => import("./messages/en/analyzer"),
    budgets: () => import("./messages/en/budgets"),
    inicio: () => import("./messages/en/inicio"),
    profile: () => import("./messages/en/profile"),
    auth: () => import("./messages/en/auth"),
    common: () => import("./messages/en/common"),
    movements: () => import("./messages/en/movements"),
    navbar: () => import("./messages/en/navbar"),
  },
};

// The namespaces that have a catalog in a language (the ones the tests compare between Spanish and English).
export function catalogsFor(locale: Locale): Namespace[] {
  return NAMESPACES.filter((namespace) => Boolean(LOADERS[locale][namespace]));
}

// The text of the given namespaces in one language. A namespace without a catalog yet is simply empty (the fallback covers it).
export async function loadMessages(locale: Locale, namespaces: readonly Namespace[]): Promise<Dict> {
  const parts = await Promise.all(
    namespaces.map(async (namespace) => {
      const loader = LOADERS[locale][namespace];
      return loader ? (await loader()).default : {};
    })
  );
  return Object.assign({}, ...parts);
}

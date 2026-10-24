// The explanations in each language. Spanish is the source and is ready at once; English is loaded only when the person
// chooses it, so the Spanish first paint does not carry the English text.
import type { Locale } from "../i18n/locales";
import type { CreateKind, InfoText } from "./createInfo";
import * as appEs from "./appInfo";
import * as createEs from "./createInfo";

export type InfoData = typeof appEs & {
  CREATE_SCREEN_INFO: InfoText;
  CREATE_KIND_INFO: Record<CreateKind, InfoText>;
  CREATE_KIND_SUMMARY: Record<CreateKind, string>;
};

const SPANISH: InfoData = {
  ...appEs,
  CREATE_SCREEN_INFO: createEs.CREATE_SCREEN_INFO,
  CREATE_KIND_INFO: createEs.CREATE_KIND_INFO,
  CREATE_KIND_SUMMARY: createEs.CREATE_KIND_SUMMARY,
};

// The Spanish explanations, for a screen that renders before its language is known (the default).
export const SPANISH_INFO: InfoData = SPANISH;

// The explanations in one language.
export async function loadInfo(locale: Locale): Promise<InfoData> {
  if (locale === "es") return SPANISH;
  const [app, create] = await Promise.all([import("./en/appInfo"), import("./en/createInfo")]);
  return { ...app, ...create };
}

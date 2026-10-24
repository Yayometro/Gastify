// The explanations in each language. Both are bundled: the info is read on the first paint of the screens that show a "?",
// and its functions (texts that take a number) cannot cross the server-to-client boundary, so the client picks its own copy.
import type { Locale } from "../i18n/locales";
import type { CreateKind, InfoText } from "./createInfo";
import * as appEs from "./appInfo";
import * as createEs from "./createInfo";
import * as appEn from "./en/appInfo";
import * as createEn from "./en/createInfo";

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

const ENGLISH: InfoData = {
  ...appEn,
  CREATE_SCREEN_INFO: createEn.CREATE_SCREEN_INFO,
  CREATE_KIND_INFO: createEn.CREATE_KIND_INFO,
  CREATE_KIND_SUMMARY: createEn.CREATE_KIND_SUMMARY,
};

// The Spanish explanations, for a screen that renders before its language is known (the default).
export const SPANISH_INFO: InfoData = SPANISH;

// The explanations in one language, at once (the web's providers use this).
export function infoFor(locale: Locale): InfoData {
  return locale === "en" ? ENGLISH : SPANISH;
}

// The same, for the app's loader.
export async function loadInfo(locale: Locale): Promise<InfoData> {
  return infoFor(locale);
}

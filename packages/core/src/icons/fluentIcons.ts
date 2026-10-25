import { LEGACY_TO_FLUENT } from "./iconLegacyMap";

// Fluent Emoji 3D icons live in public/icons/fluent/<slug>.webp (see
// scripts/build-fluent-icons.mjs) and are stored by the name "fluent/<slug>".
export const FLUENT_PREFIX = "fluent/";
export const FLUENT_BASE_PATH = "/icons/fluent";
// Images are cached for a year (see next.config.js); kept in step with the set by
// scripts/build-fluent-icons.mjs so browsers fetch the new files after a rebuild.
export const FLUENT_ASSET_VERSION = "1ffb34c-96";

export function isFluentName(type?: string | null): boolean {
  return Boolean(type && type.startsWith(FLUENT_PREFIX) && type.length > FLUENT_PREFIX.length);
}

export function fluentIconUrl(slug: string): string {
  return `${FLUENT_BASE_PATH}/${slug}.webp?v=${FLUENT_ASSET_VERSION}`;
}

// An old name ("gi/GiHamburger", or the bare "GiHamburger") in its canonical form.
export function normalizeLegacyName(type: string): string {
  if (type.includes("/")) return type;
  return `${type.substring(0, 2).toLowerCase()}/${type}`;
}

// The Fluent slug an icon name draws as, or null when it keeps its react-icons look
// (interface icons, brand logos and unknown names).
export function fluentSlugFor(type?: string | null): string | null {
  if (!type) return null;
  if (isFluentName(type)) return type.slice(FLUENT_PREFIX.length);
  return LEGACY_TO_FLUENT[normalizeLegacyName(type)] ?? null;
}

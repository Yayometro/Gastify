import { FLUENT_ASSET_VERSION, FLUENT_BASE_PATH } from "./fluentIcons";
import { LEGACY_TO_FLUENT } from "./iconLegacyMap";
import { englishAlternatives } from "./spanishKeywords";

export interface FluentManifestIcon {
  slug: string;
  name: string;
  glyph: string;
  group: string;
  keywords: string[];
}

export interface FluentIconGroup {
  name: string;
  icons: FluentManifestIcon[];
}

// Groups in the order the picker shows them (finance-relevant ones first).
const GROUP_ORDER = ["Food & Drink", "Travel & Places", "Objects", "Activities", "Animals & Nature", "Symbols", "Smileys & Emotion", "People & Body", "Flags"];
export const SUGGESTED_GROUP = "Suggested";

let cached: Promise<FluentManifestIcon[]> | null = null;

// The icon list (name, group, keywords) is a 33 KB (gzip) file that only the picker
// needs, so it is fetched when the picker opens - never part of the page's JavaScript.
export function loadFluentManifest(baseUrl = ""): Promise<FluentManifestIcon[]> {
  if (!cached) {
    cached = fetch(`${baseUrl}${FLUENT_BASE_PATH}/manifest.json?v=${FLUENT_ASSET_VERSION}`)
      .then((res) => {
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        return res.json() as Promise<{ icons: FluentManifestIcon[] }>;
      })
      .then((data) => data.icons)
      .catch((error) => {
        cached = null; // let a later open retry
        throw error;
      });
  }
  return cached;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

// Icons that match every word typed (name, keywords or the emoji itself).
export function searchFluentIcons(icons: FluentManifestIcon[], query: string): FluentManifestIcon[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return icons;
  // Each typed word may be Spanish: it matches itself or the English words it stands for. The
  // icon's group ("Food & Drink", "Travel & Places") counts too, so "comida" finds the whole group.
  const alternatives = words.map((word) => englishAlternatives(word));
  return icons.filter((icon) => {
    const haystack = normalize(`${icon.name} ${icon.keywords.join(" ")} ${icon.glyph} ${icon.group}`);
    return alternatives.every((options) => options.some((option) => haystack.includes(option)));
  });
}

// The picker's sections: "Suggested" (the emojis the old icons turned into, so the
// choice stays familiar) followed by the library groups.
export function groupFluentIcons(icons: FluentManifestIcon[], withSuggested: boolean): FluentIconGroup[] {
  const bySlug = new Map(icons.map((i) => [i.slug, i]));
  const groups: FluentIconGroup[] = [];
  if (withSuggested) {
    const suggested = [...new Set(Object.values(LEGACY_TO_FLUENT))].map((slug) => bySlug.get(slug)).filter(Boolean) as FluentManifestIcon[];
    if (suggested.length) groups.push({ name: SUGGESTED_GROUP, icons: suggested });
  }
  const byGroup = new Map<string, FluentManifestIcon[]>();
  for (const icon of icons) byGroup.set(icon.group, [...(byGroup.get(icon.group) || []), icon]);
  const ordered = [...byGroup.keys()].sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a);
    const ib = GROUP_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  for (const name of ordered) groups.push({ name, icons: byGroup.get(name)! });
  return groups;
}

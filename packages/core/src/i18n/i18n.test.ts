import { describe, expect, it } from "vitest";
import { translate, createTranslator } from "./translate";
import { resolveLocale, localeFromAcceptLanguage, DEFAULT_LOCALE } from "./locales";
import { formatDate, formatNumber } from "./format";
import { NAMESPACES, catalogsFor, loadMessages } from "./catalogs";

const ES = { "a.hello": "Hola {name}", "a.count_one": "{count} cosa", "a.count_other": "{count} cosas", "a.only_es": "Solo español" };
const EN = { "a.hello": "Hi {name}", "a.count_one": "{count} thing", "a.count_other": "{count} things" };

describe("translate", () => {
  it("interpolates named parameters and keeps unknown ones visible", () => {
    expect(translate(EN, ES, "en", "a.hello", { name: "Ana" })).toBe("Hi Ana");
    expect(translate(EN, ES, "en", "a.hello", {})).toBe("Hi {name}");
  });

  it("chooses the plural form by the count, in each language", () => {
    expect(translate(EN, ES, "en", "a.count", { count: 1 })).toBe("1 thing");
    expect(translate(EN, ES, "en", "a.count", { count: 3 })).toBe("3 things");
    expect(translate(ES, ES, "es", "a.count", { count: 1 })).toBe("1 cosa");
    expect(translate(ES, ES, "es", "a.count", { count: 0 })).toBe("0 cosas");
  });

  it("falls back to Spanish when the English text is missing, and to the key when nothing has it", () => {
    expect(translate(EN, ES, "en", "a.only_es")).toBe("Solo español");
    expect(translate(EN, ES, "en", "a.nowhere")).toBe("a.nowhere");
  });

  it("createTranslator binds a language and its fallback", () => {
    const t = createTranslator("en", EN, ES);
    expect(t("a.hello", { name: "Luis" })).toBe("Hi Luis");
  });
});

describe("resolveLocale and Accept-Language", () => {
  it("reads any English or Spanish tag and defaults to Spanish", () => {
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("es-MX")).toBe("es");
    expect(resolveLocale("fr-FR")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe("es");
  });

  it("picks the first language the person can read from Accept-Language, by quality", () => {
    expect(localeFromAcceptLanguage("en-US,en;q=0.9,es;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("fr;q=1.0, es;q=0.5, en;q=0.4")).toBe("es");
    expect(localeFromAcceptLanguage("de-DE,fr;q=0.9")).toBe("es");
    expect(localeFromAcceptLanguage(null)).toBe("es");
  });
});

describe("format", () => {
  it("formats dates and numbers for each language, reusing the formatter", () => {
    const date = new Date(2026, 9, 24);
    expect(formatDate(date, "es")).toBe("24/10/2026");
    expect(formatDate(date, "en")).toBe("10/24/2026");
    expect(formatDate("not a date", "en")).toBe("");
    expect(formatNumber(1234.5, "en", { minimumFractionDigits: 2 })).toBe("1,234.50");
    expect(formatNumber(NaN, "en")).toBe("");
  });
});

// The catalogs must say the same thing in both languages: the same keys, and the same {parameters} in each text. The tests
// load them the way the app does (loadMessages), so a namespace is covered the moment its catalog exists.
describe("catalogs", () => {
  const spaces = catalogsFor("es");

  it("has the same namespaces in both languages", () => {
    expect(catalogsFor("en").sort()).toEqual([...spaces].sort());
  });

  it.each(spaces)("%s has the same keys in Spanish and English", async (space) => {
    const es = await loadMessages("es", [space]);
    const en = await loadMessages("en", [space]);
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it.each(spaces)("%s keeps the same {parameters} in both languages", async (space) => {
    const es = await loadMessages("es", [space]);
    const en = await loadMessages("en", [space]);
    const params = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const key of Object.keys(es)) {
      expect(params(en[key]), key).toBe(params(es[key]));
    }
  });

  it("has a catalog file for every namespace that loads", async () => {
    expect(NAMESPACES).toContain("common");
    const messages = await loadMessages("en", ["common"]);
    expect(messages["common.save"]).toBe("Save");
    const fallback = await loadMessages("es", ["common"]);
    expect(translate(messages, fallback, "en", "common.save")).toBe("Save");
  });
});

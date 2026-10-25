import { describe, it, expect } from "vitest";

import { englishAlternatives } from "./spanishKeywords";
import { searchFluentIcons, type FluentManifestIcon } from "./fluentManifest";

const icon = (slug: string, group: string, keywords: string[]): FluentManifestIcon => ({ slug, name: slug.replace(/-/g, " "), glyph: "x", group, keywords });
const ICONS = [
  icon("pizza", "Food & Drink", ["cheese", "pizza", "slice"]),
  icon("hamburger", "Food & Drink", ["burger", "hamburger"]),
  icon("airplane", "Travel & Places", ["aeroplane", "airplane"]),
  icon("dog-face", "Animals & Nature", ["dog", "face", "pet"]),
  icon("house", "Travel & Places", ["home", "house"]),
];

describe("englishAlternatives", () => {
  it("keeps the word and adds the English words it stands for, ignoring accents and plurals", () => {
    expect(englishAlternatives("Avión")).toEqual(expect.arrayContaining(["avion", "airplane"]));
    expect(englishAlternatives("mascotas")).toEqual(expect.arrayContaining(["pet", "dog"]));
  });

  it("does not expand very short fragments", () => {
    expect(englishAlternatives("co")).toEqual(["co"]);
  });
});

describe("searchFluentIcons in Spanish", () => {
  it("finds food icons by 'comida' through their group, not only by keyword", () => {
    expect(searchFluentIcons(ICONS, "comida").map((i) => i.slug)).toEqual(["pizza", "hamburger"]);
  });

  it("finds the airplane by 'avion' and the dog by 'mascota'", () => {
    expect(searchFluentIcons(ICONS, "avion").map((i) => i.slug)).toEqual(["airplane"]);
    expect(searchFluentIcons(ICONS, "mascota").map((i) => i.slug)).toEqual(["dog-face"]);
  });

  it("still works in English and with several words", () => {
    expect(searchFluentIcons(ICONS, "pizza").map((i) => i.slug)).toEqual(["pizza"]);
    expect(searchFluentIcons(ICONS, "casa travel").map((i) => i.slug)).toEqual(["house"]);
  });
});

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { LEGACY_ICONS } from "./legacyIconRegistry";
import { LEGACY_TO_FLUENT } from "./iconLegacyMap";
import { fluentIconUrl, fluentSlugFor, isFluentName, normalizeLegacyName } from "./fluentIcons";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { defaultIcons } from "@/helpers/defaultIconsDB";

const ROOT = path.resolve(__dirname, "../../..");
const DIR = path.join(ROOT, "public/icons/fluent");
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8")) as {
  commit: string;
  icons: { slug: string; name: string; group: string; keywords: string[] }[];
};
const BRANDS = ["fa/FaGoogle", "fa/FaAmazon", "fa/FaApple", "fa/FaCcApplePay", "fa/FaLinkedin", "fa/FaYoutube", "fa/FaAirbnb", "fa/FaXbox", "fa/FaSteam", "fa/FaGithub"];

describe("Fluent icon set", () => {
  it("manifest and image files match one to one", () => {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, "")).sort();
    const slugs = manifest.icons.map((i) => i.slug).sort();
    expect(slugs.length).toBeGreaterThan(1000);
    expect(files).toEqual(slugs);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("ships the Microsoft licence next to the images", () => {
    expect(fs.readFileSync(path.join(DIR, "LICENSE.txt"), "utf8")).toContain("MIT License");
  });

  it("every old name in the equivalence table is a real icon and points at an existing image", () => {
    const slugs = new Set(manifest.icons.map((i) => i.slug));
    expect(Object.keys(LEGACY_TO_FLUENT).filter((k) => !LEGACY_ICONS[k])).toEqual([]);
    expect(Object.values(LEGACY_TO_FLUENT).filter((v) => !slugs.has(v))).toEqual([]);
  });

  it("every icon of the picker and every stored icon is either translated or a brand logo", () => {
    const picker = defaultIcons.flatMap((g) => g.icons);
    const stored = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/data/stored-icon-names.json"), "utf8")) as string[];
    const untranslated = [...new Set([...picker, ...stored])].filter((n) => !LEGACY_TO_FLUENT[n] && !BRANDS.includes(n));
    expect(untranslated).toEqual([]);
  });
});

describe("fluentSlugFor", () => {
  it("fluent names, old names and bare names", () => {
    expect(isFluentName("fluent/pizza")).toBe(true);
    expect(isFluentName("fluent/")).toBe(false);
    expect(fluentSlugFor("fluent/pizza")).toBe("pizza");
    expect(fluentSlugFor("gi/GiHamburger")).toBe("hamburger");
    expect(fluentSlugFor("GiHamburger")).toBe("hamburger");
    expect(normalizeLegacyName("MdFilterNone")).toBe("md/MdFilterNone");
    expect(fluentSlugFor("md/MdFlightTakeoff")).toBe("airplane");
  });
  it("interface icons, brand logos and unknown names keep their own look", () => {
    for (const n of ["md/MdFilterNone", "md/MdClose", "md/MdDelete", "md/MdChevronRight", "md/MdOutlineCreate", ...BRANDS, "md/Nope", "", undefined]) {
      expect(fluentSlugFor(n)).toBeNull();
    }
  });
  it("image url", () => {
    expect(fluentIconUrl("money-bag")).toMatch(/^\/icons\/fluent\/money-bag\.webp\?v=[\w-]+$/);
  });
});

describe("UniversalCategoIcon", () => {
  const html = (props: Parameters<typeof UniversalCategoIcon>[0]) => renderToStaticMarkup(<UniversalCategoIcon {...props} />);

  it("draws a Fluent image for fluent names and sizes it", () => {
    const out = html({ type: "fluent/pizza", siz: 24, className: "x" });
    expect(out).toContain('src="/icons/fluent/pizza.webp?v=');
    expect(out).toContain("width:24px");
    expect(out).toContain('alt=""');
    expect(out).toContain('class="x"');
  });
  it("defaults to the text size when no size is given and accepts a css size", () => {
    expect(html({ type: "fluent/pizza" })).toContain("width:1em");
    expect(html({ type: "fluent/pizza", siz: "2rem" })).toContain("width:2rem");
  });
  it("lets Tailwind size classes decide the size, like a vector icon does", () => {
    const out = html({ type: "fluent/pizza", siz: 40, className: "w-[28px] h-[28px] min-[400px]:w-[35px]" });
    expect(out).not.toContain("width:40px");
    expect(out).toContain("w-[28px]");
    // a class with no size still gets the size prop
    expect(html({ type: "fluent/pizza", siz: 20, className: "text-white" })).toContain("width:20px");
  });
  it("draws old names that have an equivalent as the Fluent image", () => {
    expect(html({ type: "gi/GiHamburger", siz: 16 })).toContain("/icons/fluent/hamburger.webp?v=");
  });
  it("keeps vectors for interface icons and brand logos, tinted by colore", () => {
    const close = html({ type: "md/MdClose", siz: 16, colore: "red" });
    expect(close).toContain("<svg");
    expect(close).toContain("red");
    expect(html({ type: "fa/FaGoogle" })).toContain("<svg");
  });
  it("draws nothing for unknown or empty names", () => {
    expect(html({ type: "md/NoSuchIcon" })).toBe("");
    expect(html({})).toBe("");
  });
});

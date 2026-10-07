import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import UniversalCategoIcon, { resolveIcon } from "./UniversalCategoIcon";
import CategoIcon from "./CategoIcon";

const universal = (props: { type?: string; siz?: number }) => renderToStaticMarkup(createElement(UniversalCategoIcon, props));
const categoIcon = (props: { type: string; siz?: number }) => renderToStaticMarkup(createElement(CategoIcon, props));

describe("UniversalCategoIcon", () => {
  it("draws an icon for the prefixed name", () => {
    expect(universal({ type: "md/MdFilterNone", siz: 24 })).toContain("<svg");
  });

  it("also draws one for the bare name the transformers use as a fallback (bug 23)", () => {
    expect(resolveIcon("MdFilterNone")).toBe(resolveIcon("md/MdFilterNone"));
    expect(universal({ type: "MdFilterNone", siz: 24 })).toContain("<svg");
    expect(resolveIcon("FaRegQuestionCircle")).toBe(resolveIcon("fa/FaRegQuestionCircle"));
  });

  it("applies the size it is given as `siz` (bugs 8, 138, 149)", () => {
    const html = universal({ type: "md/MdDelete", siz: 40 });
    expect(html).toContain('height="40"');
    expect(html).toContain('width="40"');
  });

  it("draws nothing, without crashing, for an unknown or missing icon", () => {
    expect(universal({ type: "md/NoSuchIcon" })).toBe("");
    expect(universal({ type: "zz/Nope" })).toBe("");
    expect(universal({})).toBe("");
  });
});

describe("CategoIcon", () => {
  it("accepts the bare Material name and the md/ prefixed one", () => {
    expect(categoIcon({ type: "MdDelete", siz: 15 })).toContain('height="15"');
    expect(categoIcon({ type: "md/MdDelete", siz: 15 })).toContain('height="15"');
  });
  it("draws nothing for an unknown name instead of throwing", () => {
    expect(categoIcon({ type: "NoSuchIcon" })).toBe("");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { createTranslator } from "./translate";

const ES = {
  "movimientos.count_one": "{count} movimiento",
  "movimientos.count_other": "{count} movimientos",
};

describe("plurals", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("picks the form of the count", () => {
    const t = createTranslator("es", ES);
    expect(t("movimientos.count", { count: 1 })).toBe("1 movimiento");
    expect(t("movimientos.count", { count: 5 })).toBe("5 movimientos");
  });

  it("still works in an engine without Intl.PluralRules (the phone's)", () => {
    vi.stubGlobal("Intl", { ...Intl, PluralRules: undefined });
    const t = createTranslator("en", { "movimientos.count_one": "{count} movement", "movimientos.count_other": "{count} movements" });
    expect(t("movimientos.count", { count: 1 })).toBe("1 movement");
    expect(t("movimientos.count", { count: 0 })).toBe("0 movements");
    expect(t("movimientos.count", { count: 2 })).toBe("2 movements");
  });
});

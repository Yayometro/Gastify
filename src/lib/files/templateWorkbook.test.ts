import { describe, it, expect } from "vitest";
import XlsxPopulate from "xlsx-populate";
import JSZip from "jszip";
import { createTranslator } from "@gastify/core/i18n/translate";
import { loadMessages } from "@gastify/core/i18n/catalogs";
import { buildGastifyTemplate } from "./templateWorkbook";
import { TEMPLATE_INCOME_WORDS, TEMPLATE_VERSION } from "./gastifyTemplate";

const data = { categories: ["Comida"], subCategories: ["Restaurantes"], accounts: ["BBVA"], primaryCurrency: "MXN" };

async function build(locale: "es" | "en"): Promise<Buffer> {
  const t = createTranslator(locale, await loadMessages(locale, ["errors", "template"]));
  return buildGastifyTemplate(t, data);
}

describe("Excel template in the language of the person", () => {
  it("is written in Spanish for Spanish and in English for English, with the same column layout", async () => {
    const es = await XlsxPopulate.fromDataAsync(await build("es"));
    const en = await XlsxPopulate.fromDataAsync(await build("en"));
    expect(es.sheet(0).name()).toBe("Movimientos");
    expect(es.sheet(0).cell("A1").value()).toBe("Fecha *");
    expect(es.sheet(0).cell("E1").value()).toBe("Tipo (Gasto/Ingreso) *");
    expect(en.sheet(0).name()).toBe("Transactions");
    expect(en.sheet(0).cell("E1").value()).toBe("Type (Bill/Income) *");
    // The import reads by position and checks the version in _data!C1, so both files carry the same version.
    expect(es.sheet("_data").cell(1, 3).value()).toBe(TEMPLATE_VERSION);
    expect(en.sheet("_data").cell(1, 3).value()).toBe(TEMPLATE_VERSION);
  });

  it("offers the type words of its own language in the Type dropdown", async () => {
    const zipEs = await JSZip.loadAsync(await build("es"));
    const zipEn = await JSZip.loadAsync(await build("en"));
    const sheetEs = await zipEs.file("xl/worksheets/sheet1.xml")!.async("string");
    const sheetEn = await zipEn.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(sheetEs).toContain("Gasto,Ingreso");
    expect(sheetEn).toContain("Bill,Income");
  });

  it("reads 'Ingreso' as income, the same as 'Income'", () => {
    expect(TEMPLATE_INCOME_WORDS).toEqual(expect.arrayContaining(["income", "ingreso"]));
  });

  it("writes no undefined value and no empty fill into the XML (the damage found in the old file)", async () => {
    for (const locale of ["es", "en"] as const) {
      const zip = await JSZip.loadAsync(await build(locale));
      for (const name of Object.keys(zip.files)) {
        if (!name.endsWith(".xml") && !name.endsWith(".rels")) continue;
        const xml = await zip.file(name)!.async("string");
        expect(xml, `${locale} ${name}`).not.toContain("undefined");
        expect(xml, `${locale} ${name}`).not.toMatch(/<fill\s*\/>/);
      }
    }
  });
});

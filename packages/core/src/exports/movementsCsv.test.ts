import { describe, it, expect } from "vitest";

import { csvCell, movementsToCsv } from "./movementsCsv";

describe("csvCell", () => {
  it("leaves plain values alone and quotes the ones that need it", () => {
    expect(csvCell("Comida")).toBe("Comida");
    expect(csvCell("Súper, grande")).toBe('"Súper, grande"');
    expect(csvCell('Dijo "hola"')).toBe('"Dijo ""hola"""');
    expect(csvCell("línea\nnueva")).toBe('"línea\nnueva"');
  });
});

describe("movementsToCsv", () => {
  it("writes the Spanish header and one line per movement with two decimals", () => {
    const csv = movementsToCsv([
      { date: "2026-10-19", name: "Súper, centro", category: "Comida", subCategory: "", type: "Gasto", amount: 250, currency: "MXN", account: "General" },
    ]);
    expect(csv).toBe(
      "Fecha,Nombre,Categoría,Subcategoría,Tipo,Monto,Moneda,Cuenta\r\n2026-10-19,\"Súper, centro\",Comida,,Gasto,250.00,MXN,General"
    );
  });
});

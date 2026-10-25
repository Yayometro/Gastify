import { describe, expect, it } from "vitest";
import { loadInfo } from "./catalog";

// The structure of a value without its text: same keys, same nesting, same list lengths, functions counted as functions.
function shape(value: unknown): unknown {
  if (typeof value === "function") return "fn";
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
  return typeof value;
}

// Every text (string) of a value, in order.
function texts(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => texts(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => texts(item, out));
  return out;
}

describe("info: English has the same structure as Spanish", () => {
  it("same keys, nesting and list lengths", async () => {
    const [es, en] = await Promise.all([loadInfo("es"), loadInfo("en")]);
    expect(shape(en)).toEqual(shape(es));
  });

  it("no English text is empty", async () => {
    const en = await loadInfo("en");
    const empty = texts(en).filter((text) => text.trim() === "");
    expect(empty).toEqual([]);
  });

  it("each function returns the same shape in both languages", async () => {
    const [es, en] = await Promise.all([loadInfo("es"), loadInfo("en")]);
    expect(shape(en.APP_INFO.promedio_mensual_2(3))).toEqual(shape(es.APP_INFO.promedio_mensual_2(3)));
    expect(shape(en.APP_INFO.detalle_del_mes(true))).toEqual(shape(es.APP_INFO.detalle_del_mes(true)));
    expect(shape(en.APP_INFO.analyzer(6))).toEqual(shape(es.APP_INFO.analyzer(6)));
  });
});

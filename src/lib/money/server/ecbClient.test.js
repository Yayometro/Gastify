import { describe, it, expect } from "vitest";
import { parseEcbCsv } from "./ecbClient";

// Real fixture captured from the live ECB SDMX API on 2026-08-21 (trimmed to
// the columns/rows that matter - the parser must resolve columns by header
// name, not position, so a full real header is used here deliberately).
const ECB_CSV_FIXTURE = [
  "KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,OBS_STATUS,TITLE_COMPL",
  'EXR.D.JPY.EUR.SP00.A,D,JPY,EUR,SP00,A,2026-08-20,184.98,A,"ECB reference exchange rate, Japanese yen/Euro, 2.15 pm (C.E.T.)"',
  'EXR.D.JPY.EUR.SP00.A,D,JPY,EUR,SP00,A,2026-08-21,185.66,A,"ECB reference exchange rate, Japanese yen/Euro, 2.15 pm (C.E.T.)"',
  'EXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-08-20,1.1705,A,"ECB reference exchange rate, US dollar/Euro, 2.15 pm (C.E.T.)"',
  'EXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-08-21,1.1699,A,"ECB reference exchange rate, US dollar/Euro, 2.15 pm (C.E.T.)"',
  'EXR.D.MXN.EUR.SP00.A,D,MXN,EUR,SP00,A,2026-08-20,19.7502,A,"ECB reference exchange rate, Mexican peso/Euro, 2.15 pm (C.E.T.)"',
  'EXR.D.MXN.EUR.SP00.A,D,MXN,EUR,SP00,A,2026-08-21,19.7690,A,"ECB reference exchange rate, Mexican peso/Euro, 2.15 pm (C.E.T.)"',
].join("\n");

describe("parseEcbCsv", () => {
  it("extracts the most recent rate per currency and sets EUR to 1", () => {
    const { rates, rawSourceDate } = parseEcbCsv(ECB_CSV_FIXTURE);
    expect(rates).toEqual({
      EUR: "1",
      USD: "1.1699",
      MXN: "19.7690",
      JPY: "185.66",
    });
    expect(rawSourceDate).toBe("2026-08-21");
  });

  it("matches the plan's documented live 2026-08-21 values exactly", () => {
    const { rates } = parseEcbCsv(ECB_CSV_FIXTURE);
    expect(rates.USD).toBe("1.1699");
    expect(rates.MXN).toBe("19.7690");
  });

  it("throws when a required currency is entirely missing", () => {
    const missingMxn = ECB_CSV_FIXTURE.split("\n").filter((l) => !l.includes(",MXN,")).join("\n");
    expect(() => parseEcbCsv(missingMxn)).toThrow(/MXN/);
  });

  it("throws on an empty or header-only response", () => {
    expect(() => parseEcbCsv("KEY,FREQ,CURRENCY,OBS_VALUE,TIME_PERIOD")).toThrow();
  });

  it("throws when the header is missing an expected column", () => {
    expect(() => parseEcbCsv("KEY,FREQ,CURRENCY\nEXR.D.USD.EUR.SP00.A,D,USD")).toThrow();
  });

  it("ignores rows with a non-positive or non-numeric OBS_VALUE", () => {
    const withBadRow =
      ECB_CSV_FIXTURE + '\nEXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-08-22,-,A,"bad row"';
    const { rates } = parseEcbCsv(withBadRow);
    expect(rates.USD).toBe("1.1699"); // unaffected by the malformed trailing row
  });
});

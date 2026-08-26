import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import FxRateSnapshot from "@/model/FxRateSnapshot";
import { SUPPORTED_CURRENCIES, assertSupportedCurrency } from "@/lib/money/currencies";
import { convert } from "@/lib/money/server/fxRateService";

const MAX_AMOUNT_MINOR = 10_000_000_000; // 100,000,000.00 in a 2-decimal currency - generous ceiling, not a real balance
const MIN_DATE = new Date("1999-01-01"); // ECB EUR reference series starts 1999

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on FX QUOTE POST");
    const { amountMinor, fromCurrency, toCurrency, date } = await request.json();

    if (!Number.isInteger(amountMinor) || Math.abs(amountMinor) > MAX_AMOUNT_MINOR) {
      throw new Error("amountMinor must be a bounded integer");
    }
    assertSupportedCurrency(fromCurrency);
    assertSupportedCurrency(toCurrency);

    let parsedDate = new Date();
    if (date !== undefined) {
      parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate < MIN_DATE || parsedDate > new Date()) {
        throw new Error("date must be a valid, non-future ISO date");
      }
    }

    await dbConnection();

    const result = await convert({ amountMinor, fromCurrency, toCurrency, date: parsedDate });

    if (!result.available) {
      return NextResponse.json({
        ok: false,
        message: "Exchange-rate estimate unavailable",
        data: null,
      }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      message: "FX quote resolved",
      data: {
        amountMinor: result.amountMinor,
        currency: result.currency,
        rate: result.rate,
        source: result.source,
        effectiveDate: result.effectiveDate,
        estimated: result.estimated,
        stale: result.stale,
      },
      status: 200,
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ ok: false, message: e?.message || "Unexpected error" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, supportedCurrencies: SUPPORTED_CURRENCIES });
}

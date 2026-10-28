import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import "@/model/FxRateSnapshot";
import { SUPPORTED_CURRENCIES, assertSupportedCurrency } from "@gastify/core/money/currencies";
import { convert } from "@/lib/money/server/fxRateService";
import { serverT } from "@/i18n/server";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";

const fxQuoteRequestSchema = z
  .object({
    amountMinor: z.number().int(),
    fromCurrency: z.string(),
    toCurrency: z.string(),
    date: z.union([z.string(), z.number(), z.date()]).optional(),
  })
  .passthrough();

export type FxQuoteRequestBody = z.infer<typeof fxQuoteRequestSchema>;

export interface FxQuoteResolvedData {
  amountMinor: number;
  currency: string;
  rate: string;
  source: string;
  effectiveDate: Date | string;
  estimated: boolean;
  stale: boolean;
}

export interface FxQuotePostSuccessResponse {
  ok: true;
  message: string;
  data: FxQuoteResolvedData;
  status: 200;
}

export interface FxQuotePostUnavailableResponse {
  ok: false;
  message: string;
  data: null;
}

export interface FxQuotePostErrorResponse {
  ok: false;
  message: string;
}

export type FxQuotePostResponse =
  | FxQuotePostSuccessResponse
  | FxQuotePostUnavailableResponse
  | FxQuotePostErrorResponse;

export interface FxQuoteGetResponse {
  ok: true;
  supportedCurrencies: readonly string[] | string[];
}

const MAX_AMOUNT_MINOR = 10_000_000_000; // 100,000,000.00 in a 2-decimal currency - generous ceiling, not a real balance
const MIN_DATE = new Date("1999-01-01"); // ECB EUR reference series starts 1999

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<FxQuotePostResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.27"));
    // Only a signed-in person with a fresh second factor converts money, like every data route. The rates are public, but an open
    // endpoint lets anyone keep the server and its database busy for nothing.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    const rawBody = (await request.json()) || {};
    const parsed = fxQuoteRequestSchema.safeParse(rawBody);
    const body: Partial<FxQuoteRequestBody> = parsed.success
      ? parsed.data
      : (rawBody as Partial<FxQuoteRequestBody>);
    const { amountMinor, fromCurrency, toCurrency, date } = body;

    if (!Number.isInteger(amountMinor) || Math.abs(amountMinor as number) > MAX_AMOUNT_MINOR) {
      throw new Error(t("errors.amountminor.must.be.a.bounded"));
    }
    assertSupportedCurrency(fromCurrency as string);
    assertSupportedCurrency(toCurrency as string);

    let parsedDate = new Date();
    if (date !== undefined) {
      parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate < MIN_DATE || parsedDate > new Date()) {
        throw new Error(t("errors.date.must.be.a.valid"));
      }
    }

    await dbConnection();

    const result = (await convert({
      amountMinor: amountMinor as number,
      fromCurrency: fromCurrency as string,
      toCurrency: toCurrency as string,
      date: parsedDate,
    })) as {
      available: boolean;
      amountMinor?: number;
      currency?: string;
      rate?: string;
      source?: string;
      effectiveDate?: Date;
      estimated?: boolean;
      stale?: boolean;
    };

    if (!result.available) {
      return NextResponse.json(
        {
          ok: false,
          message: t("errors.exchange.rate.estimate.unavailable"),
          data: null,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: t("errors.fx.quote.resolved"),
      data: {
        amountMinor: result.amountMinor as number,
        currency: result.currency as string,
        rate: result.rate as string,
        source: result.source as string,
        effectiveDate: result.effectiveDate as Date,
        estimated: Boolean(result.estimated),
        stale: Boolean(result.stale),
      },
      status: 200,
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { ok: false, message: (e as Error)?.message || t("errors.api.unexpectedError") },
      { status: 400 }
    );
  }
}

export async function GET(): Promise<NextResponse<FxQuoteGetResponse>> {
  return NextResponse.json({ ok: true, supportedCurrencies: SUPPORTED_CURRENCIES });
}

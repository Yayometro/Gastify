import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import IncomeSource, { type IIncomeSource } from "@/model/IncomeSource";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { isSupportedCurrency, majorToMinor } from "@gastify/core/money/currencies";
import { serverT } from "@/i18n/server";

// Not exported: a Next.js route file may only export handlers. Kept as the source of the request-body type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createIncomeSourceSchema = z
  .object({
    name: z.string().optional().nullable(),
    amount: z.union([z.number(), z.string()]).optional().nullable(),
    currency: z.string().optional().nullable(),
    recurrence: z.string().optional().nullable(),
    anchorDate: z.union([z.string(), z.date()]).optional().nullable(),
    user: z.unknown().optional(),
    wallet: z.unknown().optional(),
  })
  .passthrough();

export type CreateIncomeSourceRequestBody = z.infer<
  typeof createIncomeSourceSchema
>;

export interface NewIncomeSourceGetStatusResponse {
  mes: string;
}

export type NewIncomeSourceGetResponse = NewIncomeSourceGetStatusResponse;

export interface NewIncomeSourcePostSuccessResponse {
  message: string;
  data: IIncomeSource;
  status: number;
  ok: boolean;
}

export type NewIncomeSourcePostResponse = NewIncomeSourcePostSuccessResponse;

export async function GET(): Promise<NextResponse<NewIncomeSourceGetResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<NewIncomeSourcePostResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request)
      throw new Error(t("errors.no.data.in.request.on.17"));
    const { name, amount, currency, recurrence, anchorDate } =
      ((await request.json()) || {}) as CreateIncomeSourceRequestBody;

    // Security fix (#41): this route previously lacked session verification
    // and trusted caller-supplied user/wallet parameters from the body,
    // allowing any caller to forge income sources under any victim's account.
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and derive user and wallet directly
    // from the authenticated session.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(t("errors.user.not.found.on.new.6"));

    const now = new Date();
    // Multi-currency money (minor units + currency) for the source and its first
    // history entry, like the rest of the schema (bug 47); only when the currency is a
    // supported one, otherwise it stays off as before.
    const money = isSupportedCurrency(currency)
      ? { amountMinor: majorToMinor(amount || 0, currency), currency }
      : undefined;
    const newIncomeSource = new IncomeSource({
      name: name || null,
      amount: amount || 0,
      currency: currency || null,
      recurrence: recurrence || "monthly",
      anchorDate: anchorDate || now,
      user: userFound._id,
      wallet: userFound.wallet,
      active: true,
      ...(money ? { money } : {}),
      history: [
        {
          amount: amount || 0,
          ...(money ? { money } : {}),
          recurrence: recurrence || "monthly",
          effectiveFrom: now,
          effectiveTo: null,
        },
      ],
    });
    // SAVE
    const savedIncomeSource = await newIncomeSource.save();
    return NextResponse.json({
      message: t("errors.api.created", { p1: savedIncomeSource.name || t("errors.api.incomeSourceFallback") }),
      data: savedIncomeSource,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import IncomeSource, { type IIncomeSource } from "@/model/IncomeSource";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export const createIncomeSourceSchema = z
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
  try {
    if (!request)
      throw new Error("No data in request on NEW INCOME SOURCE POST");
    const { name, amount, currency, recurrence, anchorDate } =
      ((await request.json()) || {}) as CreateIncomeSourceRequestBody;

    // Security fix (#41): this route previously lacked session verification
    // and trusted caller-supplied user/wallet parameters from the body,
    // allowing any caller to forge income sources under any victim's account.
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and derive user and wallet directly
    // from the authenticated session.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found on NEW INCOME SOURCE");

    const now = new Date();
    const newIncomeSource = new IncomeSource({
      name: name || null,
      amount: amount || 0,
      currency: currency || null,
      recurrence: recurrence || "monthly",
      anchorDate: anchorDate || now,
      user: userFound._id,
      wallet: userFound.wallet,
      active: true,
      history: [
        {
          amount: amount || 0,
          recurrence: recurrence || "monthly",
          effectiveFrom: now,
          effectiveTo: null,
        },
      ],
    });
    //IF ERROR
    if (!newIncomeSource) throw new Error(`No Income Source was identified 🤕`);
    // SAVE
    const savedIncomeSource = await newIncomeSource.save();
    //IF ERROR
    if (!savedIncomeSource)
      throw new Error("New Income Source was not saved 🤕");
    return NextResponse.json({
      message: `${savedIncomeSource.name} was created successfully 🤓`,
      data: savedIncomeSource,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
}

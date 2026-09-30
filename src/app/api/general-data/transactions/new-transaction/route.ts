import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { createTransaction } from "@/lib/transactions/createTransaction";

// Not exported: a Next.js route file may only export handlers. Kept as the source of the request-body type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createTransactionSchema = z
  .object({
    name: z.string().optional().nullable(),
    amount: z.union([z.number(), z.string()]).optional().nullable(),
    isIncome: z.boolean().optional().nullable(),
    isBill: z.boolean().optional().nullable(),
    isReadable: z.boolean().optional().nullable(),
    date: z.union([z.string(), z.date()]).optional().nullable(),
    account: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    subCategory: z.string().optional().nullable(),
    tags: z.union([z.array(z.string()), z.string()]).optional().nullable(),
    budget: z.string().optional().nullable(),
    merchantAmount: z.union([z.number(), z.string()]).optional().nullable(),
    merchantCurrency: z.string().optional().nullable(),
    manualReportingAmount: z.union([z.number(), z.string()]).optional().nullable(),
    user: z.unknown().optional(),
    wallet: z.unknown().optional(),
  })
  .passthrough();

export type CreateTransactionRequestBody = z.infer<typeof createTransactionSchema>;

export interface NewTransactionGetSuccessResponse {
  message: string;
  status: number;
  ok: boolean;
}

export type NewTransactionGetResponse = NewTransactionGetSuccessResponse;

export interface NewTransactionPostSuccessResponse {
  message: string;
  data: unknown;
  status: number;
  ok: boolean;
}

export type NewTransactionPostResponse = NewTransactionPostSuccessResponse;

export async function GET(): Promise<NextResponse<NewTransactionGetResponse>> {
  try {
    return NextResponse.json({
      message: "Data founded in new Transaction",
      status: 201,
      ok: true,
    });
  } catch (e) {
    throw new Error(e as string);
  }
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<NewTransactionPostResponse>> {
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    const body = ((await request.json()) || {}) as CreateTransactionRequestBody;

    // Security fix: this route previously lacked session verification and
    // trusted caller-supplied user/wallet parameters (or created transactions
    // with unverified ownership). We now verify the caller's session via
    // auth.api.getSession, find the session user in the database, and derive
    // user and wallet directly from the session.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found on NEW TRANSACTION");

    // Typed caller invocation for unmigrated createTransaction helper
    const { transaction, name } = await (
      createTransaction as (params: {
        user: unknown;
        wallet: unknown;
        name?: string | null;
        amount?: number | string | null;
        isIncome?: boolean | null;
        isBill?: boolean | null;
        isReadable?: boolean | null;
        date?: string | Date | null;
        account?: string | null;
        category?: string | null;
        subCategory?: string | null;
        tags?: string[] | string | null;
        budget?: string | null;
        merchantAmount?: number | string | null;
        merchantCurrency?: string | null;
        manualReportingAmount?: number | string | null;
      }) => Promise<{ transaction: unknown; name?: string }>
    )({
      ...body,
      user: userFound._id,
      wallet: userFound.wallet,
    });

    return NextResponse.json({
      message: `${name || "Transaction"} was created successfully`,
      data: transaction,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import ProjectionBaseline from "@/model/ProjectionBaseline";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

const getProjectionBaselineBodySchema = z
  .object({
    mail: z.string().optional(),
  })
  .passthrough();

export type GetProjectionBaselineRequestBody = z.infer<
  typeof getProjectionBaselineBodySchema
>;

export interface GetProjectionBaselineStatusResponse {
  mes: string;
}

export interface GetProjectionBaselineSuccessResponse {
  message: string;
  data: unknown;
  status: number;
  ok: boolean;
}

export type GetProjectionBaselineResponse = GetProjectionBaselineSuccessResponse;

export async function GET(): Promise<
  NextResponse<GetProjectionBaselineStatusResponse>
> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetProjectionBaselineResponse>> {
  try {
    if (!request)
      throw new Error("No data in request on GET PROJECTION BASELINE POST");
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by middleware.ts's
    // matcher) read another user's projection baseline - an IDOR, same underlying
    // issue already fixed in get-user/get-wallet/get-categories/get-sub-categories/budget/get/income-sources/get/projections/get.
    // The only real call sites (WalletAnalyzer.tsx and useProjectionTable.js)
    // send the session user's email. We now verify the session and use sesion.user.email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    const rawBody = (await request.json().catch(() => ({}))) || {};
    getProjectionBaselineBodySchema.safeParse(rawBody);

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided in GENERAL-DATA POST");
    const walletId = userFound.wallet;

    // Not every wallet has one yet - null is a valid, expected result.
    const baseline = await ProjectionBaseline.findOne({ wallet: walletId }).lean();
    return NextResponse.json({
      message: `Projection Baseline was found successfully 🤓`,
      data: baseline || null,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import ProjectionSettings from "@/model/ProjectionSettings";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

const getProjectionSettingsBodySchema = z
  .object({
    mail: z.string().optional(),
    year: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

export type GetProjectionSettingsRequestBody = z.infer<
  typeof getProjectionSettingsBodySchema
>;

export interface GetProjectionSettingsStatusResponse {
  mes: string;
}

export interface GetProjectionSettingsSuccessResponse {
  message: string;
  data: unknown;
  status: number;
  ok: boolean;
}

export type GetProjectionSettingsResponse = GetProjectionSettingsSuccessResponse;

export async function GET(): Promise<
  NextResponse<GetProjectionSettingsStatusResponse>
> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetProjectionSettingsResponse>> {
  try {
    if (!request)
      throw new Error("No data in request on GET PROJECTION SETTINGS POST");
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by middleware.ts's
    // matcher) read another user's projection settings - an IDOR, same underlying
    // issue already fixed in get-user/get-wallet/get-categories/get-sub-categories/budget/get/income-sources/get.
    // The only real call sites (WalletAnalyzer.tsx and useProjectionTable.js)
    // send { mail, year }. We now verify the session and use sesion.user.email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    const rawBody = (await request.json()) || {};
    const parsed = getProjectionSettingsBodySchema.safeParse(rawBody);
    const body: GetProjectionSettingsRequestBody = parsed.success
      ? parsed.data
      : (rawBody as GetProjectionSettingsRequestBody);
    const { year } = body;
    if (!year)
      throw new Error(`No mail/year was provided to get projection settings 🤕`);

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided in GENERAL-DATA POST");
    const walletId = userFound.wallet;

    const settings = await ProjectionSettings.findOne({
      wallet: walletId,
      year,
    }).lean();

    return NextResponse.json({
      message: `Projection Settings were looked up successfully 🤓`,
      data: settings || null,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

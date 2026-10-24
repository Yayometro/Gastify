import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import ProjectionSettings from "@/model/ProjectionSettings";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

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
  const t = await serverT(["errors"]);
  try {
    if (!request)
      throw new Error(t("errors.no.data.in.request.on.24"));
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by middleware.ts's
    // matcher) read another user's projection settings - an IDOR, same underlying
    // issue already fixed in get-user/get-wallet/get-categories/get-sub-categories/budget/get/income-sources/get.
    // The only real call sites (WalletAnalyzer.tsx and useProjectionTable.js)
    // send { mail, year }. We now verify the session and use sesion.user.email.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));

    const rawBody = (await request.json()) || {};
    const parsed = getProjectionSettingsBodySchema.safeParse(rawBody);
    const body: GetProjectionSettingsRequestBody = parsed.success
      ? parsed.data
      : (rawBody as GetProjectionSettingsRequestBody);
    const { year } = body;
    if (!year)
      throw new Error(t("errors.api.projectionsGetNoMail"));

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(t("errors.user.not.found.review.the"));
    const walletId = userFound.wallet;

    const settings = await ProjectionSettings.findOne({
      wallet: walletId,
      year,
    }).lean();

    return NextResponse.json({
      message: t("errors.api.projectionsFound"),
      data: settings || null,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Tag, { type ITag } from "@/model/Tag";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

export interface NewTagRequestBody {
  name?: string | null;
  color?: string | null;
  user?: unknown;
  wallet?: unknown;
}

export interface NewTagSuccessResponse {
  message: string;
  data: ITag;
  ok: boolean;
  status: number;
}

export type NewTagResponse = NewTagSuccessResponse;

export async function POST(
  request: NextRequest | Request,
): Promise<NextResponse<NewTagResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.request.received.from.new.2"));
    const { name, color } = (await request.json()) as NewTagRequestBody;

    // Security fix: this route previously lacked session verification and trusted
    // user/wallet IDs passed in the body (IDOR), allowing any caller to create tags
    // attached to arbitrary users/wallets. We now verify the caller's session via
    // auth.api.getSession and derive user and wallet directly from the authenticated user.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.new.7"));

    const newTag = new Tag({
      user: userFound._id,
      wallet: userFound.wallet,
      name: !name ? "write a name for this TAG 🤨" : name,
      color: !color ? null : color,
    });
    const savedTag = await newTag.save();
    if (!savedTag) throw new Error(t("errors.no.new.tag.was.saved"));
    return NextResponse.json({
      message: t("errors.api.created", { p1: savedTag.name }),
      data: savedTag,
      ok: true,
      status: 201,
    });
  } catch (e) {
    throw new Error(e as unknown as string);
  }
}

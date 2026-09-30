import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Tag, { type ITag } from "@/model/Tag";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export interface RemoveTagRequestBody {
  id?: string;
}

export interface RemoveTagSuccessResponse {
  message: string;
  data: ITag;
  ok: boolean;
  status: number;
}

export type RemoveTagResponse = RemoveTagSuccessResponse;

export async function POST(
  request: NextRequest | Request,
): Promise<NextResponse<RemoveTagResponse>> {
  try {
    if (!request) throw new Error("No request received from NEW TAG");
    const { id } = (await request.json()) as RemoveTagRequestBody;

    // Security fix: this route previously lacked session verification and called
    // Tag.findByIdAndDelete(id) directly without checking ownership (IDOR), allowing
    // any caller to delete any user's tags. We now verify the caller's session via
    // auth.api.getSession and scope the deletion to the user's account and wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on REMOVE TAG");

    const removedTag = await Tag.findOneAndDelete({
      _id: id,
      user: userFound._id,
      wallet: userFound.wallet,
    });
    if (!removedTag) throw new Error("No Tag was removed 🤕");
    return NextResponse.json({
      message: `${removedTag.name} was removed successfully 🤓`,
      data: removedTag,
      ok: true,
      status: 201,
    });
  } catch (e) {
    throw new Error(e as unknown as string);
  }
}

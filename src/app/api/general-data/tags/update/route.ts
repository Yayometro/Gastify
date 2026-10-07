import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Tag, { type ITag } from "@/model/Tag";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export interface UpdateTagRequestBody {
  id?: string;
  name?: string | null;
  color?: string | null;
}

export interface UpdateTagSuccessResponse {
  message: string;
  data: ITag;
  ok: boolean;
  status: number;
}

export type UpdateTagResponse = UpdateTagSuccessResponse;

export async function POST(
  request: NextRequest | Request,
): Promise<NextResponse<UpdateTagResponse>> {
  try {
    if (!request) throw new Error("No request received from UPDATE TAG");
    const { id, name, color } = (await request.json()) as UpdateTagRequestBody;

    // Security fix: this route previously lacked session verification and called
    // Tag.findById(id) directly without checking ownership (IDOR), allowing any
    // caller to modify any user's tags. We now verify the caller's session via
    // auth.api.getSession and scope the lookup to the user's account and wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on UPDATE TAG");

    const updatedTag = await Tag.findOne({
      _id: id,
      user: userFound._id,
      wallet: userFound.wallet,
    });
    if (!updatedTag) throw new Error("No Tag was found 🤕");
    //UPDATE:
    // A tag always keeps a name, so an empty/missing name leaves it as it is;
    // the colour can be cleared with an empty value (bug 123).
    updatedTag.name = !name ? updatedTag.name : name;
    updatedTag.color = color === undefined || color === null ? updatedTag.color : color;
    //Saved
    const update = await updatedTag.save();
    if (!update) throw new Error("No new Tag was saved 🤕");
    return NextResponse.json({
      message: `${update.name} was updated successfully 🤓`,
      data: update,
      ok: true,
      status: 201,
    });
  } catch (e) {
    throw new Error(e as unknown as string);
  }
}

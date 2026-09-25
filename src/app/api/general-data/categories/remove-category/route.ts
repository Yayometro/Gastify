import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category, { type ICategory } from "@/model/Category";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export interface RemoveCategorySuccessResponse {
  message: string;
  data: {
    categoRemoved: ICategory;
  };
  ok: boolean;
  status: number;
}

export type RemoveCategoryResponse = RemoveCategorySuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<RemoveCategoryResponse>> {
  try {
    console.log("first");
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const id = (await request.json()) as string;
    console.log(id);
    // Security fix: this used to delete the Category by id alone, with
    // zero ownership check - this endpoint isn't covered by
    // middleware.ts's matcher, so any caller could delete any other
    // user's category. Now deletion is scoped to the caller's own
    // wallet (session-derived).
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on REMOVE CATEGORY");
    const removedCatego = await Category.findOneAndDelete({
      _id: id,
      wallet: userFound.wallet,
    });
    if (!removedCatego) throw new Error("NO category REMOVED 🤕");
    //
    return NextResponse.json({
      message: `${removedCatego.name} was removed successfully 🤓`,
      data: {
        categoRemoved: removedCatego,
      },
      ok: true,
      status: 201,
    });
  } catch (e) {
    throw new Error(e);
  }
}

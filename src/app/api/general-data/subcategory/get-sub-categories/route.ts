import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";
import "@/model/Category";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export interface GetSubCategoriesSuccessResponse {
  data: {
    subCategories: unknown;
    defSubCategories: unknown;
  };
  message: string;
  status: number;
  ok: boolean;
}

export type GetSubCategoriesResponse = GetSubCategoriesSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetSubCategoriesResponse>> {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by
    // middleware.ts's matcher) read another user's sub-categories - an
    // IDOR, same underlying issue already fixed in get-user/get-wallet/
    // get-categories. The only real call site (subCategorySlice.ts's
    // fetchSubCat) always sends its own session's email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided in GENERAL-DATA POST");
    const userId = userFound._id;
    const walletId = userFound.wallet;
    //
    // console.log(userFound)
    //FIND CATEGORIES
    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated SubCategory.js
    const subCategoriesFounded = await (
      SubCategory as unknown as {
        find: (filter: unknown) => {
          lean: () => {
            populate: (pop: unknown) => Promise<unknown>;
          };
        };
      }
    )
      .find({
        user: userId,
        wallet: walletId,
      })
      .lean()
      .populate({
        path: "fatherCategory",
      });
    if (!subCategoriesFounded)
      throw new Error(
        "No categories found, review the user and wallet id on GENERAL-DATA POST"
      );
    // console.log(subCategoriesFounded)
    //FIND DEFUALT CATEGORIES
    const defaultSubCategoriesFounded = await (
      SubCategory as unknown as {
        find: (filter: unknown) => {
          lean: () => {
            populate: (pop: unknown) => Promise<unknown>;
          };
        };
      }
    )
      .find({
        isDefaultCatego: true,
      })
      .lean()
      .populate({
        path: "fatherCategory",
      });
    // console.log(defaultSubCategoriesFounded)
    if (!defaultSubCategoriesFounded)
      throw new Error(
        "No SubCategories found, review the user and wallet id on GENERAL-DATA POST"
      );
    // console.log(defaultSubCategoriesFounded)
    const dataFull = {
      subCategories: subCategoriesFounded,
      defSubCategories: defaultSubCategoriesFounded,
    };
    return NextResponse.json({
      data: dataFull,
      message: "SubCategories founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

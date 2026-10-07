import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { toPublicUser } from "@/lib/auth/publicUser";

export interface CategoriesGetAllData {
  user: unknown;
  categories: unknown;
  defCat: unknown;
  subCategories: unknown;
}

export interface CategoriesGetAllSuccessResponse {
  data: CategoriesGetAllData;
  message: string;
  status: number;
  ok: boolean;
}

export type CategoriesGetAllResponse = CategoriesGetAllSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<CategoriesGetAllResponse>> {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any authenticated (or unauthenticated - this endpoint
    // isn't covered by middleware.ts's matcher) caller read another user's
    // categories/subcategories. No real call site was found for this route
    // (dead code from the frontend's point of view), but it's still
    // reachable directly over HTTP, so it gets the same fix as every other
    // route in this family.
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
    //FIND CATEGORIES
    const categoriesFounded = await Category.find({
      user: userId,
      wallet: walletId,
    }).lean();
    if (!categoriesFounded)
      throw new Error(
        "No categories found, review the user and wallet id on GENERAL-DATA POST"
      );
    //FIND DEFUALT CATEGORIES
    const defaultCategoriesFounded = await Category.find({
      isDefaultCatego: true,
    }).lean();
    if (!defaultCategoriesFounded)
      throw new Error(
        "No default categories found, review the user and wallet id on GENERAL-DATA POST"
      );
    //FIND CATEGORIES
    const subCategoriesFounded = await SubCategory.find({
      user: userId,
      wallet: walletId,
    })
      .lean()
      .populate({
        path: "fatherCategory",
      });
    if (!subCategoriesFounded)
      throw new Error(
        "No SubCategories found, review the user and wallet id on GENERAL-DATA POST"
      );
    const dataFull = {
      user: toPublicUser(userFound),
      categories: categoriesFounded,
      defCat: defaultCategoriesFounded,
      subCategories: subCategoriesFounded,
    };
    return NextResponse.json({
      data: dataFull,
      message: "Categories and SubCategories founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

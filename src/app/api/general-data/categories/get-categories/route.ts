import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category from "@/model/Category";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

export interface GetCategoriesSuccessResponse {
  data: {
    categories: unknown;
    defCat: unknown;
  };
  message: string;
  status: number;
  ok: boolean;
}

export type GetCategoriesResponse = GetCategoriesSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetCategoriesResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.request.received.from.new"));
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by
    // middleware.ts's matcher) read another user's categories - an IDOR,
    // same underlying issue already fixed in get-user/get-wallet. The only
    // real call site (categoriesSlice.ts's fetchCategories) always sends
    // its own session's email.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(t("errors.user.not.found.review.the"));
    const userId = userFound._id;
    const walletId = userFound.wallet;

    //FIND CATEGORIES
    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Category.js
    const categoriesFounded = await (
      Category as unknown as {
        find: (filter: unknown) => {
          lean: () => Promise<unknown>;
        };
      }
    )
      .find({
        user: userId,
        wallet: walletId,
      })
      .lean();
    if (!categoriesFounded)
      throw new Error(
        t("errors.no.categories.found.review.the")
      );
    //FIND DEFUALT CATEGORIES
    const defaultCategoriesFounded = await (
      Category as unknown as {
        find: (filter: unknown) => {
          lean: () => Promise<unknown>;
        };
      }
    )
      .find({
        isDefaultCatego: true,
      })
      .lean();
    if (!defaultCategoriesFounded)
      throw new Error(
        t("errors.no.default.categories.found.review")
      );
    const dataFull = {
      categories: categoriesFounded,
      defCat: defaultCategoriesFounded,
    };
    return NextResponse.json({
      data: dataFull,
      message: t("errors.categories.and.subcategories.founded"),
      status: 201,
      ok: true,
    });
  } catch (e) {
    throw new Error(e);
  }
}

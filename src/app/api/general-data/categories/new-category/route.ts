import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category, { type ICategory } from "@/model/Category";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import type mongoose from "mongoose";
import { serverT } from "@/i18n/server";

export interface NewCategoryRequestBody {
  name?: string;
  icon?: string;
  color?: string;
  accounts?: (mongoose.Types.ObjectId | string)[];
  [key: string]: unknown;
}

export interface NewCategorySuccessResponse {
  message: string;
  data: ICategory;
  ok: boolean;
  status: number;
}

export type NewCategoryResponse = NewCategorySuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<NewCategoryResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.request.received.from.new"));
    const { name, icon, color, accounts } =
      (await request.json()) as NewCategoryRequestBody;
    // Security fix: this used to trust whatever user/wallet the client
    // sent in the body, letting any caller (this endpoint isn't covered
    // by middleware.ts's matcher) plant a category inside ANY OTHER
    // user's wallet. Now they're always derived from the caller's own
    // session instead. The only real call site (EditCategoryModal.jsx)
    // already sends the caller's own ids anyway.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.new.3"));
    const user = userFound._id;
    const wallet = userFound.wallet;
    const newCategory = new Category({
      user: user,
      wallet: wallet,
      name: !name ? "write a name for this category 🤨" : name,
      icon: !icon ? null : icon,
      color: !color ? null : color,
    });
    if (accounts) {
      if (accounts.length > 0) {
        accounts.map((acc) => {
          newCategory.accounts.push(acc);
        });
      }
    }
    const saveCatego = await newCategory.save();
    if (!saveCatego) throw new Error(t("errors.new.category.not.saved"));
    return NextResponse.json({
      message: `${saveCatego.name} was created successfully 🤓`,
      data: saveCatego,
      ok: true,
      status: 201,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

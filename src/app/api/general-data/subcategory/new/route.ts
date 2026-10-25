import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory, { type ISubCategory } from "@/model/SubCategory";
import "@/model/Category";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import type mongoose from "mongoose";
import { serverT } from "@/i18n/server";

export interface NewSubCategoryRequestBody {
  name?: string;
  icon?: string;
  color?: string;
  fatherCategory?: mongoose.Types.ObjectId | string;
  [key: string]: unknown;
}

export interface NewSubCategorySuccessResponse {
  message: string;
  data: ISubCategory | null;
  ok: boolean;
  status: number;
}

export type NewSubCategoryResponse = NewSubCategorySuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<NewSubCategoryResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.request.received.from.new"));
    const { name, icon, color, fatherCategory } =
      (await request.json()) as NewSubCategoryRequestBody;
    if (!fatherCategory)
      throw new Error(t("errors.no.father.category.received.for"));
    // Security fix: this used to trust whatever user/wallet the client sent
    // in the body, letting any caller (this endpoint isn't covered by
    // middleware.ts's matcher) plant a sub-category inside ANY OTHER user's
    // wallet. Now they're always derived from the caller's own session
    // instead. The only real call site (EditCategoryModal.jsx) already
    // sends the caller's own ids anyway.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.new.5"));
    const user = userFound._id;
    const wallet = userFound.wallet;
    const newSubCategory = new SubCategory({
      user,
      wallet,
      fatherCategory,
      name: !name ? "write a name for this sub-category 🤨" : name,
      icon: !icon ? null : icon,
      color: !color ? null : color,
    });

    const saveSub = await newSubCategory.save();
    const populatedSubCategory = await SubCategory.findById(saveSub._id)
      .populate("fatherCategory");
    if (!saveSub) throw new Error(t("errors.new.sub.category.not.saved"));
    return NextResponse.json({
      message: t("errors.api.created", { p1: saveSub.name }),
      data: populatedSubCategory,
      ok: true,
      status: 201,
    });
  } catch (e) {
    throw new Error(e);
  }
}

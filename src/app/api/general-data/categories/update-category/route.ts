import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Category, { type ICategory } from "@/model/Category";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import type mongoose from "mongoose";
import { serverT } from "@/i18n/server";

export interface UpdateCategoryRequestBody {
  id?: string;
  name?: string;
  icon?: string;
  color?: string;
  accounts?: (mongoose.Types.ObjectId | string)[];
  [key: string]: unknown;
}

export interface UpdateCategorySuccessResponse {
  message: string;
  data: ICategory;
  ok: boolean;
  status: number;
}

export type UpdateCategoryResponse = UpdateCategorySuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<UpdateCategoryResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.request.received.from.new"));
    const { id, name, icon, color, accounts } =
      (await request.json()) as UpdateCategoryRequestBody;
    // Security fix: this used to look up the Category by id alone, with
    // zero ownership check - this endpoint isn't covered by
    // middleware.ts's matcher, so any caller could edit any other
    // user's category. Now the lookup is scoped to the caller's own
    // wallet (session-derived), so an id belonging to someone else's
    // category fails the same "not found" check as a bogus id.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.update.3"));
    const findCatego = await Category.findOne({
      _id: id,
      wallet: userFound.wallet,
    });
    if (!findCatego) throw new Error(t("errors.no.category.found.to.update"));
    // UPDATE
    findCatego.name = !name ? findCatego.name : name;
    findCatego.icon = !icon ? findCatego.icon : icon;
    findCatego.color = !color ? findCatego.color : color;
    if (accounts) {
      if (accounts.length > 0) {
        accounts.map((acc) => {
          findCatego.accounts.push(acc);
        });
      }
    }
    const saveCatego = await findCatego.save();
    if (!saveCatego) throw new Error(t("errors.api.categoryNotSaved", { p1: saveCatego.name }));
    return NextResponse.json({
      message: t("errors.api.created", { p1: saveCatego.name }),
      data: saveCatego,
      ok: true,
      status: 201,
    });
  } catch (e) {
    // console.log(e)
    throw new Error(e);
  }
}

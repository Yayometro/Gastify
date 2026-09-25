import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export async function POST(request) {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const { id, name, icon, color, fatherCategory } = await request.json();
    // Security fix: this used to look up the SubCategory by id alone, with
    // zero ownership check - this endpoint isn't covered by
    // middleware.ts's matcher, so any caller could edit any other user's
    // sub-category (including re-parenting it, which cascades into
    // Transaction.updateMany below and could re-tag someone else's
    // transactions). Now the lookup is scoped to the caller's own wallet
    // (session-derived).
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on UPDATE SUB-CATEGORY");
    const findSub = await SubCategory.findOne({ _id: id, wallet: userFound.wallet });
    //UPDATE
    if (!findSub) throw new Error("No SubCategory was found 🤕");
    const previousFatherCategory = findSub.fatherCategory;
    findSub.name = !name ? findSub.name : name;
    findSub.icon = !icon ? findSub.icon : icon;
    findSub.color = !color ? findSub.color : color;
    findSub.fatherCategory = !fatherCategory
      ? findSub.fatherCategory
      : fatherCategory;
    const saveSub = await findSub.save()
    if (!saveSub) throw new Error("Sub-category not updated 🤕");
    const fatherCategoryChanged =
      fatherCategory && String(previousFatherCategory) !== String(fatherCategory);
    if (fatherCategoryChanged) {
      // Transaction.category is a denormalized snapshot taken at creation
      // time, not derived live from subCategory.fatherCategory - every
      // transaction already tagged with this subcategory must be
      // backfilled or it keeps grouping under the old parent forever.
      await Transaction.updateMany(
        { subCategory: saveSub._id },
        { $set: { category: fatherCategory } }
      );
    }
    const populatedSubCategory = await SubCategory.findById(saveSub._id)
      .populate('fatherCategory');
    return NextResponse.json({
      message: `${populatedSubCategory.name} was updated successfully 🤓`,
      data: populatedSubCategory,
      ok: true,
      status: 201,
    });
  } catch (e) {
    throw new Error(e);
  }
}

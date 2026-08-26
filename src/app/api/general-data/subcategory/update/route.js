import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import Transaction from "@/model/Transaction";

export async function POST(request) {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const { id, name, icon, color, fatherCategory } = await request.json();
    await dbConnection();
    const findSub = await SubCategory.findById(id);
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

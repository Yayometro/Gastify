import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";

export async function POST(request) {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const { id, name, icon, color, fatherCategory } = await request.json();
    await dbConnection();
    const findSub = await SubCategory.findById(id);
    //UPDATE
    if (!findSub) throw new Error("No SubCategory was found 🤕");
    findSub.name = !name ? findSub.name : name;
    findSub.icon = !icon ? findSub.icon : icon;
    findSub.color = !color ? findSub.color : color;
    findSub.fatherCategory = !fatherCategory
      ? findSub.fatherCategory
      : fatherCategory;
    const saveSub = await findSub.save()
    if (!saveSub) throw new Error("Sub-category not updated 🤕");
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

import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";

export async function POST(request) {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const { user, wallet, name, icon, color, fatherCategory } =
      await request.json();
    if (!user) throw new Error("No USER received for NEW SUB-CATEGORY");
    if (!wallet) throw new Error("No WALLET received for NEW SUB-CATEGORY");
    if (!fatherCategory)
      throw new Error("No FATHER category received for NEW SUB-CATEGORY");
    await dbConnection();
    const newSubCategory = new SubCategory({
      user,
      wallet,
      fatherCategory,
      name: !name ? "write a name for this sub-category 🤨" : name,
      icon: !icon ? null : icon,
      color: !color ? null : color,
    })

    const saveSub = await newSubCategory.save();
    const populatedSubCategory = await SubCategory.findById(saveSub._id)
      .populate('fatherCategory');
    if (!saveSub) throw new Error("New sub-category not saved 🤕");
    return NextResponse.json({
      message: `${saveSub.name} was created successfully 🤓`,
      data: populatedSubCategory,
      ok: true,
      status: 201,
    });
  } catch (e) {
    throw new Error(e);
  }
}

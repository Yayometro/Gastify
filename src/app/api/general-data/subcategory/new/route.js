import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export async function POST(request) {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const { name, icon, color, fatherCategory } =
      await request.json();
    if (!fatherCategory)
      throw new Error("No FATHER category received for NEW SUB-CATEGORY");
    // Security fix: this used to trust whatever user/wallet the client sent
    // in the body, letting any caller (this endpoint isn't covered by
    // middleware.ts's matcher) plant a sub-category inside ANY OTHER user's
    // wallet. Now they're always derived from the caller's own session
    // instead. The only real call site (EditCategoryModal.jsx) already
    // sends the caller's own ids anyway.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on NEW SUB-CATEGORY");
    const user = userFound._id;
    const wallet = userFound.wallet;
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

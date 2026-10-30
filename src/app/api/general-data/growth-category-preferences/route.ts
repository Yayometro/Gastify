import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import User from "@/model/User";
import Category from "@/model/Category";
import GrowthCategoryPreference from "@/model/GrowthCategoryPreference";

async function context(request: Request) {
  const session = await getVerifiedSession(request.headers);
  if (!session?.user?.email) return null;
  await dbConnection();
  const user = await User.findOne({ mail: session.user.email }).select("_id wallet").lean();
  return user?.wallet ? { userId: user._id, walletId: user.wallet } : null;
}

export async function GET(request: NextRequest | Request) {
  const owner = await context(request);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const preferences = await GrowthCategoryPreference.find({ wallet: owner.walletId }).select("category reductionPercent").lean();
  return NextResponse.json({ preferences: preferences.map((item) => ({ categoryId: String(item.category), reductionPercent: item.reductionPercent })) });
}

export async function PUT(request: NextRequest | Request) {
  const owner = await context(request);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { categoryId?: unknown; reductionPercent?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const categoryId = body?.categoryId;
  const reductionPercent = body?.reductionPercent;
  if (typeof categoryId !== "string" || !mongoose.isValidObjectId(categoryId) || typeof reductionPercent !== "number" || !Number.isInteger(reductionPercent) || reductionPercent < 0 || reductionPercent > 100) {
    return NextResponse.json({ error: "Invalid category or reduction percentage" }, { status: 400 });
  }
  const category = await Category.findOne({ _id: categoryId, $or: [{ isDefaultCatego: true }, { user: owner.userId, wallet: owner.walletId }] }).select("_id").lean();
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  if (reductionPercent === 0) {
    await GrowthCategoryPreference.deleteOne({ wallet: owner.walletId, category: categoryId });
  } else {
    await GrowthCategoryPreference.updateOne(
      { wallet: owner.walletId, category: categoryId },
      { $set: { reductionPercent } },
      { upsert: true, runValidators: true }
    );
  }
  return NextResponse.json({ ok: true, data: { categoryId, reductionPercent } });
}

// The mobile API client currently supports JSON POST writes; keep the same
// authenticated validation path instead of adding a second implementation.
export async function POST(request: NextRequest | Request) {
  return PUT(request);
}

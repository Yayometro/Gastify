import ProjectionBaseline from "@/model/ProjectionBaseline";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on DELETE PROJECTION BASELINE POST");
    const { mail, kind, entryId } = await request.json();
    if (!mail || !entryId || !kind)
      throw new Error(`No mail/kind/entryId was provided to delete a projection baseline entry 🤕`);
    if (kind !== "income" && kind !== "expense")
      throw new Error(`kind must be "income" or "expense" 🤕`);
    await dbConnection();
    const userFound = await User.findOne({ mail }).lean();
    if (!userFound)
      throw new Error({
        error: "User not found, review the email provided in GENERAL-DATA POST",
      });
    const walletId = userFound.wallet;

    const baseline = await ProjectionBaseline.findOne({ wallet: walletId });
    if (!baseline) throw new Error("Projection Baseline was not found to delete an entry from 🤕");
    const field = kind === "income" ? "incomeHistory" : "expenseHistory";
    baseline[field] = (baseline[field] || []).filter((entry) => String(entry._id) !== String(entryId));
    const savedBaseline = await baseline.save();

    if (!savedBaseline) throw new Error("Projection Baseline was not saved 🤕");
    return NextResponse.json({
      message: `Projection Baseline entry was removed 🤓`,
      data: savedBaseline,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

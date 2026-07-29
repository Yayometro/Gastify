import IncomeSource from "@/model/IncomeSource";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on REMOVE INCOME SOURCE POST");
    const { id } = await request.json();
    await dbConnection();
    // NO ID FILTER
    if (!id)
      throw new Error(`No ID was provided to removed the income source 🤕`);
    // SOFT DELETE: keep the document so past months in Projections can still read its history
    const removedIncomeSource = await IncomeSource.findById(id);
    //IF ERROR
    if (!removedIncomeSource)
      throw new Error("Income Source was not removed, verify data ❌");
    removedIncomeSource.archived = true;
    removedIncomeSource.active = false;
    const openEntry = removedIncomeSource.history?.find((h) => !h.effectiveTo);
    if (openEntry) openEntry.effectiveTo = new Date();
    await removedIncomeSource.save();
    return NextResponse.json({
      message: `Income Source ${removedIncomeSource?.name} was removed 🤓`,
      data: removedIncomeSource,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

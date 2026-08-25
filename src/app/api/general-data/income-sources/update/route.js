import IncomeSource from "@/model/IncomeSource";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on UPDATE INCOME SOURCE POST");
    const { id, name, amount, currency, recurrence, anchorDate, active } =
      await request.json();
    await dbConnection();
    // NO ID FILTER
    if (!id) throw new Error(`No ID was provided to update income source 🤕`);
    const updateIncomeSource = await IncomeSource.findById(id);
    //IF ERROR
    if (!updateIncomeSource)
      throw new Error(`No Income Source was identified to update 🤕`);
    // VERSION HISTORY if amount/recurrence is actually changing
    const isChanging =
      (!!amount && amount !== updateIncomeSource.amount) ||
      (!!recurrence && recurrence !== updateIncomeSource.recurrence);
    if (isChanging) {
      const now = new Date();
      const openEntry = updateIncomeSource.history?.find((h) => !h.effectiveTo);
      if (openEntry) openEntry.effectiveTo = now;
      updateIncomeSource.history = updateIncomeSource.history || [];
      updateIncomeSource.history.push({
        amount: !amount ? updateIncomeSource.amount : amount,
        recurrence: !recurrence ? updateIncomeSource.recurrence : recurrence,
        effectiveFrom: now,
        effectiveTo: null,
      });
    }
    //UPDATE:
    updateIncomeSource.name = !name ? updateIncomeSource.name : name;
    updateIncomeSource.amount = !amount ? updateIncomeSource.amount : amount;
    updateIncomeSource.currency = !currency ? updateIncomeSource.currency : currency;
    updateIncomeSource.recurrence = !recurrence
      ? updateIncomeSource.recurrence
      : recurrence;
    updateIncomeSource.anchorDate = !anchorDate
      ? updateIncomeSource.anchorDate
      : anchorDate;
    updateIncomeSource.active =
      active === undefined ? updateIncomeSource.active : active;
    // SAVE
    const savedIncomeSource = await updateIncomeSource.save();
    //IF ERROR
    if (!savedIncomeSource) throw new Error("Updated Income Source was not saved 🤕");
    return NextResponse.json({
      message: `${savedIncomeSource.name} was updated successfully 🤓`,
      data: savedIncomeSource,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

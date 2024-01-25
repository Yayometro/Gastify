import Wallet from "@/model/Wallet";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on REMOVE-ACCOUNT POST");
    const {
      walletId,
      name,
      cash,
      totalBudget,
      totalSavings,
      isSurpassed,
      isSaved
    } = await request.json();
    await dbConnection();
    // FIND WALLET
    const findWallet = await Wallet.findById(walletId);
    //IF ERROR
    if (!findWallet)
      throw new Error(`No Account was identified to be removed 🤕`);
    //UPDATE WALLET
    findWallet.name = !name ? findWallet.name : name;
    findWallet.cash = !cash ? findWallet.cash : cash;
    findWallet.budget.totalBudget = !totalBudget
      ? findWallet.budget.totalBudget
      : totalBudget;
    findWallet.budget.isSurpassed = !isSurpassed
      ? findWallet.budget.isSurpassed
      : isSurpassed;
    findWallet.budget.totalSavings = !totalSavings
      ? findWallet.budget.totalSavings
      : totalSavings;
    findWallet.budget.isSaved = !isSaved
      ? findWallet.budget.isSaved
      : isSaved;

    // SAVE
    const updatedWallet = await findWallet.save();
    //IF ERROR
    if (!updatedWallet) throw new Error("Wallet was not updated 🤕");
    return NextResponse.json({
      message: `${updatedWallet.name} was updated successfully 🤓`,
      data: updatedWallet,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

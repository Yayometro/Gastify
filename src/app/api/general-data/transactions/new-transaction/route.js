import { NextResponse } from "next/server";
import { createTransaction } from "@/lib/transactions/createTransaction";

export async function GET() {
  try {
    return NextResponse.json({
      message: "Data founded in new Transaction",
      status: 201,
      ok: true,
    });
  } catch (e) {
    throw new Error(e);
  }
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    const body = await request.json();
    const { transaction, name } = await createTransaction(body);
    return NextResponse.json({
      message: `${name || "Transaction"} was created successfully`,
      data: transaction,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

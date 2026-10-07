import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import IncomeSource, {
  type IIncomeSource,
  type IncomeSourceRecurrence,
} from "@/model/IncomeSource";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import type mongoose from "mongoose";

export interface UpdateIncomeSourceGetStatusResponse {
  mes: string;
}

export interface UpdateIncomeSourceRequestBody {
  id?: mongoose.Types.ObjectId | string;
  name?: string | null;
  amount?: number;
  currency?: string | null;
  recurrence?: IncomeSourceRecurrence | string;
  anchorDate?: string | Date | null;
  active?: boolean;
  [key: string]: unknown;
}

export interface UpdateIncomeSourceSuccessResponse {
  message: string;
  data: IIncomeSource;
  status: number;
  ok: boolean;
}

export type UpdateIncomeSourceResponse = UpdateIncomeSourceSuccessResponse;

export async function GET(): Promise<NextResponse<UpdateIncomeSourceGetStatusResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<UpdateIncomeSourceResponse>> {
  try {
    if (!request)
      throw new Error("No data in request on UPDATE INCOME SOURCE POST");
    const { id, name, amount, currency, recurrence, anchorDate, active } =
      ((await request.json()) || {}) as UpdateIncomeSourceRequestBody;
    // NO ID FILTER
    if (!id) throw new Error(`No ID was provided to update income source 🤕`);

    // Security fix: this route previously lacked session verification and
    // performed IncomeSource.findById(id) directly with zero ownership check (IDOR).
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and scope the query to the user's wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found...");

    const updateIncomeSource = await IncomeSource.findOne({
      _id: id,
      wallet: userFound.wallet,
    });
    //IF ERROR
    if (!updateIncomeSource)
      throw new Error(`No Income Source was identified to update 🤕`);
    // VERSION HISTORY if amount/recurrence is actually changing
    // `amount` was tested for truthiness, so a change TO 0 was read as "not sent"
    // and neither saved nor recorded in the history (bugs 42 and 43).
    const amountSent = amount !== undefined && amount !== null;
    const isChanging =
      (amountSent && amount !== updateIncomeSource.amount) ||
      (!!recurrence && recurrence !== updateIncomeSource.recurrence);
    if (isChanging) {
      const now = new Date();
      const openEntry = updateIncomeSource.history?.find((h) => !h.effectiveTo);
      if (openEntry) openEntry.effectiveTo = now;
      updateIncomeSource.history = updateIncomeSource.history || [];
      updateIncomeSource.history.push({
        amount: amountSent ? amount : updateIncomeSource.amount,
        recurrence: !recurrence ? updateIncomeSource.recurrence : recurrence,
        effectiveFrom: now,
        effectiveTo: null,
      });
    }
    //UPDATE:
    updateIncomeSource.name = !name ? updateIncomeSource.name : name;
    updateIncomeSource.amount = amountSent ? amount : updateIncomeSource.amount;
    updateIncomeSource.currency = !currency ? updateIncomeSource.currency : currency;
    updateIncomeSource.recurrence = !recurrence
      ? updateIncomeSource.recurrence
      : recurrence;
    updateIncomeSource.anchorDate = !anchorDate
      ? updateIncomeSource.anchorDate
      : (anchorDate as unknown as Date);
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
    throw new Error(e as string);
  }
}

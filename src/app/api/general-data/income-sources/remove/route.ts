import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import IncomeSource, { type IIncomeSource } from "@/model/IncomeSource";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import type mongoose from "mongoose";

// Not exported: a Next.js route file may only export handlers. Kept as the source of the request-body type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const removeIncomeSourceSchema = z
  .object({
    id: z.union([z.string(), z.custom<mongoose.Types.ObjectId>()]).optional(),
  })
  .passthrough();

export type RemoveIncomeSourceRequestBody = z.infer<
  typeof removeIncomeSourceSchema
>;

export interface RemoveIncomeSourceGetStatusResponse {
  mes: string;
}

export type RemoveIncomeSourceGetResponse = RemoveIncomeSourceGetStatusResponse;

export interface RemoveIncomeSourcePostSuccessResponse {
  message: string;
  data: IIncomeSource;
  status: number;
  ok: boolean;
}

export type RemoveIncomeSourcePostResponse =
  RemoveIncomeSourcePostSuccessResponse;

export async function GET(): Promise<NextResponse<RemoveIncomeSourceGetResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<RemoveIncomeSourcePostResponse>> {
  try {
    if (!request)
      throw new Error("No data in request on REMOVE INCOME SOURCE POST");
    const { id } = ((await request.json()) ||
      {}) as RemoveIncomeSourceRequestBody;

    // NO ID FILTER
    if (!id)
      throw new Error(`No ID was provided to removed the income source 🤕`);

    // Security fix (#42): this route previously lacked session verification
    // and performed IncomeSource.findById(id) directly with zero ownership check (IDOR).
    // Anyone knowing/guessing an ObjectId could soft-delete (archive) any user's income source.
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and scope the query to the user's wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found...");

    // SOFT DELETE: keep the document so past months in Projections can still read its history
    const removedIncomeSource = await IncomeSource.findOne({
      _id: id,
      wallet: userFound.wallet,
    });
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
    throw new Error(e as string);
  }
}

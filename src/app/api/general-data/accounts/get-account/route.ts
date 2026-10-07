import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Account from "@/model/Account";

export interface GetAccountSuccessResponse {
  data: unknown;
  message: string;
  status: number;
  ok: boolean;
}

export type GetAccountResponse = GetAccountSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetAccountResponse>> {
  try {
    if (!request) throw new Error("No request received from NEW CATEGORY");
    const userMail = await request.json();
    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: userMail }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided in GET-ACCOUNT POST");
    const userId = userFound._id;
    const walletId = userFound.wallet;

    //FIND CATEGORIES
    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Account.js
    const accountFounded = await (
      Account as unknown as {
        find: (filter: unknown) => {
          sort: (sortObj: unknown) => {
            lean: () => Promise<unknown>;
          };
        };
      }
    )
      .find({
        user: userId,
        wallet: walletId,
      })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    if (!accountFounded)
      throw new Error(
        "No accounts found, review the user and wallet id on GET-ACCOUNT POST"
      );
    return NextResponse.json({
      data: accountFounded,
      message: "Accoutns founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

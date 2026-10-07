import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import "@/model/Category";
import "@/model/SubCategory";
import "@/model/Account";
import "@/model/Tag";
import "@/model/Budget";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";
import { auth } from "@/lib/auth/betterAuth";

export interface GetTransactionsSuccessResponse {
  data: unknown;
  message: string;
  status: number;
  ok: boolean;
}

export type GetTransactionsResponse = GetTransactionsSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetTransactionsResponse>> {
  try {
    if (!request)
      throw new Error("No request received from get-all in Transactions");

    // Security fix: this route previously lacked session verification and trusted
    // whatever userMail was sent in the request body (IDOR), returning another
    // user's entire transaction history. We now verify auth.api.getSession and
    // resolve the user from the session instead.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided in GENERAL-DATA POST");
    const userId = userFound._id;
    const walletId = userFound.wallet;
    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Wallet.js
    const parentWallet = (await (
      Wallet as unknown as {
        findById: (id: unknown) => {
          lean: () => Promise<{ primaryCurrency?: string } | null>;
        };
      }
    )
      .findById(walletId)
      .lean()) as { primaryCurrency?: string } | null;
    //FIND TRANSACTIONS
    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Transaction.js
    const movementsFounded = (await (
      Transaction as unknown as {
        find: (filter: unknown) => {
          populate: (pop: unknown) => {
            populate: (pop: unknown) => {
              populate: (pop: unknown) => {
                populate: (pop: unknown) => {
                  populate: (pop: unknown) => {
                    lean: () => Promise<unknown[]>;
                  };
                };
              };
            };
          };
        };
      }
    )
      .find({
        user: userId,
        wallet: walletId,
      })
      .populate({
        path: "tags",
      })
      .populate({
        path: "account",
      })
      .populate({
        path: "category",
      })
      .populate({
        path: "subCategory",
      })
      .populate({
        path: "budget",
      })
      .lean()) as unknown[];
    if (!movementsFounded)
      throw new Error(
        "No movements found, review the user and wallet id on get-all/transactions in POST"
      );
    const withDisplayMoney = await attachDisplayMoneyToList(
      movementsFounded,
      parentWallet?.primaryCurrency || "MXN"
    );
    return NextResponse.json({
      data: withDisplayMoney,
      message: "Transactions founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

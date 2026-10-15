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
import { createServerTimer } from "@/lib/perf/serverTiming";
import { buildDateWindowFilter } from "@/lib/transactions/historyWindowQuery";

export interface GetTransactionsSuccessResponse {
  data: unknown;
  message: string;
  status: number;
  ok: boolean;
}

export type GetTransactionsResponse = GetTransactionsSuccessResponse;

const POPULATE_FIELDS = {
  tags: "_id name color",
  account: "_id name currency accountType",
  category: "_id name color icon",
  subCategory: "_id name color icon fatherCategory",
  budget: "_id name budgetType icon isSaving category subCategory categories",
};


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
    const timer = createServerTimer();
    const totalStart = performance.now();
    const sesion = await timer.time("session", () => auth.api.getSession({ headers: request.headers }));
    if (!sesion) throw new Error("No session");

    // Optional date window, so the client can ask for the recent months first and
    // the rest of the history afterwards (the body used to be just the email).
    const body = await request.json().catch(() => null);
    const windowFilter = buildDateWindowFilter(body);

    //DB
    await timer.time("db-connect", () => dbConnection());
    // User find
    const userFound = await timer.time("user", () => User.findOne({ mail: sesion.user.email }).lean());
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
    const movementsFounded = (await timer.time("find-populate", () => (
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
        ...windowFilter,
      })
      // Every movement carries its own copy of these documents, so only the fields
      // the interface reads travel (it was ~half of a 7 MB response).
      .populate({ path: "tags", select: POPULATE_FIELDS.tags })
      .populate({ path: "account", select: POPULATE_FIELDS.account })
      .populate({ path: "category", select: POPULATE_FIELDS.category })
      .populate({ path: "subCategory", select: POPULATE_FIELDS.subCategory })
      .populate({ path: "budget", select: POPULATE_FIELDS.budget })
      .lean())) as unknown[];
    if (!movementsFounded)
      throw new Error(
        "No movements found, review the user and wallet id on get-all/transactions in POST"
      );
    const withDisplayMoney = await timer.time("display-money", () =>
      attachDisplayMoneyToList(movementsFounded, parentWallet?.primaryCurrency || "MXN")
    );
    const serializeStart = performance.now();
    const responseBody = JSON.stringify({
      data: withDisplayMoney,
      message: "Transactions founded",
      status: 201,
      ok: true,
    });
    timer.add("serialize", performance.now() - serializeStart);
    timer.add("total", performance.now() - totalStart);
    return new NextResponse(responseBody, {
      headers: { "Content-Type": "application/json", "Server-Timing": timer.header() },
    }) as NextResponse<GetTransactionsResponse>;
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

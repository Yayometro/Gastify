import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Budget from "@/model/Budget";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import "@/model/Category";
import "@/model/SubCategory";
import "@/model/Account";
import "@/model/Tag";

export interface GetBudgetStatusResponse {
  mes: string;
}

export interface GetBudgetSuccessResponse {
  message: string;
  data: unknown;
  status: number;
  ok: boolean;
}

export type GetBudgetResponse = GetBudgetSuccessResponse;

export async function GET(): Promise<NextResponse<GetBudgetStatusResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GetBudgetResponse>> {
  try {
    if (!request) throw new Error("No data in request on NEW BUDGET POST");
    // Security fix: this used to trust whatever mail the client sent in the
    // body (confusingly named `id`), letting any caller (this endpoint
    // isn't covered by middleware.ts's matcher) read another user's
    // budgets - an IDOR, same underlying issue already fixed in
    // get-user/get-wallet/get-categories/get-sub-categories. The only real
    // call site (budgetSlice.ts's fetchBudget) always sends its own
    // session's email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided in GENERAL-DATA POST");
    const userId = userFound._id;
    const walletId = userFound.wallet;

    // FIND WALLET and UPDATE
    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Budget.js
    const findBudgets = await (
      Budget as unknown as {
        find: (filter: unknown) => {
          lean: () => {
            populate: (pop: unknown) => {
              populate: (pop: unknown) => {
                populate: (pop: unknown) => {
                  populate: (pop: unknown) => {
                    populate: (pop: unknown) => {
                      populate: (pop: unknown) => Promise<unknown>;
                    };
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
        archived: { $ne: true },
      })
      .lean()
      .populate({
        path: "category",
        strictPopulate: false,
      })
      .populate({
        path: "subCategory",
        strictPopulate: false,
      })
      .populate({
        path: "categories.category",
        strictPopulate: false,
      })
      .populate({
        path: "categories.subCategory",
        strictPopulate: false,
      })
      .populate({
        path: "linkedAccounts",
        strictPopulate: false,
      })
      .populate({
        path: "linkedTags",
        strictPopulate: false,
      });
    // console.log(findBudgets)
    if (!findBudgets) throw new Error("Updated Budget was not saved 🤕");
    return NextResponse.json({
      message: `Budgest were found successfully 🤓`,
      data: findBudgets,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

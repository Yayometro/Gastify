import { NextResponse, type NextRequest } from "next/server";
import Account, { type IAccount } from "@/model/Account";
import Wallet from "@/model/Wallet";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { SUPPORTED_CURRENCIES, majorToMinor } from "@/lib/money/currencies";
import { auth } from "@/lib/auth/betterAuth";

export interface NewAccountRequestBody {
  name?: string;
  amount?: number;
  accountType?: string;
  currency?: string;
  [key: string]: unknown;
}

export interface NewAccountSuccessResponse {
  message: string;
  data: IAccount;
  status: number;
  ok: boolean;
}

export type NewAccountResponse = NewAccountSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<NewAccountResponse>> {
  try {
    if (!request) throw new Error("No data in request on NEW-ACCOUNT POST");
    const { name, amount, accountType, currency } =
      (await request.json()) as NewAccountRequestBody;
    // Security fix: this route had zero session check - it created the
    // new Account under whatever userId/walletId the client sent in the
    // body, so ANY caller (authenticated or not - this endpoint isn't
    // covered by middleware.ts's matcher) could plant a bogus account
    // inside a completely different user's wallet. Now userId/walletId
    // are always derived from the caller's own session instead of
    // trusted from the body. The only real call site
    // (EditAccountModal.jsx) always sends the caller's own ids anyway.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on NEW-ACCOUNT POST");
    const userId = userFound._id;
    const walletId = userFound.wallet;
    //
    // New Account currency defaults to the Wallet's primary currency
    // when not explicitly chosen.
    let resolvedCurrency = currency;
    if (!resolvedCurrency) {
      // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Wallet.js
      const parentWallet = await (
        Wallet as unknown as {
          findById: (
            id: unknown
          ) => { lean: () => Promise<{ primaryCurrency?: string } | null> };
        }
      )
        .findById(walletId)
        .lean();
      resolvedCurrency = parentWallet?.primaryCurrency || "MXN";
    }
    if (!SUPPORTED_CURRENCIES.includes(resolvedCurrency)) {
      throw new Error(`Unsupported currency: ${resolvedCurrency}`);
    }
    const resolvedAmount = !amount ? 0 : amount;
    //
    const newAccount = new Account({
      user: userId,
      wallet: walletId,
      name: !name ? "Account nameless" : name,
      amount: resolvedAmount,
      accountType: !accountType ? "debit" : accountType,
      currency: resolvedCurrency,
      balanceMinor: majorToMinor(resolvedAmount, resolvedCurrency),
      balanceUpdatedAt: new Date(),
    });
    const savedAccount = await newAccount.save();
    if (!savedAccount)
      throw new Error(`No Account: ${newAccount.name} was saved`);

    return NextResponse.json({
      message: `${newAccount.name} created successfully 🤓`,
      data: savedAccount,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

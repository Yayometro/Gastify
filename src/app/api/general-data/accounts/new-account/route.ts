import { NextResponse, type NextRequest } from "next/server";
import Account, { type IAccount } from "@/model/Account";
import Wallet from "@/model/Wallet";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { SUPPORTED_CURRENCIES, majorToMinor } from "@gastify/core/money/currencies";
import { bankById, normalizeCardNumber } from "@gastify/core/banks/banks";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

export interface NewAccountRequestBody {
  name?: string;
  amount?: number;
  accountType?: string;
  currency?: string;
  bankId?: string | null;
  cardNumber?: string | number | null;
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
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.6"));
    const { name, amount, accountType, currency, bankId, cardNumber } =
      (await request.json()) as NewAccountRequestBody;
    // Security fix: this route had zero session check - it created the
    // new Account under whatever userId/walletId the client sent in the
    // body, so ANY caller (authenticated or not - this endpoint isn't
    // covered by middleware.ts's matcher) could plant a bogus account
    // inside a completely different user's wallet. Now userId/walletId
    // are always derived from the caller's own session instead of
    // trusted from the body. The only real call site
    // (EditAccountModal.jsx) always sends the caller's own ids anyway.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.new.2"));
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
    // Optional bank and card/account number: validated here, not trusted from the client.
    if (bankId && !bankById(bankId)) throw new Error(`Unknown bank: ${bankId}`);
    const card = normalizeCardNumber(cardNumber);
    if (!card.ok) throw new Error(card.message || "Invalid card number");
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
      bankId: bankId || null,
      cardNumber: card.value,
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

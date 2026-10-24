import { NextResponse, type NextRequest } from "next/server";
import Account, { type IAccount } from "@/model/Account";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { SUPPORTED_CURRENCIES, majorToMinor } from "@gastify/core/money/currencies";
import { bankById, normalizeCardNumber } from "@gastify/core/banks/banks";
import { isCardColor, isCardPattern } from "@gastify/core/accounts/cardStyle";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

export interface UpdateAccountRequestBody {
  accountId?: string;
  name?: string;
  amount?: number;
  accountType?: string;
  currency?: string;
  bankId?: string | null;
  cardNumber?: string | number | null;
  cardColor?: string;
  cardPattern?: string;
  [key: string]: unknown;
}

export interface UpdateAccountSuccessResponse {
  message: string;
  data: IAccount;
  status: number;
  ok: boolean;
}

export type UpdateAccountResponse = UpdateAccountSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<UpdateAccountResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.5"));
    const body = (await request.json()) as UpdateAccountRequestBody;
    const { accountId, name, amount, accountType, currency } = body;
    // Security fix: this route had zero ownership/session check at all -
    // it took accountId straight from the client and updated whatever
    // Account matched, no matter who owned it. This endpoint isn't
    // covered by middleware.ts's matcher (dashboard pages only), so it
    // was reachable by ANY caller, authenticated or not. Now the caller's
    // own session resolves their wallet, and the lookup is scoped to an
    // account that actually belongs to it - an id for someone else's
    // account now fails the same "not found" check as a bogus id,
    // instead of silently updating it. The only real call site
    // (EditAccountModal.jsx) always edits the caller's own account.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.update.2"));
    // FIND ACCOUNT
    const findAccount = await Account.findOne({
      _id: accountId,
      wallet: userFound.wallet,
    });
    //IF ERROR
    if (!findAccount) throw new Error(`No Account: ${name} was identified`);

    // Account currency cannot be changed once Transactions are linked to
    // it in this first implementation - the user must create a
    // correctly denominated Account instead.
    if (currency && currency !== findAccount.currency) {
      if (!SUPPORTED_CURRENCIES.includes(currency)) {
        throw new Error(`Unsupported currency: ${currency}`);
      }
      const linkedTransactionsCount = await Transaction.countDocuments({
        account: accountId,
      });
      if (linkedTransactionsCount > 0) {
        throw new Error(
          `Cannot change currency: ${linkedTransactionsCount} transaction(s) are already linked to this account. Create a new account in the target currency instead.`
        );
      }
      findAccount.currency = currency;
    }

    // Bank and card/account number: only touched when the body mentions them (null clears them).
    if ("bankId" in body) {
      if (body.bankId && !bankById(body.bankId)) throw new Error(`Unknown bank: ${body.bankId}`);
      findAccount.bankId = body.bankId || null;
    }
    if ("cardNumber" in body) {
      const card = normalizeCardNumber(body.cardNumber);
      if (!card.ok) throw new Error(card.message || "Invalid card number");
      findAccount.cardNumber = card.value;
    }

    // The card's look: only touched when the body mentions it, and only the values the lists allow.
    if ("cardColor" in body) {
      if (!isCardColor(body.cardColor)) throw new Error(`Unknown card color: ${body.cardColor}`);
      findAccount.cardColor = body.cardColor;
    }
    if ("cardPattern" in body) {
      if (!isCardPattern(body.cardPattern)) throw new Error(`Unknown card pattern: ${body.cardPattern}`);
      findAccount.cardPattern = body.cardPattern;
    }

    findAccount.name = !name ? findAccount.name : name;
    findAccount.accountType = !accountType
      ? findAccount.accountType
      : accountType;
    // The balance is only recalculated when a new one comes in: restyling a card must not touch it.
    if (amount) {
      findAccount.amount = amount;
      findAccount.balanceMinor = majorToMinor(
        findAccount.amount || 0,
        findAccount.currency
      );
      findAccount.balanceUpdatedAt = new Date();
    }
    const savedAccount = await findAccount.save();
    //IF ERROR
    if (!findAccount)
      throw new Error(`No Account: ${findAccount.name} was saved`);

    return NextResponse.json({
      message: `${savedAccount.name} updated successfully 🤓`,
      data: savedAccount,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
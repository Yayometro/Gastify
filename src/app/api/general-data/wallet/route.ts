import Wallet, { IWallet } from "@/model/Wallet";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse, type NextRequest } from "next/server";
import { SUPPORTED_CURRENCIES } from "@gastify/core/money/currencies";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

export interface WalletGetResponse {
  mes: string;
}

export interface UpdateWalletRequestBody {
  name?: string | null;
  cash?: number | null;
  totalBudget?: number | null;
  totalSavings?: number | null;
  isSurpassed?: boolean | null;
  isSaved?: boolean | null;
  primaryCurrency?: string | null;
}

export interface WalletBudget {
  totalBudget?: number;
  totalSavings?: number;
  isSurpassed?: boolean;
  isSaved?: boolean;
}

export interface WalletPostSuccessResponse {
  message: string;
  data: IWallet;
  status: number;
  ok: boolean;
}

export type WalletPostResponse = WalletPostSuccessResponse;

export async function GET(): Promise<NextResponse<WalletGetResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request,
): Promise<NextResponse<WalletPostResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.22"));
    const {
      name,
      cash,
      totalBudget,
      totalSavings,
      isSurpassed,
      isSaved,
      primaryCurrency,
    } = (await request.json()) as UpdateWalletRequestBody;
    // Security fix: this route had zero session check - it updated whatever
    // Wallet matched the client-sent walletId (name/cash/budget/currency),
    // and this endpoint isn't covered by middleware.ts's matcher, so it was
    // reachable by ANY caller, authenticated or not, to modify ANY user's
    // wallet. Now walletId is always derived from the caller's own session
    // instead of trusted from the body. The only real call site
    // (PrimaryCurrencySelector.jsx) always sends the caller's own wallet id
    // anyway.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.wallet"));
    const walletId = userFound.wallet;
    // FIND WALLET
    const findWallet = await Wallet.findById(
      walletId,
    );
    //IF ERROR
    if (!findWallet)
      throw new Error(`No Wallet was identified to update 🤕`);
    //UPDATE WALLET
    findWallet.name = !name ? findWallet.name : name;
    // `??` (not a truthiness test): 0 and false are real values that must be
    // savable (bug 124).
    findWallet.cash = cash ?? findWallet.cash;
    findWallet.budget.totalBudget = totalBudget ?? findWallet.budget.totalBudget;
    findWallet.budget.isSurpassed = isSurpassed ?? findWallet.budget.isSurpassed;
    findWallet.budget.totalSavings = totalSavings ?? findWallet.budget.totalSavings;
    findWallet.budget.isSaved = isSaved ?? findWallet.budget.isSaved;

    // Multi-currency: changes presentation/reporting only, never
    // reinterprets already-stored native Account/Transaction money.
    if (primaryCurrency && primaryCurrency !== findWallet.primaryCurrency) {
      if (!SUPPORTED_CURRENCIES.includes(primaryCurrency)) {
        throw new Error(`Unsupported currency: ${primaryCurrency}`);
      }
      findWallet.primaryCurrency = primaryCurrency;
      findWallet.currencyUpdatedAt = new Date();
    }

    // SAVE
    const updatedWallet = await findWallet.save();
    //IF ERROR
    if (!updatedWallet) throw new Error(t("errors.wallet.was.not.updated"));
    return NextResponse.json({
      message: `${updatedWallet.name} was updated successfully 🤓`,
      data: updatedWallet,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}

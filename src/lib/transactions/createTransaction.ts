import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import Account from "@/model/Account";
import Budget from "@/model/Budget";
import Wallet from "@/model/Wallet";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { attachDisplayMoneyToList, type WithDisplayMoney } from "@/lib/money/server/transactionReadService";

export interface OwnableDocument {
  user?: unknown;
  wallet?: unknown;
}

export interface CreateTransactionParams {
  user: unknown;
  wallet: unknown;
  name?: string | null;
  amount?: number | string | null;
  isIncome?: boolean | null;
  isBill?: boolean | null;
  isReadable?: boolean | null;
  date?: Date | string | null;
  account?: string | null;
  category?: string | null;
  subCategory?: string | null;
  tags?: string[] | string | null;
  budget?: string | null;
  merchantAmount?: number | string | null;
  merchantCurrency?: string | null;
  manualReportingAmount?: number | string | null;
}

export interface CreateTransactionResult<T = Record<string, unknown>> {
  transaction: WithDisplayMoney<T>;
  name?: string;
}

// Throws `message` unless `doc` exists and either carries `defaultFlag` (a
// shared default, usable by any user) or actually belongs to this user's
// wallet. Deliberately uses the same "not found" message whether the id
// doesn't exist at all or exists but belongs to someone else - an agent
// (or any caller) shouldn't be able to distinguish "no such id" from
// "that id isn't yours" by probing ids.
function assertOwnedOrDefault<T extends OwnableDocument>(
  doc: T | null | undefined,
  user: unknown,
  wallet: unknown,
  message: string,
  defaultFlag?: string
): T {
  if (!doc) throw new Error(message);
  if (defaultFlag && (doc as Record<string, unknown>)[defaultFlag]) return doc;
  if (String(doc.user) !== String(user) || String(doc.wallet) !== String(wallet)) {
    throw new Error(message);
  }
  return doc;
}

// Shared by the app's own new-transaction route and by the AI-agent MCP
// connector (see .mds/AI_AGENT_CONNECTOR_PLAN.md) - both need identical
// transaction-creation behavior, so this is the single source of truth.
export async function createTransaction({
  user,
  wallet,
  name,
  amount,
  isIncome,
  isBill,
  isReadable,
  date,
  account,
  category,
  subCategory,
  tags,
  budget,
  merchantAmount,
  merchantCurrency,
  manualReportingAmount,
}: CreateTransactionParams): Promise<CreateTransactionResult> {
  if (!user) throw new Error("No User ID found to create a new Transaction");
  if (!wallet)
    throw new Error("No Wallet ID found to create a new Transaction");
  // Missing is not the same as zero: a 0 amount is a valid movement (bug 88).
  if (amount === undefined || amount === null || (amount as unknown) === "")
    throw new Error("No Amount found to create a new Transaction");
  if (!isIncome && !isBill) {
    isBill = true;
  }
  if (isIncome == true && isBill == true) {
    isBill = true;
    isIncome = false;
  }
  // Only a MISSING value defaults to readable; an explicit false is kept (bug 89).
  if (isReadable === undefined || isReadable === null) isReadable = true;

  await dbConnection();

  // Multi-currency: resolve the Account's native currency (or the
  // Wallet's primary currency when no Account is selected) and build the
  // full money object here, rather than leaving it to the Transaction
  // model's MXN-only pre-validate fallback.
  const parsedDate = !date ? new Date() : new Date(date);
  const selectedAccount = account ? await Account.findById(account).lean() : null;
  if (account) {
    assertOwnedOrDefault(selectedAccount, user, wallet, "Account not found for this user");
  }
  const parentWallet = await Wallet
    .findById(wallet)
    .lean();
  if (!parentWallet) throw new Error("No Wallet found to create a new Transaction");
  // .lean() never applies schema defaults - a real Account/Wallet document
  // that predates the multi-currency migration has no currency/
  // primaryCurrency field in its stored BSON at all, so this must default
  // explicitly rather than silently reading `undefined`.
  const walletPrimaryCurrency = parentWallet.primaryCurrency || "MXN";
  const accountCurrency = selectedAccount?.currency || walletPrimaryCurrency;
  const money = await buildTransactionMoney({
    accountAmount: amount,
    accountCurrency,
    merchantAmount,
    merchantCurrency,
    walletPrimaryCurrency,
    date: parsedDate,
    manualReportingAmount,
  });

  const newTransaction = new Transaction({
    user,
    wallet,
    name: !name ? "transaction nameless" : name,
    amount,
    isIncome,
    isBill,
    isReadable,
    date: parsedDate,
    account: !account ? null : account,
    kind: isIncome ? "income" : "expense",
    direction: isIncome ? "credit" : "debit",
    money,
  });
  if (subCategory) {
    const findSubCategory = await SubCategory.findById(subCategory).lean();
    assertOwnedOrDefault(
      findSubCategory,
      user,
      wallet,
      "No SUB-CATEGORY found at NEW TRANSACTION",
      "isDefaultSubCatego"
    );
    newTransaction.category = findSubCategory.fatherCategory;
    newTransaction.subCategory = findSubCategory._id;
  }
  if (category && !subCategory) {
    const foundCategory = await Category.findById(category).lean();
    assertOwnedOrDefault(
      foundCategory,
      user,
      wallet,
      "Category not found for this user",
      "isDefaultCatego"
    );
    newTransaction.category = foundCategory._id;
  }
  if (budget) {
    const linkedBudget = await Budget.findOne({ _id: budget, user, wallet, archived: { $ne: true } });
    if (!linkedBudget || (linkedBudget.budgetType || (linkedBudget.isSaving ? "saving" : "spending")) !== "project") {
      throw new Error("Project budget was not found for this transaction");
    }
    newTransaction.budget = linkedBudget._id;
  }
  // `tags` may arrive as a comma-separated string (the new-transaction route allows it): iterating a
  // string walked it character by character and created one tag per letter (bug 86).
  const tagNames: string[] = (typeof tags === "string" ? (tags as string).split(",") : tags || [])
    .map((tag) => String(tag).trim())
    .filter(Boolean);
  for (const tag of tagNames) {
    //Use "for of", because it handles async rather than map or foreach
    const findTag = await Tag.findOne({ name: tag, user, wallet });
    if (!findTag) {
      const newTag = new Tag({ name: tag, user, wallet });
      if (!newTag)
        throw new Error("No tag created on NEW TRANSACTION POST");
      newTransaction.tags.push(newTag._id);
      await newTag.save();
    }
    if (findTag) {
      newTransaction.tags.push(findTag._id);
    }
  }
  const savedTransaction = await newTransaction.save();
  if (!savedTransaction)
    throw new Error("NEW TRANSACTIONS could not be saved on POST");
  const finalTransaction = await Transaction.findById(savedTransaction._id)
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
    .lean();
  if (!finalTransaction)
    throw new Error("NEW TRANSACTIONS could not be loaded on POST");
  const [transactionWithDisplayMoney] = await attachDisplayMoneyToList(
    [finalTransaction],
    walletPrimaryCurrency
  );

  return {
    transaction: transactionWithDisplayMoney,
    name: savedTransaction.name,
  };
}

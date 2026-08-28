import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import Account from "@/model/Account";
import Budget from "@/model/Budget";
import Wallet from "@/model/Wallet";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";

// Throws `message` unless `doc` exists and either carries `defaultFlag` (a
// shared default, usable by any user) or actually belongs to this user's
// wallet. Deliberately uses the same "not found" message whether the id
// doesn't exist at all or exists but belongs to someone else - an agent
// (or any caller) shouldn't be able to distinguish "no such id" from
// "that id isn't yours" by probing ids.
function assertOwnedOrDefault(doc, user, wallet, message, defaultFlag) {
  if (!doc) throw new Error(message);
  if (defaultFlag && doc[defaultFlag]) return doc;
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
}) {
  if (!user) throw new Error("No User ID finded to create a new Transaction");
  if (!wallet)
    throw new Error("No Wallet ID finded to create a new Transaction");
  if (!amount)
    throw new Error("No Amount finded to create a new Transaction");
  if (!isIncome && !isBill) {
    isBill = true;
  }
  if (isIncome == true && isBill == true) {
    isBill = true;
    isIncome = false;
  }
  if (!isReadable) isReadable = true;

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
  const parentWallet = await Wallet.findById(wallet).lean();
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

  const newTransacction = new Transaction({
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
    let findSubCategory = await SubCategory.findById(subCategory).lean();
    assertOwnedOrDefault(
      findSubCategory,
      user,
      wallet,
      "No SUB-CATEGORY found at NEW TRANSACTION",
      "isDefaultSubCatego"
    );
    newTransacction.category = findSubCategory.fatherCategory;
    newTransacction.subCategory = findSubCategory._id;
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
    newTransacction.category = foundCategory._id;
  }
  if (budget) {
    const linkedBudget = await Budget.findOne({ _id: budget, user, wallet, archived: { $ne: true } });
    if (!linkedBudget || (linkedBudget.budgetType || (linkedBudget.isSaving ? "saving" : "spending")) !== "project") {
      throw new Error("Project budget was not found for this transaction");
    }
    newTransacction.budget = linkedBudget._id;
  }
  if (tags) {
    if (tags.length > 0) {
      for (const tag of tags) {
        //Use "for of", because it handles async rather than map or foreach
        const findTag = await Tag.findOne({ name: tag, user, wallet });
        if (!findTag) {
          const newTag = new Tag({ name: tag, user, wallet });
          if (!newTag)
            throw new Error("No tag created on NEW TRANSACTION POST");
          newTransacction.tags.push(newTag._id);
          await newTag.save();
        }
        if (findTag) {
          newTransacction.tags.push(findTag._id);
        }
      }
    }
  }
  const savedTransacction = await newTransacction.save();
  if (!savedTransacction)
    throw new Error("NEW TRANSACTIONS could not be saved on POST");
  const finalTransaction = await Transaction.findById(savedTransacction._id)
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
    name: savedTransacction.name,
  };
}

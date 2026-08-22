import dbConnection from "../../../dbConnection";
import { NextResponse } from "next/server";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import { minorToMajor } from "@/lib/money/currencies";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on Update Many Trans");
    const body = await request.json();
    const {
      transactions,
      fields, // array of field names to update, e.g. ["name"] or ["category","subCategory"]
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
    } = body;

    await dbConnection();

    if (!transactions || transactions.length === 0)
      throw new Error("No transaction IDs passed to edit-many");

    // If no fields array provided fall back to updating all truthy values (legacy behaviour)
    const targeted = Array.isArray(fields) && fields.length > 0;
    const shouldUpdate = (field) => !targeted || fields.includes(field);

    const walletCache = new Map();
    async function getWalletCached(walletId) {
      const key = String(walletId);
      if (!walletCache.has(key)) {
        walletCache.set(key, await Wallet.findById(walletId).lean());
      }
      return walletCache.get(key);
    }

    // Bulk Account reassignment is only safe automatically when every
    // selected Transaction already shares the destination Account's
    // currency - a mixed-currency bulk move requires per-Transaction
    // conversion strategy (handled individually, not in bulk). Validate
    // this up front so the action either fully applies or is fully blocked.
    if (shouldUpdate("account") && account) {
      const destinationAccount = await Account.findById(account).lean();
      if (!destinationAccount) throw new Error("Destination account not found for bulk account reassignment");
      const destCurrency = destinationAccount.currency || "MXN";

      for (const transId of transactions) {
        const t = await Transaction.findById(transId).lean();
        if (!t) throw new Error(`Transaction ${transId} not found`);
        const w = await getWalletCached(t.wallet);
        const tCurrency = t.money?.account?.currency || w?.primaryCurrency || "MXN";
        if (tCurrency !== destCurrency) {
          throw new Error(
            `Bulk account reassignment blocked: destination Account is ${destCurrency} but at least one selected Transaction is ${tCurrency}. Reassign mismatched-currency transactions individually instead.`
          );
        }
      }
    }

    let savedTrans = [];

    for (const transId of transactions) {
      const transaction = await Transaction.findById(transId);
      if (!transaction) throw new Error(`Transaction ${transId} not found`);

      const parentWallet = await getWalletCached(transaction.wallet);
      const currentAccountCurrency = transaction.money?.account?.currency || parentWallet?.primaryCurrency || "MXN";
      const amountTouched = shouldUpdate("amount") && amount !== undefined && amount !== "";
      const accountTouched = shouldUpdate("account");
      const dateTouched = shouldUpdate("date") && Boolean(date);

      if (shouldUpdate("name") && name !== undefined && name !== "")
        transaction.name = name;

      if (amountTouched) transaction.amount = amount;

      if (shouldUpdate("isIncome") || shouldUpdate("isBill")) {
        if (isIncome !== undefined) transaction.isIncome = isIncome;
        if (isBill !== undefined) transaction.isBill = isBill;
      }

      if (shouldUpdate("isReadable") && isReadable !== undefined)
        transaction.isReadable = isReadable;

      if (dateTouched)
        transaction.date = new Date(date);

      if (accountTouched)
        transaction.account = account || null;

      if (amountTouched || accountTouched || dateTouched) {
        // Already validated same-currency above when the Account changes,
        // so no per-transaction conversion strategy is needed here.
        const nextAccountCurrency = accountTouched
          ? (account ? (await Account.findById(account).lean())?.currency || parentWallet?.primaryCurrency || "MXN" : parentWallet?.primaryCurrency || "MXN")
          : currentAccountCurrency;
        const resolvedAmount = amountTouched
          ? amount
          : transaction.money?.account
          ? minorToMajor(transaction.money.account.amountMinor, transaction.money.account.currency)
          : transaction.amount;

        transaction.amount = resolvedAmount;
        transaction.money = await buildTransactionMoney({
          accountAmount: resolvedAmount,
          accountCurrency: nextAccountCurrency,
          walletPrimaryCurrency: parentWallet?.primaryCurrency || "MXN",
          date: transaction.date,
        });
      }

      transaction.kind = transaction.isIncome ? "income" : "expense";
      transaction.direction = transaction.isIncome ? "credit" : "debit";

      // Category / subcategory
      if (shouldUpdate("subCategory") && subCategory) {
        const foundSub = await SubCategory.findById(subCategory);
        if (!foundSub) throw new Error("SubCategory not found at edit-many");
        transaction.subCategory = foundSub._id;
        transaction.category = foundSub.fatherCategory;
      } else if (shouldUpdate("category") && category && !subCategory) {
        transaction.category = category;
        if (shouldUpdate("subCategory")) transaction.subCategory = null;
      }

      // Tags — only update if field is targeted or tags array is provided
      if (shouldUpdate("tags") && Array.isArray(tags)) {
        const newTags = [];
        for (const tagName of tags.filter(Boolean)) {
          let found = await Tag.findOne({ name: tagName, user: transaction.user });
          if (!found) {
            found = await Tag.create({ name: tagName, user: transaction.user });
          }
          newTags.push(found._id);
        }
        transaction.tags = newTags;
      }

      const updated = await transaction.save();
      const populated = await Transaction.findById(updated._id)
        .populate("tags")
        .populate("account")
        .populate("category")
        .populate("subCategory");

      savedTrans.push(populated);
    }

    return NextResponse.json({
      message: `${savedTrans.length} transaction(s) updated successfully 😎`,
      data: savedTrans,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.error("edit-many error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Unexpected error" }, { status: 500 });
  }
}

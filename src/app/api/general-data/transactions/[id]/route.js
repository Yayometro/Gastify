import dbConnection from "../../../dbConnection";
import { NextResponse } from "next/server";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import Account from "@/model/Account";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import Budget from "@/model/Budget";
import Wallet from "@/model/Wallet";
import { minorToMajor } from "@/lib/money/currencies";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { convert } from "@/lib/money/server/fxRateService";

export async function POST(request, { params }) {
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    let {
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
      // Required only when reassigning to an Account in a different
      // currency: "convert" (preserve reporting value), "reinterpret" (keep
      // the number, relabel currency), or "manual" (caller supplies `amount`
      // explicitly in the new currency). The server never infers this.
      currencyStrategy,
    } = await request.json();
    //Validators
    if (!params)
      throw new Error("No params ID send to work on POST UPDATE TRANSACTION");
    // //

    await dbConnection();
    const findTrans = await Transaction.findById(params.id);

    if (!findTrans)
      throw new Error("No Transactions found work on POST UPDATE TRANSACTION");

    const parentWallet = await Wallet.findById(findTrans.wallet).lean();
    if (!parentWallet) throw new Error("No Wallet found for this Transaction");

    const currentAccountCurrency = findTrans.money?.account?.currency || parentWallet.primaryCurrency;
    const accountChanged = account !== undefined && String(account || "") !== String(findTrans.account || "");
    const amountProvided = amount !== undefined && amount !== "";

    let nextAccount = findTrans.account;
    let nextAccountCurrency = currentAccountCurrency;
    let resolvedAmount = amountProvided
      ? amount
      : findTrans.money?.account
      ? minorToMajor(findTrans.money.account.amountMinor, findTrans.money.account.currency)
      : findTrans.amount;

    if (accountChanged) {
      nextAccount = account || null;
      const newAccountDoc = nextAccount ? await Account.findById(nextAccount).lean() : null;
      nextAccountCurrency = newAccountDoc?.currency || parentWallet.primaryCurrency;

      if (nextAccountCurrency !== currentAccountCurrency) {
        if (!currencyStrategy) {
          throw new Error(
            `Changing to an Account in a different currency (${currentAccountCurrency} -> ${nextAccountCurrency}) requires an explicit choice: convert, reinterpret, or manual.`
          );
        }
        if (currencyStrategy === "reinterpret") {
          // Keep the same number, just relabel the currency - resolvedAmount
          // already defaults to the current native major amount above.
        } else if (currencyStrategy === "manual") {
          if (!amountProvided)
            throw new Error("The manual currency strategy requires an explicit amount in the new Account's currency");
        } else if (currencyStrategy === "convert") {
          const sourceMinor = findTrans.money?.account?.amountMinor
            ?? Math.round((findTrans.amount || 0) * 100);
          const quote = await convert({
            amountMinor: sourceMinor,
            fromCurrency: currentAccountCurrency,
            toCurrency: nextAccountCurrency,
            date: findTrans.date,
          });
          if (!quote.available) {
            throw new Error(
              `Exchange-rate estimate unavailable to convert ${currentAccountCurrency} -> ${nextAccountCurrency}. Try again in a moment.`
            );
          }
          resolvedAmount = minorToMajor(quote.amountMinor, nextAccountCurrency);
        } else {
          throw new Error(`Unknown currencyStrategy: ${currencyStrategy}`);
        }
      }
    }

    const dateChanged = date !== undefined && date !== null && date !== "" &&
      new Date(date).getTime() !== new Date(findTrans.date).getTime();
    const parsedDate = dateChanged ? new Date(date) : findTrans.date;

    // Preserve an existing exact manual/provider reporting snapshot when
    // nothing monetary about this edit actually changed - do not silently
    // discard an exact value in favor of a re-estimated one (plan section 9.1).
    const existingReporting = findTrans.money?.reporting;
    const accountCurrencyChanged = accountChanged && nextAccountCurrency !== currentAccountCurrency;
    const canPreserveExistingReporting =
      !amountProvided &&
      !accountCurrencyChanged &&
      !dateChanged &&
      manualReportingAmount === undefined &&
      existingReporting &&
      ["manual", "provider_import", "revolut"].includes(existingReporting.source);

    let money;
    if (canPreserveExistingReporting) {
      money = {
        account: { amountMinor: findTrans.money.account.amountMinor, currency: findTrans.money.account.currency },
        merchant: findTrans.money?.merchant || null,
        reporting: existingReporting,
      };
    } else {
      money = await buildTransactionMoney({
        accountAmount: resolvedAmount,
        accountCurrency: nextAccountCurrency,
        merchantAmount,
        merchantCurrency,
        walletPrimaryCurrency: parentWallet.primaryCurrency,
        date: parsedDate,
        manualReportingAmount,
      });
    }
    // A merchant field left untouched in this edit keeps its existing value
    // rather than being wiped by an absent merchantAmount/merchantCurrency.
    if (merchantAmount === undefined && merchantCurrency === undefined && findTrans.money?.merchant) {
      money.merchant = findTrans.money.merchant;
    }

    // UPDATES:
    findTrans.name = !name ? findTrans.name : name;
    findTrans.amount = resolvedAmount;
    findTrans.isIncome = !isIncome ? findTrans.isIncome : isIncome;
    findTrans.isBill = !isBill ? findTrans.isBill : isBill;
    findTrans.isReadable = !isReadable ? findTrans.isReadable : isReadable;
    findTrans.date = parsedDate;
    findTrans.account = accountChanged ? nextAccount : findTrans.account;
    findTrans.kind = findTrans.isIncome ? "income" : "expense";
    findTrans.direction = findTrans.isIncome ? "credit" : "debit";
    findTrans.money = money;
    if (budget !== undefined) {
      if (!budget) {
        findTrans.budget = null;
      } else {
        const linkedBudget = await Budget.findOne({
          _id: budget,
          user: findTrans.user,
          wallet: findTrans.wallet,
          archived: { $ne: true },
        });
        if (!linkedBudget || (linkedBudget.budgetType || (linkedBudget.isSaving ? "saving" : "spending")) !== "project") {
          throw new Error("Project budget was not found for this transaction");
        }
        findTrans.budget = linkedBudget._id;
      }
    }
    // SUB CCATEGORY UPD
    if (subCategory) {
      if (findTrans.subCategory !== subCategory) {
        let findSubCategory = await SubCategory.findById(subCategory).lean();
        
        if (!findSubCategory)
          throw new Error("No SUB-CATEGORY found at UPDATE TRANSACTION");
        findTrans.category = findSubCategory.fatherCategory;
        findTrans.subCategory = findSubCategory._id;
      }
    }
    // CATEGORY UPDATE
    if (category && !subCategory) {
      
      findTrans.category = !category ? findTrans.category : category;
    }
    // TAGS UPDATE
    if (Array.isArray(tags)) {
      const newTags = [];
      for (const tag of tags) {
        const findTag = await Tag.findOne({ name: tag, user: findTrans.user });
        if (!findTag) {
          const newTag = new Tag({ name: tag, user: findTrans.user, wallet: findTrans.wallet });
          if (!newTag)
            throw new Error("No tag created on UPDATED TRANSACTION POST");
          newTags.push(newTag._id);
          await newTag.save();
        } else {
          newTags.push(findTag._id);
        }
      }
      findTrans.tags = newTags;
    }
    
    //SAVE
    const updatedTrans = await findTrans.save()
    
    if (!updatedTrans)
      throw new Error("NEW TRANSACTIONS could not be saved on POST");
    const transToSend = await Transaction.findById(updatedTrans._id)
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
        });
    
    if (!transToSend)
      throw new Error("Updated transaction -transToSend- could not be loaded to send");
    return NextResponse.json({
      message: `${
        updatedTrans.name ? updatedTrans.name : "Transacion"
      } was updated successfully 😎`,
      data: transToSend,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

//Logers:
// console.log(
//      user,
//      wallet,
//      name,
//      amount,
//      isIncome,
//      isBill,
//      isReadable,
//      date,
//      categories,
//      tags,
//      accounts)

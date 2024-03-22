import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import User from "@/model/User";
import Account from "@/model/Account";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    let transObj = await request.json();
    console.log(transObj);
    //Variables
    // Title extraction regex
    let titleRegex =
      /(?:title|titulo|name|nombre|descripción|descripcion)[\s:]*["']?([^,"']+)[,"']?/i;
    // Amount extraction regex
    let amountRegex =
      /(?:value|valor|amount|monto|suma|number)\s*of\s*\$?([0-9,]+)/i;
    // Date extraction regex
    let dateRegex =
      /(?:dated\s*(?:on|for)|para\s*el\s*dia|fecha)\s*([A-Za-z]+)\s*([0-9]+)(?:\s*of|de)\s*([0-9]+)/i;
    // Time extraction regex
    let timeRegex = /(?:at|a\s*las)\s*([0-9]+:[0-9]+)\s*(a\.m\.|p\.m\.|am|pm)/i;
    // Category extraction regex
    let categoryRegex =
      /(?:with\s*a|con\s*la)\s*(\w+)\s*(?:category|categoria)/i;
    // Account extraction regex
    let accountRegex = /(?:in\s*the|en\s*la)\s*(\w+)\s*(?:account|cuenta)/i;
    // Extracting data using the regexes:
    const titleMatch = transObj.text.match(titleRegex);
    const amountMatch = transObj.text.match(amountRegex);
    const dateMatch = transObj.text.match(dateRegex);
    const timeMatch = transObj.text.match(timeRegex);
    const categoryMatch = transObj.text.match(categoryRegex);
    const accountMatch = transObj.text.match(accountRegex);
    //CLG
    console.log(titleMatch);
    console.log(amountMatch);
    console.log(dateMatch);
    console.log(timeMatch);
    console.log(categoryMatch);
    console.log(accountMatch);
    //Validating escential data
    if (!titleMatch) {
        console.log(titleMatch)
        throw new Error("Title of transaction data is missing and is required");
    }
    if (!amountMatch) {
        console.log(amountMatch)
      throw new Error("Amount of transaction data is missing and is required");
    }

    // Constructing the transaction object:
    let transaction = {
      name: titleMatch ? titleMatch[1] : "Unnamed Transaction",
      amount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, "")) : 0,
      date: new Date(), // Default date: today. This will be overridden if date and time are found.
      category: categoryMatch ? categoryMatch[1] : null,
      isBill: true, // Default to expense. This could be adjusted based on further analysis.
      isIncome: false, // Adjusted based on context.
      account: accountMatch ? accountMatch[1] : null,
    };

    // Adjust the date and time if found:
    if (dateMatch && timeMatch) {
      let hours = parseInt(timeMatch[1].split(":")[0]);
      let minutes = parseInt(timeMatch[1].split(":")[1]);
      let isPM =
        timeMatch[2].toLowerCase().includes("p.m.") ||
        timeMatch[2].toLowerCase().includes("pm");
      let isAM =
        timeMatch[2].toLowerCase().includes("a.m.") ||
        timeMatch[2].toLowerCase().includes("am");
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      let monthIndex = new Date(dateMatch[1] + " 1, 2000").getMonth(); // Convert month name to number
      transaction.date = new Date(
        `${dateMatch[3]}-${monthIndex + 1}-${
          dateMatch[2]
        } ${hours}:${minutes}:00`
      );
    } else if (dateMatch) {
      let monthIndex = new Date(dateMatch[1] + " 1, 2000").getMonth(); // Convert month name to number without specific time
      transaction.date = new Date(
        `${dateMatch[3]}-${monthIndex + 1}-${dateMatch[2]}`
      );
    }
    // Processing the 'types' to set 'isBill' and 'isIncome' accordingly.
    if (transObj.lang === "English") {
      let typesRegex =
        /(create|new|add|generate) (a|an|one) (expense|income|bill|transaction)/i;
      const typesMatch = transObj.text.match(typesRegex);
      console.log(typesMatch)
      if (typesMatch) {
        transaction.isBill = /expense|bill/.test(typesMatch[3]);
        console.log(transaction.isBill)
        transaction.isIncome = /income/.test(typesMatch[3]);
        console.log(transaction.isIncome)
      }
    } else if (transObj.lang === "Spanish") {
      // Integración en español para determinar el tipo de transacción
      let typesRegexSpanish =
        /(crea|agrega|añade|genera) (un|una) (nuevo|nueva) (gasto|ingreso|transacción)/i;
      const typesMatchSpanish = transObj.text.match(typesRegexSpanish);
      if (typesMatchSpanish) {
        transaction.isBill = /gasto/.test(typesMatchSpanish[4]);
        transaction.isIncome = /ingreso/.test(typesMatchSpanish[4]);
      }
    }

    console.log(transaction);

    await dbConnection();
    const findUser = await User.findById(transObj.user).lean();
    if (!findUser)
      throw new Error("No User ID finded to create a new Transaction");
    console.log(findUser);
    const newTransacction = new Transaction({
      user: findUser._id,
      wallet: findUser.wallet,
      name: !transaction.name ? "transaction nameless" : transaction.name,
      amount: transaction.amount,
      isIncome: transaction.isIncome,
      isBill: transaction.isBill,
      isReadable: true,
      date: !transaction.date ? new Date() : transaction.date,
      account: null,
      category: null,
    });
    console.log(newTransacction);
    if (transaction.category) {
      const categoryFound = await Category.findOne({
        name: new RegExp(`^${transaction.category}$`, "i"),
        user: findUser._id,
      });
      console.log(categoryFound);
      if (!categoryFound) {
        console.log(categoryFound);
        newTransacction.category = null
      } else {
        newTransacction.category = categoryFound._id;
      }
    }
    if (transaction.account) {
      console.log(transaction.account);
      const accountFound = await Account.findOne({
        name: new RegExp(`^${transaction.account}$`, "i"),
        user: findUser._id,
      });
      console.log(accountFound);
      if (!accountFound) {
        console.log(accountFound);
        newTransacction.account = null;
      } else {
        newTransacction.account = accountFound._id;
      }
    }
    const savedTransacction = await newTransacction.save();
    if (!savedTransacction)
      throw new Error(
        "NEW TRANSACTIONS could not be saved on Speach New Transaction Post"
      );
    console.log(savedTransacction);
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
      });
    if (!finalTransaction)
      throw new Error("NEW TRANSACTIONS could not be loaded on POST");
    console.log(finalTransaction);
    return NextResponse.json({
      message: `${
        savedTransacction.name || "Transaction"
      } using voice was created successfully 😎`,
      data: finalTransaction,
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
//     user,
//     wallet,
//     name,
//     amount,
//     isIncome,
//     isBill,
//     isReadable,
//     date,
//     account,
//     category,
//     subCategory,
//     tags
// )

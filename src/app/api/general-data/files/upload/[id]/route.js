import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";

export async function POST(request, { params }) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    //Transform to bytes and buffer.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    //Path and Saved the file
    const tmpFilePath = path.join('/tmp', file.name);
    await writeFile(tmpFilePath, buffer);
    // Read and process the Excel File
    const workbook = await xlsxPopulate.fromFileAsync(tmpFilePath);
    const sheet = workbook.sheet(0); // Getting the first page
    
    if (!params)
      throw new Error("No params ID send to work on POST UPDATE TRANSACTION");
    //Find USER
    await dbConnection();
    const userFound = await User.findOne({ mail: params.id }).lean();
    if (!userFound)
      throw new Error({
        error:
          "User not found, review the email provided in Create trans from file",
      });
    //New logic to identify the last col with data and proccess the row
    let i = 2; // Asoming the first row holds headers. We start from second row
    let isEmpty = false;
    const transactions = [];
    // Function to convert Excel serial number to a date in JavaScript
    function excelSerialDateToJSDate(serial) {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400; // convert days to seconds
      const date_info = new Date(utc_value * 1000); // convert seg to ms

      // Adjust Time Zone 
      const offset = date_info.getTimezoneOffset() * 60000;
      const date = new Date(date_info.getTime() + offset);
      return date;
    }
    while (!isEmpty) {
      const dateCell = sheet.cell(`A${i}`);
      const serialDate = dateCell.value(); // Get the date value as an Excel serial number
      if (serialDate !== null && serialDate !== undefined) {
        // Convert serial number to readable date
        const date = excelSerialDateToJSDate(serialDate);
        // Process the row
        const concept = sheet.cell(`B${i}`).value() || "no concept";
        const bill = sheet.cell(`C${i}`).value() || 0;
        const income = sheet.cell(`D${i}`).value() || 0;
        transactions.push({
          date,
          name: concept,
          amount: bill || income || 0,
          isBill: !!bill,
          isIncome: !!income,
          isReadable: true,
          user: userFound._id,
          wallet: userFound.wallet,
        });
        i++; // Go to next row 
      } else {
        isEmpty = true; // If there's more data, exit the loop
      }
    }
    // Create TRANSACTIONS
    const newTransactions = await Transaction.create(transactions);
    //Error:
    if (!newTransactions) {
      throw new Error(
        "NEW TRANSACTIONS could not be saved on CREATE MANY TRANS WITH FILE"
      );
    }
    // Remove it after creation on database
    await unlink(tmpFilePath);
    //
    return NextResponse.json({
      data: newTransactions,
      message: "File saved",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
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
    //Path
    const filePath = path.join(process.cwd(), "public/filesTemp", file.name);
    //Saved the file
    writeFile(filePath, buffer);
    
    // Read and process the Excel File
    const workbook = await xlsxPopulate.fromFileAsync(filePath);
    const sheet = workbook.sheet(0); // Acceder a la primera hoja
    const transactions = [];
    const lastRow = sheet.usedRange().endRowNumber();
    
    if (!params)
      throw new Error("No params ID send to work on POST UPDATE TRANSACTION");
    // //
    //Find USER
    await dbConnection();
    const userFound = await User.findOne({ mail: params.id }).lean();
    
    if (!userFound)
      throw new Error({
        error:
          "User not found, review the email provided in Create trans from file",
      });
    // Iterar sobre las filas
    for (let i = 2; i <= lastRow; i++) {
      const date = sheet.cell(`A${i}`).value() || new Date();
      const concept = sheet.cell(`B${i}`).value() || "no concept";
      const bill = sheet.cell(`C${i}`).value() || 0;
      const income = sheet.cell(`D${i}`).value() || 0; // Asumiendo que si no hay ingreso, es 0

      // Crear el objeto y agregarlo al array
      transactions.push({
        date,
        name: concept,
        amount: bill || income || 0,
        isBill: bill ? true : false,
        isIncome: income ? true : false,
        isReadable: true,
        user: userFound._id,
        wallet: userFound.wallet,
      });
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
    await unlink(filePath);
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

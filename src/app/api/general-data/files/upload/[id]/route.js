import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import xlsxPopulate from 'xlsx-populate'
import Transaction from "@/model/Transaction";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";

export async function POST(request, { params }) {
  try {
    console.log("first");
    const data = await request.formData();
    console.log(data);
    const file = data.get("file");
    console.log(file);
    //Transform to bytes and buffer.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    //Path
    const filePath = path.join(process.cwd(), "public/filesTemp", file.name);
    //Saved the file
    await writeFile(filePath, buffer);
    console.log("first");
    console.log(filePath)
    // Read and process the Excel File
    const workbook = await xlsxPopulate.fromFileAsync(filePath);
    // console.log(workbook)
    const sheet = workbook.sheet(0); // Acceder a la primera hoja
    console.log(sheet)
    // const transactions = [];
    // const lastRow = workbook.sheet(0).usedRange().endRowNumber();
    // const lastRows = sheet.usedRange().endRowNumber();
    // const lastRow = sheet.usedRange() // Obtener la última fila de la hoja
    // // const lastRowNumber = lastRow ? lastRow.rowNumber() : 0; 
    // console.log(lastRow)
    // console.log("first");
    if (!params)
      throw new Error("No params ID send to work on POST UPDATE TRANSACTION");
    // 
    console.log(params)
    //Find USER
    await dbConnection();
    const userFound = await User.findOne({ mail: params.id }).lean();
    console.log("first");
    if (!userFound)
      throw new Error({
        error:
          "User not found, review the email provided in Create trans from file",
      });
      console.log("first");
      // Nueva lógica para determinar la última fila con datos y procesar las filas
let i = 2; // Asumiendo que la primera fila contiene encabezados y empiezas desde la segunda fila
let isEmpty = false;
const transactions = [];
// Función para convertir el número serial de Excel a una fecha en JavaScript
function excelSerialDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400; // convertir días a segundos
    const date_info = new Date(utc_value * 1000); // convertir segundos a milisegundos
  
    // Ajustar la zona horaria
    const offset = date_info.getTimezoneOffset() * 60000;
    const date = new Date(date_info.getTime() + offset);
  
    return date;
  }

  while (!isEmpty) {
    const dateCell = sheet.cell(`A${i}`);
    const serialDate = dateCell.value(); // Obtén el valor de la fecha como número serial de Excel
    if (serialDate !== null && serialDate !== undefined) {
        // Convierte el número serial a una fecha legible
        const date = excelSerialDateToJSDate(serialDate);
        // Procesa la fila
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
        
        i++; // Pasa a la siguiente fila
    } else {
        isEmpty = true; // No hay más datos, sal del bucle
    }
}

    // Iterar sobre las filas
    // for (let i = 2; i <= lastRow; i++) {
    //   const date = sheet.cell(`A${i}`).value() || new Date();
    //   const concept = sheet.cell(`B${i}`).value() || "no concept";
    //   const bill = sheet.cell(`C${i}`).value() || 0;
    //   const income = sheet.cell(`D${i}`).value() || 0; // Asumiendo que si no hay ingreso, es 0
    //     console.log(date)
    //     console.log(concept)
    //     console.log(bill)
    //     console.log(income)
    //   // Crear el objeto y agregarlo al array
    //   transactions.push({
    //     date,
    //     name: concept,
    //     amount: bill || income || 0,
    //     isBill: bill ? true : false,
    //     isIncome: income ? true : false,
    //     isReadable: true,
    //     user: userFound._id,
    //     wallet: userFound.wallet,
    //   });
    // }
    console.log(transactions);
    // Create TRANSACTIONS
    const newTransactions = await Transaction.create(transactions);
    console.log("first");
    //Error:
    if (!newTransactions) {
      throw new Error(
        "NEW TRANSACTIONS could not be saved on CREATE MANY TRANS WITH FILE"
      );
    }
    console.log("first");
    console.log(newTransactions);
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

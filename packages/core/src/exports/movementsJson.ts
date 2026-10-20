import type { CsvMovement } from "./movementsCsv";

// The movements as JSON, for other tools or a backup. Same rows as the CSV, with stable English keys
// (the CSV header is Spanish, for people; this one is for programs) and the amount as a number.
const TYPE_CODES: Record<string, string> = { Ingreso: "income", Gasto: "expense", Transferencia: "transfer" };

export function movementsToJson(rows: CsvMovement[], generatedAt: Date): string {
  const movements = rows.map((row) => ({
    date: row.date,
    name: row.name,
    category: row.category,
    subCategory: row.subCategory,
    type: TYPE_CODES[row.type] ?? row.type,
    amount: Math.round(row.amount * 100) / 100,
    currency: row.currency,
    account: row.account,
  }));
  return JSON.stringify({ app: "Gastify", generatedAt: generatedAt.toISOString(), count: movements.length, movements }, null, 2);
}

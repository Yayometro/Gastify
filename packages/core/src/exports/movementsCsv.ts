// The movements as CSV, for a spreadsheet. Plain text with a header row; values are quoted when they
// contain a comma, a quote or a line break, and quotes inside them are doubled (RFC 4180).
export interface CsvMovement {
  date: string;
  name: string;
  category: string;
  subCategory: string;
  type: string;
  amount: number;
  currency: string;
  account: string;
}

export const CSV_HEADER = ["Fecha", "Nombre", "Categoría", "Subcategoría", "Tipo", "Monto", "Moneda", "Cuenta"] as const;

export function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function movementsToCsv(rows: CsvMovement[]): string {
  const lines = [CSV_HEADER.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(
      [row.date, row.name, row.category, row.subCategory, row.type, row.amount.toFixed(2), row.currency, row.account].map(csvCell).join(",")
    );
  }
  return lines.join("\r\n");
}

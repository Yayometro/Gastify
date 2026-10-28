// Builds a CSV that any spreadsheet opens: comma separated, CRLF line ends, and a cell wrapped in quotes when it needs it.
export type CsvCell = string | number | boolean | null | undefined;

function cell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((line) => line.map(cell).join(",")).join("\r\n") + "\r\n";
}

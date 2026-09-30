declare module "xlsx-populate" {
  export interface DataValidationOptions {
    type?: string;
    allowBlank?: boolean;
    showErrorMessage?: boolean;
    errorTitle?: string;
    error?: string;
    formula1?: string;
    formula2?: string;
    operator?: string;
    [key: string]: unknown;
  }

  export interface Cell {
    value(): unknown;
    value(val: unknown): Cell;
    style(name: string, value?: unknown): Cell;
    style(styles: Record<string, unknown>): Cell;
    dataValidation(
      options?: DataValidationOptions,
    ): Cell | DataValidationOptions | undefined;
  }

  export interface Range {
    value(val: unknown): Range;
    style(name: string, value?: unknown): Range;
    style(styles: Record<string, unknown>): Range;
    merged(merged?: boolean): Range | boolean;
  }

  export interface Column {
    width(w: number): Column;
    hidden(h: boolean): Column;
  }

  export interface Row {
    height(h: number): Row;
    hidden(h: boolean): Row;
  }

  export interface Sheet {
    name(): string;
    name(name: string): Sheet;
    cell(address: string): Cell;
    cell(rowNumber: number, columnNameOrNumber: string | number): Cell;
    range(address: string): Range;
    range(
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
    ): Range;
    column(columnNameOrNumber: string | number): Column;
    row(rowNumber: number): Row;
    hidden(h: boolean | string): Sheet;
  }

  export interface Workbook {
    sheet(indexOrName: number | string): Sheet | undefined;
    sheets(): Sheet[];
    addSheet(name: string, indexBefore?: number | string): Sheet;
    outputAsync(type?: string): Promise<Buffer>;
    toFileAsync(path: string): Promise<void>;
  }

  export function fromFileAsync(
    path: string,
    options?: Record<string, unknown>,
  ): Promise<Workbook>;
  export function fromBlankAsync(): Promise<Workbook>;
  export function fromDataAsync(
    data: unknown,
    options?: Record<string, unknown>,
  ): Promise<Workbook>;

  const xlsxPopulate: {
    fromFileAsync: typeof fromFileAsync;
    fromBlankAsync: typeof fromBlankAsync;
    fromDataAsync: typeof fromDataAsync;
  };

  export default xlsxPopulate;
}

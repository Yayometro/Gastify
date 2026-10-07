import React from "react";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { formatInPrimaryCurrency } from "@/lib/money/displayCurrency";
import dayjs from "dayjs";
import { formatMoneyMinor } from "@/lib/money/currencies";

export interface DeletePreviewRowCategory {
  color?: string;
  icon?: string;
  name?: string;
  [key: string]: unknown;
}

export interface DeletePreviewRowSubCategory {
  name?: string;
  [key: string]: unknown;
}

export interface DeletePreviewRowAccount {
  name?: string;
  [key: string]: unknown;
}

export interface DeletePreviewRowNativeMoney {
  amountMinor: number;
  currency: string;
  [key: string]: unknown;
}

export interface DeletePreviewRowDisplayMoney {
  native?: DeletePreviewRowNativeMoney;
  [key: string]: unknown;
}

export interface DeletePreviewRowTransaction {
  _id?: string;
  name?: string;
  amount?: number;
  isBill?: boolean;
  date?: string | Date;
  createdAt?: string | Date;
  category?: DeletePreviewRowCategory | null;
  subCategory?: DeletePreviewRowSubCategory | null;
  account?: DeletePreviewRowAccount | null;
  displayMoney?: DeletePreviewRowDisplayMoney | null;
  [key: string]: unknown;
}

export interface DeletePreviewRowProps {
  transaction?: DeletePreviewRowTransaction | null;
}

function DeletePreviewRow({ transaction }: DeletePreviewRowProps): React.JSX.Element | null {
  if (!transaction) return null;
  const native = transaction.displayMoney?.native;
  const amountLabel = native
    ? formatMoneyMinor(native.amountMinor, native.currency)
    : formatInPrimaryCurrency(transaction.amount ?? 0);
  return (
    <div className="flex flex-row justify-between items-center bg-gf-surface-2/90 rounded-xl py-1.5 px-2.5 my-1 border border-gf-border text-xs shadow-sm">
      <div className="flex gap-2 items-center min-w-0">
        <div
          style={{ backgroundColor: transaction.category?.color || "#DADADA" }}
          className="w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-inner"
        >
          {!transaction.category || !transaction.category.icon ? (
            <UniversalCategoIcon type="md/MdFilterNone" siz={12} />
          ) : (
            <UniversalCategoIcon type={transaction.category.icon} siz={12} />
          )}
        </div>
        <div className="min-w-0 flex flex-col">
          <p className="font-medium text-gf-text truncate text-xs">{transaction.name || "No name"}</p>
          <div className="text-[10px] text-gf-text-muted flex items-center gap-1.5 flex-wrap">
            <span>Cat: <b className="font-medium text-gf-text-muted">{transaction.category?.name || "—"}</b></span>
            {transaction.subCategory?.name && (
              <span>• Sub: <b className="font-medium text-gf-text-muted">{transaction.subCategory.name}</b></span>
            )}
            <span>• Acc: <b className="font-medium text-gf-text-muted">{transaction.account?.name || "—"}</b></span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end flex-shrink-0 ml-2">
        <span className={`font-semibold text-xs ${transaction.isBill ? "text-red-500" : "text-green-500"}`}>
          {transaction.isBill ? "-" : "+"}{amountLabel}
        </span>
        <span className="text-[10px] text-gf-text-muted font-light">
          {dayjs(transaction.date || transaction.createdAt).format("DD/MM/YYYY")}
        </span>
      </div>
    </div>
  );
}

export default DeletePreviewRow;

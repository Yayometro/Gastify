import React from "react";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import currencyFormatter from "currency-formatter";
import dayjs from "dayjs";

function DeletePreviewRow({ transaction }) {
  if (!transaction) return null;
  return (
    <div className="flex flex-row justify-between items-center bg-slate-100/90 rounded-xl py-1.5 px-2.5 my-1 border border-slate-200 text-xs shadow-sm">
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
          <p className="font-medium text-slate-800 truncate text-xs">{transaction.name || "No name"}</p>
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span>Cat: <b className="font-medium text-slate-700">{transaction.category?.name || "—"}</b></span>
            {transaction.subCategory?.name && (
              <span>• Sub: <b className="font-medium text-slate-700">{transaction.subCategory.name}</b></span>
            )}
            <span>• Acc: <b className="font-medium text-slate-700">{transaction.account?.name || "—"}</b></span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end flex-shrink-0 ml-2">
        <span className={`font-semibold text-xs ${transaction.isBill ? "text-red-500" : "text-green-500"}`}>
          {transaction.isBill ? "-" : "+"}{currencyFormatter.format(transaction.amount ?? 0, { locale: "en-US" })}
        </span>
        <span className="text-[10px] text-slate-400 font-light">
          {dayjs(transaction.date || transaction.createdAt).format("DD/MM/YYYY")}
        </span>
      </div>
    </div>
  );
}

export default DeletePreviewRow;

"use client";

import React from "react";
import { useSelector } from "react-redux";
import UniversalCategoIcon from "../../UniversalCategoIcon";
import CategoIcon from "../../CategoIcon";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import type { PrimaryAmountItem } from "@/helpers/timeFunctions/timeFunctions";
import type { RootState } from "@/lib/store";

const TypedUniversalCategoIcon = UniversalCategoIcon as React.ComponentType<{
  type?: string;
  siz?: number | string;
  colore?: string;
  className?: string;
  [key: string]: unknown;
}>;

export interface TopCategoryRowItem extends PrimaryAmountItem {
  _id?: string;
  color?: string;
  icon?: string;
  type?: string;
  name?: string;
  isBill?: boolean;
  value?: number;
  [key: string]: unknown;
}

export interface TopCategoryRowProps {
  item: TopCategoryRowItem;
  index: number;
  onClick?: (item: TopCategoryRowItem) => void;
}

// Mirrors TransactionItemList's horizontal layout (icon circle + name on
// the left, amount pinned to the far right) since categories aren't real
// transactions and so can't reuse that component directly, but should read
// as its sibling - same row shape, just with a rank number for "this is the
// #1/#2/... category".
function TopCategoryRow({ item, index, onClick }: TopCategoryRowProps): React.JSX.Element {
  const walletPrimaryCurrency = useSelector((state: RootState) => state.walletReducer?.data?.primaryCurrency) || "MXN";

  return (
    <div
      onClick={() => onClick?.(item)}
      className="w-full flex justify-between items-center gap-2 rounded-2xl py-1 px-2 gf-glass-row cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.(item);
      }}
    >
      <div className="min-w-0 flex-1 flex items-center gap-2">
        <p className="w-5 shrink-0 text-center text-xs text-gf-text-muted font-medium">{index + 1}</p>
        <div
          style={{ backgroundColor: item.color || "#DADADA" }}
          className="gf-glass-tile rounded-full min-w-[50px] min-h-[50px] w-[50px] h-[50px] flex items-center justify-center shrink-0 hover:brightness-90"
        >
          <TypedUniversalCategoIcon type={item.icon || "md/MdFilterNone"} siz={10} />
        </div>
        <p className="truncate text-start text-[15px] font-medium">
          {item.type || item.name || "No category"}
        </p>
      </div>
      <div className={`flex gap-1 items-center shrink-0 ${item.isBill ? "text-red-500" : "text-green-500"}`}>
        <CategoIcon type={item.isBill ? "MdKeyboardDoubleArrowDown" : "MdKeyboardDoubleArrowUp"} />
        <p className="text-base font-semibold">{formatMoneyMajor(getPrimaryAmount(item), walletPrimaryCurrency)}</p>
      </div>
    </div>
  );
}

export default TopCategoryRow;

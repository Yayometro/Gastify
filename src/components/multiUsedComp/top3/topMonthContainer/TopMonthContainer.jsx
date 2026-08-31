"use client";
import { useSelector } from "react-redux";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import TopMonthItem from "./TopMonthItem";

function TopMonthContainer({ items, style, title, mode = "transaction" }) {
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  return (
    <div
      className={
        // w-full here (not just on the grid below) matters: without it this
        // div is a flex item under a `justify-center items-center` ancestor
        // with no definite width of its own, so it shrink-wraps to content
        // instead of stretching - which silently starved the grid below of
        // real width and made Categories (naturally narrower rows) look
        // tiny next to Transactions (naturally wider rows).
        style?.father || "w-full flex flex-col justify-center items-center gap-2"
      }
    >
      {title}
      {/* Months side by side again (not stacked) - rows are wider than the
          old AtomicTop squares, so fewer columns fit, but the point stands:
          don't waste horizontal space when there's room for 2-3 months. */}
      <div className={style?.child || "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 w-full"}>
        {!items || items.length <= 0
          ? "No items to display"
          : items.map((item, index) => {
              return (
                <TopMonthItem
                  key={`topMonthContainer-${index}-${item.name || item.type}`}
                  childs={item.childrens || []}
                  color={item.color}
                  icon={item.icon}
                  name={String(
                    item.name || item.type || item.month
                  ).toUpperCase()}
                  value={formatMoneyMajor(getPrimaryAmount(item), walletPrimaryCurrency)}
                  index={index}
                  mode={mode}
                />
              );
            })}
      </div>
    </div>
  );
}

export default TopMonthContainer;

"use client";
import { useSelector } from "react-redux";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import TopMonthItem from "./TopMonthItem";

function TopMonthContainer({ items, style, title }) {
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  return (
    <div
      className={
        style?.father || "flex flex-col justify-center items-center gap-2"
      }
    >
      {title}
      <div className={style?.child || "grid grid-cols-1 min-[370px]:grid-cols-2 sm:grid-cols-3 gap-1"}>
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
                />
              );
            })}
      </div>
    </div>
  );
}

export default TopMonthContainer;

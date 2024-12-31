"use client";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import TopMonthItem from "./TopMonthItem";

function TopMonthContainer({ items, style, title }) {
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
                  value={usdFormatChanger(item.value || item.amount)}
                  index={index}
                />
              );
            })}
      </div>
    </div>
  );
}

export default TopMonthContainer;

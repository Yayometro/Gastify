"use client";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import React, { useState } from "react";

function SelecterItemsToDisplay({
  getValue,
  itemsOverride,
  itemFromFather,
  styles,
}) {
  const items = itemsOverride || [
    { value: 2, name: "2 items" },
    { value: 3, name: "3 items" },
    { value: 4, name: "4 items" },
    { value: 5, name: "5 items" },
    { value: 6, name: "6 items" },
    { value: 12, name: "12 items" },
    { value: 24, name: "24 items" },
  ];
  const [curentItem, setCurentItem] = useState(itemFromFather || items[0]);
  function handleItemsChange(event) {
    setCurentItem(event.target.value);
    getValue(event.target.value);
  }
  return (
    <div
      className={`${
        !styles
          ? " bg-slate-50 text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
          : styles
      }`}
    >
      <select
        className="bg-transparent w-full pr-4 appearance-none"
        name="DateSelector"
        value={curentItem}
        onChange={handleItemsChange}
      >
        {items.length <= 0
          ? "No items to display..."
          : items.map((item, index) => (
              <option
                key={`${item.name}-${item.value}-${index}`}
                value={item.value}
              >
                {item.name}{" "}
              </option>
            ))}
      </select>
      <div className="filterIconContainer absolute right-[0px] pointer-events-none">
        <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
      </div>
    </div>
  );
}

export default SelecterItemsToDisplay;

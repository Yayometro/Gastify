"use client";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import React, { useState } from "react";

function SelecterFilter({ getValue, periodOverride, periodFromFather, styles }) {
  const periods = periodOverride || [
    { value: 2, name: "Yesterday" },
    { value: 7, name: "Las week" },
    { value: 15, name: "Las 15 days" },
    { value: 30, name: "Last 30 days" },
    { value: 60, name: "Last 60 days" },
    { value: 30, name: "Last 90 days" },
  ];
  const [internalPeriod, setInternalPeriod] = useState(periodFromFather || periods[0]);
  function handleDurationChange(event) {
    setInternalPeriod(event.target.value);
    getValue(event.target.value);
  }
  return (
    <div className={`${!styles ? " bg-slate-50 text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]" : styles}`}>
      <select
        className="bg-transparent w-full pr-4 appearance-none text-center"
        name="DateSelector"
        value={internalPeriod}
        onChange={handleDurationChange}
      >
        {periods.length <= 0
          ? "No periods to map..."
          : periods.map((period) =>(
              <option
                key={`${period.name}-${period.value}`}
                value={period.value}
              >
                {period.name}{" "}
              </option>
            ))}
      </select>
      <div className="filterIconContainer absolute right-[5px] pointer-events-none">
        <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
      </div>
    </div>
  );
}

export default SelecterFilter;

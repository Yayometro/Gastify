"use client";
import React, { useState } from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { Tooltip } from "antd";
import EmptyModule from "../EmptyModule";

function TabsToggler({ tabs, compontentsArray, tooltip, contentStyle }) {
  const [active, setActive] = useState(tabs?.[0]?.toLowerCase() || "");

  const handleTab = (type) => {
    setActive(type.toLowerCase());
  };

  const activeComponent =
    !compontentsArray || compontentsArray.length <= 0
      ? null
      : compontentsArray
          .filter(({ tab }) => tab.toLowerCase() === active)
          .map(({ Component, props }, i) => <Component {...props} key={`tabs-togler-key-${tabs}-${i}`} />);

  return (
    <div className="rtt-cont w-full h-full mt-1">
      <div className="tabs-toggler w-full text-center flex justify-center items-center gap-2 bg-purple-200 rounded-md">
        {!tabs || tabs.length <= 0
          ? "No tabs in array, set at least one... "
          : tabs.map((tab) => (
              <div
                key={"tabsToggler-" + tab}
                onClick={() => handleTab(tab)}
                className={`tab-rtt-bill p-4 cursor-pointer hover:text-purple-700 ${
                  active === tab.toLowerCase()
                    ? "border-b-2 border-purple-600 text-purple-600 "
                    : ""
                }`}
              >
                {tab}
              </div>
            ))}
        <Tooltip title={tooltip}>
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
      </div>
      <div className={contentStyle || "tabs-toggler-content-cont"}>
        {activeComponent || (
          <EmptyModule emMessage="Ups... Nothing here 🤔. Component SHOULD have an array of components! 🚨" />
        )}
      </div>
    </div>
  );
}

export default TabsToggler;

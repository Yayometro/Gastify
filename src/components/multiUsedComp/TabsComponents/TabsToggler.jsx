"use client"
import React, { useState } from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { Tooltip } from "antd";
import EmptyModule from "../EmptyModule";

function TabsToggler({ tabs, compontentsArray, tooltip }) {
  const [active, setActive] = useState(tabs?.[0]?.toLowerCase()||"");

  const handleTab = (type) => {
    setActive(type.toLowerCase());
  };

  const activeComponent = compontentsArray.find(({ tab }) => tab.toLowerCase() === active);

  return (
    <div className="rtt-cont w-full h-full">
      <div className="tabs-toggler w-full text-center flex justify-center items-center gap-2">
        {!tabs || tabs.length <= 0
          ? "No tabs in array, set at least one... "
          : tabs.map((tab) => (
              <div
                key={"tabsToggler-"+tab}
                onClick={() => handleTab(tab)}
                className={`tab-rtt-bill p-4 cursor-pointer hover:text-purple-400 ${
                  active === tab.toLowerCase()
                    ? "border-b-2 border-purple-600 text-purple-600 "
                    : ""
                }`}
              >
                {tab} Resume
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
      <div className="tabs-toggler-content-cont">
      {activeComponent ? (
          <div key={`component-tabs-toggler-key-${activeComponent.tab}`}>
            <activeComponent.Component {...activeComponent.props} />
          </div>
        ) : (
          <EmptyModule emMessage="Ups... Nothing here 🤔. Component SHOULD have an array of components! 🚨" />
        )}
      </div>
    </div>
  );
}

export default TabsToggler;

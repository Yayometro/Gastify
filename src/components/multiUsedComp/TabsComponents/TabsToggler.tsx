"use client";
import React, { useEffect, useState } from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { Tooltip } from "antd";
import EmptyModule from "../EmptyModule";
import { InfoTip } from "../InfoTip";
import type { InfoText } from "@gastify/core/info/createInfo";
import { useT } from "@/i18n/client";

export interface TabsTogglerComponentItem<P extends object = Record<string, unknown>> {
  tab: string;
  Component: React.ComponentType<P>;
  props?: P;
}

export interface TabsTogglerProps {
  tabs?: string[] | null;
  // Dynamic component container passes heterogeneous props to child components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compontentsArray?: TabsTogglerComponentItem<any>[] | null;
  tooltip?: React.ReactNode;
  contentStyle?: string;
  // An explanation for a tab, by the tab's name in lowercase: a "?" next to that tab's label.
  tabInfo?: Record<string, InfoText>;
}

function TabsToggler({
  tabs,
  compontentsArray,
  tooltip,
  contentStyle,
  tabInfo,
}: TabsTogglerProps): React.JSX.Element {
  const t = useT();
  const [active, setActive] = useState(tabs?.[0]?.toLowerCase() || "");

  // Every "Compare" toggle on the History page adds/removes tabs at
  // runtime (e.g. "Compare periods" only exists while compare is on) - if
  // the currently active tab is one of those and gets removed (toggling
  // compare back off while still looking at it), `active` was staying
  // stale pointing at a tab that no longer exists in `tabs`, so nothing
  // matched in compontentsArray and the content silently went blank. Fall
  // back to the first available tab whenever that happens.
  useEffect(() => {
    if (!tabs || tabs.length === 0) return;
    const stillExists = tabs.some((tab) => tab.toLowerCase() === active);
    if (!stillExists) {
      setActive(tabs[0].toLowerCase());
    }
  }, [tabs, active]);

  const handleTab = (type: string) => {
    setActive(type.toLowerCase());
  };

  const activeComponent =
    !compontentsArray || compontentsArray.length <= 0
      ? null
      : compontentsArray
          .filter(({ tab }) => tab.toLowerCase() === active)
          // The tab name is part of the key: two tabs often render the same
          // component type (e.g. two charts), and without it React reused the
          // instance, so the chart morphed from one tab's data into the other's.
          .map(({ Component, props, tab }, i) => (
            <Component {...props} key={`tabs-togler-key-${active}-${tab}-${i}`} />
          ));

  return (
    <div className="rtt-cont w-full h-full mt-1">
      <div className="tabs-toggler mx-auto mb-3 flex w-fit max-w-full items-center justify-center gap-1 overflow-x-auto rounded-full gf-glass-inset p-1">
        {!tabs || tabs.length <= 0
          ? "No tabs in array, set at least one... "
          : tabs.map((tab) => (
              <div
                key={"tabsToggler-" + tab}
                onClick={() => handleTab(tab)}
                role="tab"
                aria-selected={active === tab.toLowerCase()}
                className={`flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  active === tab.toLowerCase()
                    ? "gf-glass-button text-white"
                    : "text-purple-200/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {tab}
                  {tabInfo?.[tab.toLowerCase()] ? <InfoTip info={tabInfo[tab.toLowerCase()]} /> : null}
                </span>
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
          <EmptyModule emMessage={t("shared.tabs.missing")} />
        )}
      </div>
    </div>
  );
}

export default TabsToggler;

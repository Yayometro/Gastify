"use client";
import type { TranslateFn } from "@gastify/core/i18n/translate";

import React from "react";
import { createPortal } from "react-dom";
import { useState } from "react";
import type { TourId } from "@gastify/core/tour/tourSteps";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import TutorialTip from "@/components/tour/TutorialTip";
import UncategorizedSuggestionsTab from "@/components/multiUsedComp/CategorySuggestions/UncategorizedSuggestionsTab";
import { useT } from "@/i18n/client";

export interface ToolTab {
  id: string;
  label: string;
  title: string;
  // The tool's own tutorial: its compass sits beside the tool's title.
  tour: TourId;
  render: () => React.JSX.Element;
}

export interface ToolsModalProps {
  mail?: string | null;
  onClose?: () => void;
}

// Array-driven so adding a tool later (e.g. "possibly miscategorized") is just
// another entry here - the tab bar only renders once there's more than one.
function buildTabs(mail: string | null | undefined, t: TranslateFn): ToolTab[] {
  return [
    {
      id: "uncategorized",
      label: t("movements.uncategorized"),
      title: t("movements.categorizer.title"),
      tour: "toolsCategorizer",
      render: () => <UncategorizedSuggestionsTab mail={mail} />,
    },
  ];
}

function ToolsModal({ mail, onClose }: ToolsModalProps): React.JSX.Element {
  const t = useT();
  const tr = useT();
  const tabs = buildTabs(mail, t);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === activeTab) || tabs[0];

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <div className="gf-glass-violet rounded-3xl w-full max-w-[560px] sm:max-w-[780px] mx-2 sm:mx-4 flex flex-col gap-5 p-4 sm:p-7 max-h-[90vh] overflow-y-auto relative">
        <div
          className="absolute top-3 right-3 rounded-full gf-glass-card text-purple-100 hover:text-white transition-colors p-1.5 cursor-pointer"
          onClick={onClose}
        >
          <CategoIcon type="MdClose" siz={20} />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-gf-text">{tr("movements.tools")}</h2>
          <div data-tour="tools-title" className="flex items-center justify-center mt-1">
            <p className="text-sm text-purple-600 font-medium">{current.title}</p>
            <span aria-hidden="true" className="mx-2 inline-block h-4 w-px shrink-0 align-middle bg-purple-300/40" />
            <TutorialTip tour={current.tour} label={current.title} />
          </div>
        </div>

        {tabs.length > 1 && (
          <div className="flex gap-2 justify-center border-b border-gf-border pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-gf-text-muted hover:bg-gf-surface-2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div data-tour="tools-body">{current.render()}</div>
      </div>
    </div>,
    document.body
  );
}

export default ToolsModal;

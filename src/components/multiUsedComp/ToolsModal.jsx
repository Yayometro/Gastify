"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { Tooltip } from "antd";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import UncategorizedSuggestionsTab from "@/components/multiUsedComp/CategorySuggestions/UncategorizedSuggestionsTab";

// Array-driven so adding a tool later (e.g. "possibly miscategorized") is just
// another entry here - the tab bar only renders once there's more than one.
function buildTabs(mail) {
  return [
    {
      id: "uncategorized",
      label: "Uncategorized",
      title: "Transaction Categorizer",
      tooltip: "Scans your uncategorized transactions and suggests a category based on your saved rules (merchant name, amount). Nothing changes until you review and apply.",
      render: () => <UncategorizedSuggestionsTab mail={mail} />,
    },
  ];
}

function ToolsModal({ mail, onClose }) {
  const tabs = buildTabs(mail);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === activeTab) || tabs[0];

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[560px] sm:max-w-[780px] mx-2 sm:mx-4 flex flex-col gap-5 p-4 sm:p-7 max-h-[90vh] overflow-y-auto relative">
        <div
          className="absolute top-3 right-3 border-2 rounded-full text-purple-700 p-1 cursor-pointer"
          onClick={onClose}
        >
          <CategoIcon type="MdClose" siz={20} />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">Tools</h2>
          <div className="flex items-center justify-center gap-1 mt-1">
            <p className="text-sm text-purple-600 font-medium">{current.title}</p>
            {current.tooltip && (
              <Tooltip title={current.tooltip}>
                <div className="text-purple-400 cursor-help">
                  <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={12} />
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {tabs.length > 1 && (
          <div className="flex gap-2 justify-center border-b border-slate-100 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {current.render()}
      </div>
    </div>,
    document.body
  );
}

export default ToolsModal;

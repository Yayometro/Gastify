"use client";

import { createPortal } from "react-dom";
import SuggestionsList from "@/components/multiUsedComp/CategorySuggestions/SuggestionsList";

function CategorySuggestionsModal({ suggestions, onConfirm, onCancel, confirming }) {
  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[560px] sm:max-w-[780px] mx-2 sm:mx-4 flex flex-col gap-5 p-4 sm:p-7 max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">Category suggestions</h2>
          <p className="text-xs text-slate-400 mt-1">
            {suggestions.length} uncategorized transaction{suggestions.length !== 1 ? "s" : ""} matched a rule · uncheck any to skip
          </p>
        </div>

        <SuggestionsList
          suggestions={suggestions}
          onConfirm={onConfirm}
          onCancel={onCancel}
          confirming={confirming}
        />
      </div>
    </div>,
    document.body
  );
}

export default CategorySuggestionsModal;

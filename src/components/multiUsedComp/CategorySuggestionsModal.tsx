"use client";

import React from "react";
import { createPortal } from "react-dom";
import SuggestionsList, {
  type CategorySuggestionEntry,
  type CategorySuggestionApplication,
} from "@/components/multiUsedComp/CategorySuggestions/SuggestionsList";

export interface CategorySuggestionsModalProps<
  T = CategorySuggestionEntry,
  A = CategorySuggestionApplication
> {
  suggestions: T[];
  onConfirm: (applications: A[]) => boolean | Promise<boolean | void> | void;
  onCancel: () => void;
  confirming?: boolean;
}

function CategorySuggestionsModal<
  T = CategorySuggestionEntry,
  A = CategorySuggestionApplication
>({
  suggestions,
  onConfirm,
  onCancel,
  confirming,
}: CategorySuggestionsModalProps<T, A>): React.JSX.Element {
  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gf-surface rounded-3xl shadow-2xl w-full max-w-[560px] sm:max-w-[780px] mx-2 sm:mx-4 flex flex-col gap-5 p-4 sm:p-7 max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gf-text">Category suggestions</h2>
          <p className="text-xs text-gf-text-muted mt-1">
            {suggestions.length} uncategorized transaction{suggestions.length !== 1 ? "s" : ""} matched a rule · uncheck any to skip
          </p>
        </div>

        <SuggestionsList
          suggestions={suggestions as unknown as CategorySuggestionEntry[]}
          onConfirm={onConfirm as (applications: CategorySuggestionApplication[]) => boolean | Promise<boolean | void> | void}
          onCancel={onCancel}
          confirming={confirming}
        />
      </div>
    </div>,
    document.body
  );
}

export default CategorySuggestionsModal;

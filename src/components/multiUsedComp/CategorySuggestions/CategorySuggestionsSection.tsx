"use client";

import React, { useEffect, useState } from "react";
import { Tooltip } from "antd";
import fetcher from "@/helpers/fetcher";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import ToolsModal from "@/components/multiUsedComp/ToolsModal";

// The Transaction Categorizer on the Movements page: the same tool the floating Tools button opens. It shows how many
// transactions have a suggested category, and opens the Tools window on that tool. "card" is the whole section (wide
// screens, next to the transactions); "button" is a pill for narrow screens.

const TOOLTIP_TEXT =
  "Scans your uncategorized transactions and suggests a category based on your saved rules (merchant name, amount). Nothing changes until you review and apply.";

interface SuggestApiResponse {
  ok?: boolean;
  data?: unknown[];
}

export interface CategorySuggestionsSectionProps {
  mail?: string | null;
  variant?: "card" | "button";
}

function CategorySuggestionsSection({ mail, variant = "card" }: CategorySuggestionsSectionProps): React.JSX.Element {
  const [count, setCount] = useState<number | null>(null); // null = still loading
  const [showModal, setShowModal] = useState<boolean>(false);
  const toFetch = fetcher();

  useEffect(() => {
    let cancelled = false;
    toFetch
      .post("general-data/category-rules/suggest", { mail })
      .then((res: SuggestApiResponse) => {
        if (!cancelled && res.ok) setCount(res.data?.length || 0);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mail]);

  const modal = showModal && <ToolsModal mail={mail} onClose={() => setShowModal(false)} />;

  if (variant === "button") {
    return (
      <>
        <Tooltip title={TOOLTIP_TEXT}>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-full gf-glass-card px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            Transaction Categorizer
            {count !== null && count > 0 && (
              <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white">{count}</span>
            )}
          </button>
        </Tooltip>
        {modal}
      </>
    );
  }

  return (
    <div className="gf-glass-card py-6 my-2 px-[30px] rounded-[60px] w-full h-full max-w-[900px] flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-1">
        <h1 className="text-xl font-light">Transaction Categorizer</h1>
        <Tooltip title={TOOLTIP_TEXT}>
          <div className="text-purple-400 cursor-help">
            <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={14} />
          </div>
        </Tooltip>
      </div>

      {count === null ? (
        <p className="text-xs text-gf-text-muted">Checking for suggestions...</p>
      ) : count === 0 ? (
        <p className="text-xs text-gf-text-muted">No suggestions right now — you&apos;re all caught up! 🎉</p>
      ) : (
        <>
          <p className="text-sm text-gf-text-muted">
            💡 {count} transaction{count !== 1 ? "s" : ""} have a suggested category
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-1 px-5 py-2 rounded-full text-sm font-medium gf-glass-button text-white transition-colors"
          >
            Review suggestions
          </button>
        </>
      )}

      {modal}
    </div>
  );
}

export default CategorySuggestionsSection;

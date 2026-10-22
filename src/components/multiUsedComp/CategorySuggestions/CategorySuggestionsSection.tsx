"use client";

import React, { useEffect, useState } from "react";
import { Tooltip } from "antd";
import fetcher from "@/helpers/fetcher";
import ToolsModal from "@/components/multiUsedComp/ToolsModal";

// The Transaction Categorizer as a button on the Movements page: the same tool the floating Tools button opens. The button
// shows how many transactions have a suggested category, and opens the Tools window on that tool.

interface SuggestApiResponse {
  ok?: boolean;
  data?: unknown[];
}

export interface CategorySuggestionsSectionProps {
  mail?: string | null;
}

function CategorySuggestionsSection({ mail }: CategorySuggestionsSectionProps): React.JSX.Element {
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

  return (
    <>
      <Tooltip title="Scans your uncategorized transactions and suggests a category based on your saved rules (merchant name, amount). Nothing changes until you review and apply.">
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
      {showModal && <ToolsModal mail={mail} onClose={() => setShowModal(false)} />}
    </>
  );
}

export default CategorySuggestionsSection;

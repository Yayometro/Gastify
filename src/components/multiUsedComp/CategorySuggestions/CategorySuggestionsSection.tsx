"use client";

import React, { useEffect, useState } from "react";
import { Tooltip } from "antd";
import fetcher from "@/helpers/fetcher";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import ToolsModal from "@/components/multiUsedComp/ToolsModal";

// Movements-specific, always-visible entry point for the same category-suggestion
// tool the floating Tools button opens globally - this page gets its own section
// instead of the suggestion being hidden behind a click.

interface ToolsModalProps {
  mail?: string | null;
  onClose: () => void;
}

const TypedToolsModal = ToolsModal as React.ComponentType<ToolsModalProps>;

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
    <div className="gf-glass-card py-6 my-2 px-[30px] rounded-[60px] w-full h-full max-w-[900px] flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-1">
        <h1 className="text-xl font-light">Transaction Categorizer</h1>
        <Tooltip title="Scans your uncategorized transactions and suggests a category based on your saved rules (merchant name, amount). Nothing changes until you review and apply.">
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

      {showModal && (
        <TypedToolsModal
          mail={mail}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default CategorySuggestionsSection;

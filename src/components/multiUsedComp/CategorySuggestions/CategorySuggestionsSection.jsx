"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "antd";
import fetcher from "@/helpers/fetcher";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import ToolsModal from "@/components/multiUsedComp/ToolsModal";

// Movements-specific, always-visible entry point for the same category-suggestion
// tool the floating Tools button opens globally - this page gets its own section
// instead of the suggestion being hidden behind a click.
function CategorySuggestionsSection({ mail }) {
  const [count, setCount] = useState(null); // null = still loading
  const [showModal, setShowModal] = useState(false);
  const toFetch = fetcher();

  useEffect(() => {
    let cancelled = false;
    toFetch
      .post("general-data/category-rules/suggest", { mail })
      .then((res) => {
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
    <div className="bg-slate-50 py-6 my-2 px-[30px] rounded-[60px] w-full max-w-[900px] flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        <h1 className="text-xl font-light">Transaction Categorizer</h1>
        <Tooltip title="Scans your uncategorized transactions and suggests a category based on your saved rules (merchant name, amount). Nothing changes until you review and apply.">
          <div className="text-purple-400 cursor-help">
            <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={14} />
          </div>
        </Tooltip>
      </div>

      {count === null ? (
        <p className="text-xs text-slate-400">Checking for suggestions...</p>
      ) : count === 0 ? (
        <p className="text-xs text-slate-400">No suggestions right now — you&apos;re all caught up! 🎉</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            💡 {count} transaction{count !== 1 ? "s" : ""} have a suggested category
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-1 px-5 py-2 rounded-full text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          >
            Review suggestions
          </button>
        </>
      )}

      {showModal && (
        <ToolsModal
          mail={mail}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default CategorySuggestionsSection;

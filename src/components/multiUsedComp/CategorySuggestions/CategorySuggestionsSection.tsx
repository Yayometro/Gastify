"use client";

import TutorialTip from "@/components/tour/TutorialTip";
import React, { useEffect, useState } from "react";
import { Tooltip } from "antd";
import fetcher from "@/helpers/fetcher";
import ToolsModal from "@/components/multiUsedComp/ToolsModal";
import { useT } from "@/i18n/client";

// The Transaction Categorizer on the Movements page: the same tool the floating Tools button opens. It shows how many
// transactions have a suggested category, and opens the Tools window on that tool. "card" is the whole section (wide
// screens, next to the transactions); "button" is a pill for narrow screens.

const TOOLTIP_TEXT = "web.scans.your.uncategorized.transactions.and.suggests.a.cat";

interface SuggestApiResponse {
  ok?: boolean;
  data?: unknown[];
}

export interface CategorySuggestionsSectionProps {
  mail?: string | null;
  variant?: "card" | "button";
}

function CategorySuggestionsSection({ mail, variant = "card" }: CategorySuggestionsSectionProps): React.JSX.Element {
  const t = useT();
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
        <Tooltip title={t(TOOLTIP_TEXT)}>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-full gf-glass-card px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            {t("movements.categorizer.title")}
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
    <div className="gf-glass-card py-6 my-2 px-[30px] rounded-[60px] w-full h-full max-w-[900px] flex flex-col items-center justify-center gap-2" data-tour="mov-categorizer">
      <div className="flex items-center">
        <h1 className="text-xl font-light">{t("movements.categorizer.title")}</h1>
        <span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="movCategorizer" label={t("movements.categorizer.title")} />
      </div>

      {count === null ? (
        <p data-tour="mov-categorizer-status" className="text-xs text-gf-text-muted">{t("movements.categorizer.checking")}</p>
      ) : count === 0 ? (
        <p data-tour="mov-categorizer-status" className="text-xs text-gf-text-muted">{t("movements.categorizer.none")}</p>
      ) : (
        <>
          <p data-tour="mov-categorizer-status" className="text-sm text-gf-text-muted">
            {t("movements.categorizer.count", { p1: count, p2: count !== 1 ? "s" : "" })}
          </p>
          <button
            data-tour="mov-categorizer-review"
            onClick={() => setShowModal(true)}
            className="mt-1 px-5 py-2 rounded-full text-sm font-medium gf-glass-button text-white transition-colors"
          >
            {t("movements.categorizer.review")}
          </button>
        </>
      )}

      {modal}
    </div>
  );
}

export default CategorySuggestionsSection;

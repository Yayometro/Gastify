"use client";

import { useMemo, useState } from "react";
import { Modal } from "antd";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { BsFiletypeXml } from "react-icons/bs";
import { IoCheckmarkCircleOutline, IoSparklesOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useT } from "@/i18n/client";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import type { RootState } from "@/lib/store";
import type { TransactionData } from "@/lib/features/transacctionsSlice";

type ToolKind = "import" | "categorizer";

/** Safe local-only stand-ins for the account-connected import and categorizer tools. */
export default function DemoMovementTools(): React.JSX.Element {
  const t = useT();
  const [activeTool, setActiveTool] = useState<ToolKind | null>(null);
  const [fileKind, setFileKind] = useState<"excel" | "xml">("excel");
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data) as TransactionData[];
  const currency = useSelector((state: RootState) => (state.walletReducer.data as { primaryCurrency?: string } | null)?.primaryCurrency) || "MXN";

  const uncategorized = useMemo(
    () => transactions.filter((transaction) => transaction.isBill && !transaction.category && !transaction.subCategory),
    [transactions]
  );
  const importPreview = useMemo(
    () => transactions.filter((transaction) => transaction.isBill).slice(0, 3),
    [transactions]
  );

  return (
    <>
      <div className="flex min-w-0 flex-col gap-4">
        <section className="gf-glass-card flex flex-col gap-3 rounded-[28px] border border-gf-border p-4 sm:p-5" aria-labelledby="demo-import-title">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-200/15 bg-emerald-300/10 text-emerald-200"><PiMicrosoftExcelLogoFill size={20} /></span>
            <div className="min-w-0 flex-1">
              <h2 id="demo-import-title" className="text-sm font-semibold text-white">{t("movements.import.title")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("shared.demo.movementTools.importHelp")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-purple-100/80">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1"><PiMicrosoftExcelLogoFill className="text-emerald-300" /> Excel</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1"><BsFiletypeXml className="text-amber-200" /> XML compatible</span>
          </div>
          <button type="button" onClick={() => setActiveTool("import")} className="gf-glass-button mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white">
            <PiMicrosoftExcelLogoFill aria-hidden="true" />{t("shared.demo.movementTools.previewImport")}
          </button>
        </section>

        <section className="gf-glass-card flex flex-1 flex-col gap-3 rounded-[28px] border border-gf-border p-4 sm:p-5" aria-labelledby="demo-categorizer-title">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-purple-200/15 bg-purple-300/10 text-purple-200"><IoSparklesOutline size={20} /></span>
            <div className="min-w-0 flex-1">
              <h2 id="demo-categorizer-title" className="text-sm font-semibold text-white">{t("movements.categorizer.title")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("shared.demo.movementTools.categorizerHelp")}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[.07] bg-black/10 px-3 py-2.5">
            <p className="text-[10px] text-gf-text-muted">{t("shared.demo.movementTools.uncategorized")}</p>
            <p className="mt-0.5 text-xl font-semibold text-purple-100">{uncategorized.length}</p>
          </div>
          <button type="button" onClick={() => setActiveTool("categorizer")} className="gf-glass-button mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white">
            <IoSparklesOutline aria-hidden="true" />{t("shared.demo.movementTools.reviewSuggestions")}
          </button>
        </section>
      </div>

      <Modal
        open={activeTool !== null}
        centered
        footer={null}
        onCancel={() => setActiveTool(null)}
        title={activeTool === "import" ? t("shared.demo.movementTools.importTitle") : t("shared.demo.movementTools.categorizerTitle")}
        width={620}
      >
        {activeTool === "import" ? (
          <div className="space-y-4 pt-2">
            <p className="rounded-xl border border-rose-200/15 bg-rose-950/20 px-3 py-2 text-xs leading-relaxed text-rose-100/90">{t("shared.demo.movementTools.importNotice")}</p>
            <div className="flex gap-2" role="group" aria-label={t("shared.demo.movementTools.fileType")}>
              <button type="button" aria-pressed={fileKind === "excel"} onClick={() => setFileKind("excel")} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${fileKind === "excel" ? "border-purple-300/40 bg-purple-300/10 text-purple-100" : "border-white/10 text-gf-text-muted"}`}><PiMicrosoftExcelLogoFill /> Excel</button>
              <button type="button" aria-pressed={fileKind === "xml"} onClick={() => setFileKind("xml")} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${fileKind === "xml" ? "border-purple-300/40 bg-purple-300/10 text-purple-100" : "border-white/10 text-gf-text-muted"}`}><BsFiletypeXml /> XML</button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-[1fr_auto] gap-3 bg-white/[.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gf-text-muted"><span>{t("shared.demo.movementTools.previewRows")}</span><span>{fileKind === "excel" ? "XLSX" : "XML"} · {importPreview.length}</span></div>
              {importPreview.map((transaction) => <div key={transaction._id} className="flex items-center justify-between gap-3 border-t border-white/[.07] px-3 py-2.5 text-xs"><span className="min-w-0 truncate text-white">{transaction.name}</span><span className="shrink-0 font-semibold text-purple-100">{formatMoneyMajor(Number(transaction.amount || 0), currency)}</span></div>)}
            </div>
            <button type="button" onClick={() => setActiveTool(null)} className="gf-glass-button w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-white">{t("shared.demo.movementTools.closePreview")}</button>
          </div>
        ) : activeTool === "categorizer" ? (
          <div className="space-y-3 pt-2">
            <p className="rounded-xl border border-rose-200/15 bg-rose-950/20 px-3 py-2 text-xs leading-relaxed text-rose-100/90">{t("shared.demo.movementTools.categorizerNotice")}</p>
            {uncategorized.length === 0 ? <p className="rounded-xl border border-white/10 px-3 py-5 text-center text-xs text-gf-text-muted">{t("shared.demo.movementTools.noSuggestions")}</p> : uncategorized.slice(0, 4).map((transaction, index) => {
              const categoryName = index === 0 ? t("shared.demo.movementTools.suggestionEducation") : index % 2 ? t("shared.demo.movementTools.suggestionShopping") : t("shared.demo.movementTools.suggestionHome");
              const reviewed = reviewedIds.includes(String(transaction._id));
              return <div key={transaction._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[.08] bg-black/10 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-300/10 text-purple-200"><UniversalCategoIcon type="md/MdOutlineCategory" siz={17} /></span>
                <div className="min-w-0 flex-1"><strong className="block truncate text-xs text-white">{transaction.name}</strong><span className="text-[10px] text-gf-text-muted">{formatMoneyMajor(Number(transaction.amount || 0), currency)} · {t("shared.demo.movementTools.suggestedAs", { p1: categoryName })}</span></div>
                <span className="rounded-full border border-emerald-200/15 bg-emerald-300/10 px-2 py-1 text-[10px] text-emerald-100">{95 - index * 3}%</span>
                <button type="button" aria-pressed={reviewed} onClick={() => setReviewedIds((current) => reviewed ? current.filter((id) => id !== transaction._id) : [...current, String(transaction._id)])} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-purple-100 hover:bg-white/[.07]"><IoCheckmarkCircleOutline aria-hidden="true" />{reviewed ? t("shared.demo.movementTools.previewed") : t("shared.demo.movementTools.previewSuggestion")}</button>
              </div>;
            })}
            <button type="button" onClick={() => setActiveTool(null)} className="gf-glass-button w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-white">{t("shared.demo.movementTools.closePreview")}</button>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

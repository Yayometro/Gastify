"use client";
import { useSelector } from "react-redux";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import UniversalCategoIcon from "../../UniversalCategoIcon";
import useModal from "@/hooks/useModalBasic";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import BasicModal from "@/components/modals/basicModal/BasicModal";

// One ranked row - same visual language as WalletAnalyzerView's RankRow
// (numbered, icon circle, name + amount) so "Top elements by month" reads
// as the same design family as the Wallet Analyzer's own Top 12 section,
// instead of the old AtomicTop tile-strip look.
function RankRow({ index, item, currency, onClick }) {
  const name = item.name || item.type || "No name";
  const color = item?.color || item.category?.color || "#DADADA";
  const icon = item.icon || item.category?.icon;
  const subtitle = item.category?.name && item.name ? item.category.name : null;

  return (
    <div
      className="flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <span className="w-4 text-[11px] text-gf-text-muted font-bold shrink-0">{index + 1}</span>
      <span
        className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <UniversalCategoIcon type={icon} siz={13} colore="#fff" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-gf-text truncate">{name}</p>
        {subtitle && <p className="text-[10.5px] text-gf-text-muted truncate">{subtitle}</p>}
      </div>
      <span className="text-[12.5px] font-bold text-gf-text shrink-0">
        {formatMoneyMajor(getPrimaryAmount(item), currency)}
      </span>
    </div>
  );
}

function TopRankColumn({ items, style, title }) {
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const { close, handleClose, renderModal, modalContent } = useModal();
  function renderModalContent(item) {
    renderModal(<ModalContentTopMonthItem item={item} close={handleClose} />);
  }

  return (
    <>
      <div className={style?.father || "gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5"}>
        {title}
        <div className="w-full flex flex-col mt-2">
          {!items || items.length <= 0 ? (
            <p className="text-xs text-gf-text-muted text-center">No items to display...</p>
          ) : (
            items.map((item, i) => (
              <RankRow
                key={`rank-row-${i}-${item.name || item.type || "no-name"}`}
                index={i}
                item={item}
                currency={walletPrimaryCurrency}
                onClick={() => renderModalContent(item)}
              />
            ))
          )}
        </div>
      </div>
      {close && <BasicModal close={handleClose} renderContent={modalContent} />}
    </>
  );
}

export default TopRankColumn;

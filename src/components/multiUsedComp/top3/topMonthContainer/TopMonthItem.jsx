"use client";
import React from "react";
import TopTransactionRow from "./TopTransactionRow";
import TopCategoryRow from "./TopCategoryRow";
import BasicTooltip from "../../Tooltips/BasicTooltip";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";

// `icon` here is one of the calendar-month icons from monthObjects
// (e.g. "md/MdOutlineFilter6" for June, "md/Md10Mp" for October) - it was
// only ever standing in for the month's calendar number, so pull that
// number back out instead of rendering the glyph itself.
function monthNumberFromIcon(icon) {
  return icon?.match(/\d+/)?.[0] || "";
}

function TopMonthItem({
  childs,
  icon,
  name,
  fatherStyle,
  value,
  index,
  mode = "transaction",
}) {
  const { close, handleClose, renderModal, modalContent } = useModal();
  function renderModalContent(item) {
    renderModal(<ModalContentTopMonthItem item={item} close={handleClose} />);
  }
  return (
    <>
      <div
        className={
          fatherStyle ||
          // One flat, subtle tone for every month instead of the old
          // per-month rainbow - easier on the eyes across a full range of
          // months, and keeps the section visually on-brand (purple).
          "w-full h-full bg-purple-50 flex flex-col justify-start items-center relative rounded-2xl p-2 hover:brightness-95 shadow-md "
        }
      >
        <div className=" bg-white text-black flex justify-center items-center border-2 rounded-full w-[25px] h-[25px] absolute top-[6px] left-[6px] shadow-lg gap-2">
          <span className="text-xs font-bold">{monthNumberFromIcon(icon)}</span>
        </div>
        <div className=" bg-white text-black flex justify-center items-center border-2 rounded-full w-[25px] h-[25px] absolute top-[6px] right-[6px] shadow-lg gap-2">
          <BasicTooltip
            title={
              "In each month you can see the highest bills or transactions according to the time-period selected and the number of elements to display"
            }
          />
        </div>
        <section className="">
          <h1 className="text-purple-700 font-semibold">{name}</h1>
          {!value ? (
            "No value"
          ) : (
            <p>
              Value: <b>{value}</b>
            </p>
          )}
        </section>
        <div className="w-full flex flex-col gap-1 mt-1">
          {!childs || childs.length <= 0
            ? "No childs to display..."
            : childs.map((item, i) =>
                mode === "category" ? (
                  <TopCategoryRow
                    key={`topRow-${i}-${item._id || item.type || item.name || "no-name"}`}
                    item={item}
                    index={i}
                    onClick={renderModalContent}
                  />
                ) : (
                  <TopTransactionRow
                    key={`topRow-${i}-${item._id || i}`}
                    transaction={item}
                    onClick={renderModalContent}
                  />
                )
              )}
        </div>
      </div>
      {close && (
        <BasicModal close={handleClose} renderContent={modalContent} />
      )}
    </>
  );
}

export default TopMonthItem;

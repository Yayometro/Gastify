"use client";
import React from "react";
import { useSelector } from "react-redux";
import AtomicTop from "../atomicTop/AtomicTop";
import UniversalCategoIcon from "../../UniversalCategoIcon";
import { formatMoneyMajor } from "@/lib/money/currencies";
import BasicTooltip from "../../Tooltips/BasicTooltip";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";

function TopMonthItem({
  color,
  childs,
  icon,
  name,
  fatherStyle,
  value,
  index,
}) {
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const { close, handleClose, renderModal, modalContent } = useModal();
  function renderModalContent(item) {
    renderModal(<ModalContentTopMonthItem item={item} close={handleClose} />);
  }
  return (
    <>
      <div
        style={{ backgroundColor: color }}
        className={
          fatherStyle ||
          "w-full h-full flex flex-col justify-start items-center relative rounded-2xl p-2 hover:brightness-95 shadow-md "
        }
      >
        <div className=" bg-white text-black flex justify-center items-center border-2 rounded-full w-[25px] h-[25px] absolute top-[6px] left-[6px] shadow-lg gap-2">
          <UniversalCategoIcon type={icon} siz={20} className={"text-black"} />
        </div>
        <div className=" bg-white text-black flex justify-center items-center border-2 rounded-full w-[25px] h-[25px] absolute top-[6px] right-[6px] shadow-lg gap-2">
          <BasicTooltip
            title={
              "In each month you can see the highest bills or transactions according to the time-period selected and the number of elements to display"
            }
          />
        </div>
        <section className="">
          <h1 className="">{name}</h1>
          {!value ? (
            "No value"
          ) : (
            <p>
              Value: <b>{value}</b>
            </p>
          )}
        </section>
        <ul className="w-full flex flex-row justify-center items-center flex-wrap truncate gap-1">
          {!childs || childs.length <= 0
            ? "No childs to display..."
            : childs.map((item, i) => (
                <AtomicTop
                  key={`atomicTop-${i}-${item.name || item.type || "no-name"}`}
                  item={item}
                  index={i}
                  name={item.name || item.type}
                  color={item.color || color}
                  icon={item.icon}
                  isBill={item.isBill}
                  value={item.value || item.amount}
                  getItem={renderModalContent}
                  fatherStyle={`tra-cat-cont flex flex-col relative justify-center gap-1 items-center flex-1 rounded-3xl p-2 hover:mix-blend-multiply min-h-[130px] min-w-[100px] cursor-pointer ${
                    item?.color ? "" : "brightness-90"
                  }`}
                  tooltip={
                    <div className="flex flex-col justify-center items-center">
                      <p>{item.name || item.type}</p>
                      <p>
                        Value:{" "}
                        <b>{formatMoneyMajor(item.value || item.amount, walletPrimaryCurrency)}</b>
                      </p>
                    </div>
                  }
                />
              ))}
        </ul>
      </div>
      {close && (
        <BasicModal close={handleClose} renderContent={modalContent} />
      )}
    </>
  );
}

export default TopMonthItem;

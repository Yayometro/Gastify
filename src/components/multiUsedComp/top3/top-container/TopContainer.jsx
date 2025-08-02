"use client";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import TopItemContainer from "../topMonthContainer/TopItemContainer";
import AtomicTop from "../atomicTop/AtomicTop";
import useModal from "@/hooks/useModalBasic";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import BasicModal from "@/components/modals/basicModal/BasicModal";

function TopContainer({ items, style, title }) {
    console.log("items -> ", items)
  const { close, handleClose, renderModal, modalContent } = useModal();
  function renderModalContent(item) {
    renderModal(<ModalContentTopMonthItem item={item} close={handleClose} />);
  }
  return (
    <>
      <div
        className={
          style?.father || "flex flex-col justify-center items-center gap-2"
        }
      >
        {title}
        <ul className="w-full flex flex-row justify-center items-center flex-wrap truncate gap-1">
          {!items || items.length <= 0
            ? "No items to display..."
            : items.map((item, i) => (
                <AtomicTop
                  key={`atomicTop-${i}-${item.name || item.type || "no-name"}`}
                  item={item}
                  index={i}
                  name={item.name || item.type}
                  color={item?.color || item.category?.color || "#DADADA"}
                  icon={item.icon || item.category?.icon}
                  isBill={item.isBill}
                  value={item.value || item.amount}
                  getItem={renderModalContent}
                  fatherStyle={`tra-cat-cont flex flex-col relative justify-center gap-1 items-center flex-1 rounded-3xl p-2 hover:mix-blend-multiply min-h-[130px] min-w-[100px] ${
                    item?.color ? "" : "brightness-90"
                  }`}
                  tooltip={
                    <div className="flex flex-col justify-center items-center">
                      <p>{item.name || item.type}</p>
                      <p>
                        Value:{" "}
                        <b>{usdFormatChanger(item.value || item.amount)}</b>
                      </p>
                    </div>
                  }
                />
              ))}
        </ul>
      </div>
      {close && <BasicModal close={handleClose} renderContent={modalContent} />}
    </>
  );
}

export default TopContainer;

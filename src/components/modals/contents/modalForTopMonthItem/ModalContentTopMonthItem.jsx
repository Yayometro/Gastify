import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import TransactionItemList from "@/components/Transactions/ItemList/TransactionItemList";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

function ModalContentTopMonthItem({ item, close }) {
  return (
    <div className="content absolute bg-slate-100 border-2 border-purple-600 flex flex-col w-full h-full max-w-[500px] max-h-[90%] rounded-2xl items-center justify-center overflow-hidden z-[10002]">
      <header className="pt-2 w-full h-fit flex flex-col justify-between items-center bg-purple-600 text-white sticky top-0 z-10">
        <span className="w-full flex gap-1 items-center justify-center font-bold text-3xl ">
          <UniversalCategoIcon
            type={
              item?.icon ||
              item?.type ||
              item?.category?.icon ||
              "md/MdFilterNone"
            }
            siz={30}
          />
          <h1>{item?.name || item?.type || "No name..."} Detail</h1>
        </span>
        <p className="font-semibold ">
          <b>
            {usdFormatChanger(item?.value || item?.amount) ||
              "No total info..."}
          </b>
        </p>
        <div className="footer-eader w-full h-3 rounded-t-3xl bg-slate-100 mt-4"></div>
      </header>
      <div className={`w-full h-full overflow-y-scroll bg-slate-100 mb-[10px]`}>
        <section className="w-full h-full bg-slate-100 flex flex-col items-center gap-1">
          {!item.children || item.children.length <= 0
            ? [item].map((transaction) => (
                <TransactionItemList
                  movement={transaction}
                  key={`render-transactions-modal-${transaction._id}`}
                />
              ))
            : item.children.map((transaction) => (
                <TransactionItemList
                  movement={transaction}
                  key={`render-transactions-modal-${transaction._id}`}
                />
              ))}
        </section>
      </div>
      <button onClick={close}>
        <div className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short z-50">
          <CategoIcon type={"MdClose"} siz={20} />
        </div>
      </button>
    </div>
  );
}

export default ModalContentTopMonthItem;

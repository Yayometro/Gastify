import React from "react";
import UniversalCategoIcon from "../multiUsedComp/UniversalCategoIcon";
import TransactionItemList from "../Transactions/ItemList/TransactionItemList";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

function RenderTransactionsInModal({ data }) {
  return (
    <div className={`w-full h-full overflow-y-scroll bg-slate-100 mb-[10px]`}>
      <header className="pt-2 w-full h-fit flex flex-col justify-between items-center bg-purple-600 text-white sticky top-0 z-10">
        <span className="w-full flex gap-1 items-center justify-center font-bold text-3xl ">
            <UniversalCategoIcon type={data?.data?.icon || "md/MdFilterNone"} siz={30}/>
          <h1>{data.indexValue || "md/MdFilterNone"} Detail</h1>
        </span>
        <p className="font-semibold ">
          <b>{usdFormatChanger(data.formattedValue )|| "No total info..."}</b>
        </p>
        <div className="footer-eader w-full h-3 rounded-t-3xl bg-slate-100 mt-4"></div>
      </header>
      <section className="w-full h-full bg-slate-100 flex flex-col items-center gap-1">
        {!data?.data?.children || data?.data.children.length <= 0
          ? "No childs to render..."
          : data?.data?.children.map((transaction) => (
              <TransactionItemList
                movement={transaction}
                key={`render-transactions-modal-${transaction._id}`}
              />
            ))}
      </section>
      </div>
  );
}

export default RenderTransactionsInModal;

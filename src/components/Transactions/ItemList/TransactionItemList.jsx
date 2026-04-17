import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import Tag from "@/components/multiUsedComp/Tag";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import currencyFormatter from "currency-formatter";
import dayjs from "dayjs";

function TransactionItemList({ movement, handleDelete, handleEdit, style }) {
  return (
    <div
      className={
        style ||
        `w-full flex justify-between items-center bg-slate-50 rounded-2xl py-1 px-2 hover:bg-slate-200 relative`
      }
    >
      <div className="section-one flex justify-start items-center gap-2">
        <div
          style={{
            backgroundColor: movement.category?.color || "#DADADA",
          }}
          className={`circle-ico min-w-[50px] min-h-[50px] rounded-full flex items-center justify-center hover:mix-blend-multiply`}
        >
          <UniversalCategoIcon
            type={`${movement?.category?.icon || "md/MdFilterNone"}`}
            size={10}
          />
        </div>
        <div className="center-cont flex flex-col">
          <div className="tra-text font-medium">
            <p className="tra-name text-start">
              {movement?.name || "No name. Asign one..."}
            </p>
          </div>
          <div className="tra-acount-cont text-[10px] font-normal">
            <p className=" text-start">
              {movement.account?.name || "No account..."}
            </p>
          </div>
          <div className="tra-tag-cont flex flex-wrap gap-1 items-center justify-start text-[10px] font-thin">
            <p className="font-light">Tags: </p>
            {!movement.tags ? (
              <p>No tags...</p>
            ) : (
              movement.tags.map((tag) => (
                <Tag tag={tag} key={tag._id} size={8} />
              ))
            )}
          </div>
        </div>
      </div>
      <div className="tra-amount flex flex-col gap-[1px] w-fit items-end justify-end">
        {movement.isBill ? (
          <div className="flex flex-col items-end">
            <div className="tra-amount-cont text-red-500 flex gap-1 items-center font-medium">
              <CategoIcon type={"MdKeyboardDoubleArrowDown"} />
              <p className="tra-amount ">
                {currencyFormatter.format(movement.amount, {
                  locale: "en-US",
                })}
              </p>
            </div>
            <div className="date-container text-[12px] font-light">
              {dayjs(movement.date || movement.createdAt).format("DD/MM/YYYY")}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <div className="tra-amount-cont text-green-500 flex gap-1 items-center font-medium">
              <CategoIcon type={"MdKeyboardDoubleArrowUp"} />
              <p className="tra-amount ">
                {currencyFormatter.format(movement.amount, {
                  locale: "en-US",
                })}
              </p>
            </div>
            <div className="date-container text-[12px] font-light">
              {dayjs(movement.date || movement.createdAt).format("DD/MM/YYYY")}
            </div>
          </div>
        )}
        <div className="btns flex justify-between gap-2">
          <button
            onClick={() => handleDelete(movement._id)}
            className={`hover:text-blue-700 micro-pulse`}
          >
            <CategoIcon type={"MdDelete"} size={15} className="" />
          </button>
          <button
            onClick={() => handleEdit(movement)}
            className="hover:text-red-700 micro-pulse"
          >
            <CategoIcon type={"MdOutlineCreate"} size={15} className="" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionItemList;

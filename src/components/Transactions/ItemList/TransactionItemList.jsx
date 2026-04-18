"use client";

import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import Tag from "@/components/multiUsedComp/Tag";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import currencyFormatter from "currency-formatter";
import dayjs from "dayjs";
import { Tooltip } from "antd";

function TransactionItemList({ movement, handleDelete, handleEdit, style, selectable, selected, onSelect }) {
  return (
    <div
      className={
        style ||
        `w-full flex justify-between items-center rounded-2xl py-1 px-2 hover:bg-slate-200 relative transition-colors ${
          selected ? "bg-purple-50 border border-purple-300" : "bg-slate-50"
        }`
      }
    >
      {selectable && (
        <input
          type="checkbox"
          checked={selected || false}
          onChange={() => onSelect?.(movement._id)}
          className="mr-2 w-4 h-4 cursor-pointer shrink-0 accent-purple-600"
        />
      )}
      <div className="section-one flex-1 min-w-0 flex justify-start items-center gap-2">
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
        <div className="center-cont min-w-0 overflow-hidden flex flex-col">
          <div className="tra-text font-medium min-w-0 overflow-hidden">
            <Tooltip title={movement?.name || "No name. Assign one..."} placement="top">
              <p className="tra-name text-start truncate cursor-default text-[15px]">
                {movement?.name || "No name. Assign one..."}
              </p>
            </Tooltip>
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
          {handleDelete && (
            <button
              onClick={() => handleDelete(movement._id)}
              className="hover:text-red-600 micro-pulse"
            >
              <CategoIcon type={"MdDelete"} size={15} />
            </button>
          )}
          {handleEdit && (
            <button
              onClick={() => handleEdit(movement)}
              className="hover:text-purple-600 micro-pulse"
            >
              <CategoIcon type={"MdOutlineCreate"} size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionItemList;

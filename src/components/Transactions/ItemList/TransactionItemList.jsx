"use client";

import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import Tag from "@/components/multiUsedComp/Tag";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import currencyFormatter from "currency-formatter";
import dayjs from "dayjs";
import { Tooltip } from "antd";
import { formatMoneyMinor } from "@/lib/money/currencies";

function TransactionItemList({ movement, handleDelete, handleEdit, style, selectable, selected, onSelect }) {
  // displayMoney is attached server-side (transactionReadService) by every
  // read route this component's data comes through. Fall back to the plain
  // legacy amount for any caller that hasn't been updated yet, rather than
  // crashing on a missing field.
  const isTransferLeg = movement.kind === "transfer" || movement.kind === "exchange";
  const native = movement.displayMoney?.native;
  const primary = movement.displayMoney?.primary;
  const merchant = movement.displayMoney?.merchant;
  const showEquivalent = Boolean(native && primary && native.currency !== primary.currency);
  const hasFxDetail = Boolean(merchant) || showEquivalent;
  const amountLabel = native
    ? formatMoneyMinor(native.amountMinor, native.currency)
    : currencyFormatter.format(movement.amount, { locale: "en-US" });

  const fxTooltipTitle = hasFxDetail ? (
    <div className="flex flex-col gap-0.5 text-[11px]">
      {merchant && <div>Merchant: {formatMoneyMinor(merchant.amountMinor, merchant.currency)}</div>}
      {native && <div>Account: {formatMoneyMinor(native.amountMinor, native.currency)}</div>}
      {primary ? (
        <>
          <div>Reported ({primary.currency}): {formatMoneyMinor(primary.amountMinor, primary.currency)}</div>
          <div>Rate: {primary.rate} ({primary.source})</div>
          <div>{new Date(primary.effectiveDate).toLocaleDateString()} — {primary.estimated ? "estimated" : "exact"}{primary.stale ? ", stale" : ""}</div>
        </>
      ) : (
        <div>Exchange-rate estimate unavailable</div>
      )}
    </div>
  ) : null;

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
        <div className="flex flex-col items-end">
          <div className={`tra-amount-cont ${isTransferLeg ? "text-blue-500" : movement.isBill ? "text-red-500" : "text-green-500"} flex gap-1 items-center font-medium`}>
            <Tooltip title={isTransferLeg ? `${movement.kind === "exchange" ? "Currency exchange" : "Transfer"} — not counted as income or spending` : ""}>
              <span className="flex items-center">
                <CategoIcon type={isTransferLeg ? "MdSwapHoriz" : movement.isBill ? "MdKeyboardDoubleArrowDown" : "MdKeyboardDoubleArrowUp"} />
              </span>
            </Tooltip>
            <p className="tra-amount ">{amountLabel}</p>
            {hasFxDetail && (
              <Tooltip title={fxTooltipTitle}>
                <span className="ml-1 text-[9px] font-bold text-purple-500 border border-purple-300 rounded px-1 cursor-default">
                  FX
                </span>
              </Tooltip>
            )}
          </div>
          {showEquivalent && (
            <p className="text-[11px] text-slate-500 cursor-default">
              ≈ {formatMoneyMinor(primary.amountMinor, primary.currency)}
            </p>
          )}
          <div className="date-container text-[12px] font-light">
            {dayjs(movement.date || movement.createdAt).format("DD/MM/YYYY")}
          </div>
        </div>
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

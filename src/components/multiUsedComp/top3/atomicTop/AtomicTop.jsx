import { Tooltip } from "antd";
import React from "react";
import UniversalCategoIcon from "../../UniversalCategoIcon";
import CategoIcon from "../../CategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

function AtomicTop({item, color, index, icon, name, isBill, value, fatherStyle, tooltip, getItem}) {
  return (
    <>
    <Tooltip title={tooltip}>
      <div
        className={`${fatherStyle || "tra-cat-cont flex flex-col relative justify-center gap-1 items-center flex-1 rounded-3xl p-2 hover:mix-blend-multiply min-h-[130px] min-w-[100px]"} cursor-pointer`}
        style={{
          backgroundColor: color || "#DADADA",
        }}
        onClick={() => getItem ? getItem(item) : null}
      >
        <div className="w-full flex gap-2 items-center truncate">
          <div className=" bg-white flex justify-center items-center border-2 rounded-full w-[25px] h-[25px] absolute top-[6px] left-[6px] shadow-lg">
            {index + 1}
          </div>
          <div className="w-full flex items-center justify-center gap-2 min-[352px]:flex-col min-[352px]:justify-start ">
            <div className="t3-tra-icon-cont flex justify-center items-center min-w-[10px] min-[352px]:min-w-[30px] ">
                <UniversalCategoIcon
                  type={`${icon}`}
                  size={25}
                />
            </div>
            <p className="w-full text-[15px] font-semibold truncate">
              {name || "No category name"}
            </p>
          </div>
        </div>
        <div className="flex gap-1 items-center ">
          {isBill ? (
            <div className="text-red-500">
              <CategoIcon type={"MdKeyboardDoubleArrowDown"} />
            </div>
          ) : (
            <div className="text-green-800">
              <CategoIcon type={"MdKeyboardDoubleArrowUp"} />
            </div>
          )}
          <p className="tra-amount ">
            {usdFormatChanger(value)}
          </p>
        </div>
      </div>
    </Tooltip>
    </>
  );
}

export default AtomicTop;

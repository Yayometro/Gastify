import { Tooltip } from "antd";
import React from "react";
import UniversalCategoIcon from "../../UniversalCategoIcon";
import CategoIcon from "../../CategoIcon";
import currencyFormatter from "currency-formatter"

function AtomicTop({color, index, icon, name, isBill, value, fatherStyle, tooltip}) {
  return (
    <Tooltip title={tooltip}>
      <div
        className={fatherStyle || `tra-cat-cont flex relative justify-between gap-1 items-center flex-1 rounded-3xl px-2 py-2 min-w-[106] max-w-[120px]s w-fulls hover:mix-blend-multiply min-[352px]:justify-center min-[352px]:flex-col min-[352px]:px-2 min-[352px]:min-h-[130px] min-[352px]:min-w-[100px]`}
        style={{
          backgroundColor: color || "#DADADA",
        }}
      >
        <div className="w-full flex gap-2 items-center truncate">
          <div className=" bg-white flex justify-center items-center border-2 rounded-full min-w-[30px] min-[352px]:w-[25px] min-[352px]:h-[25px] min-[352px]:absolute min-[352px]:top-[6px] min-[352px]:left-[6px] min-[352px]:shadow-lg">
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
            {currencyFormatter.format(value, {
              locale: "en-US",
            })}
          </p>
        </div>
      </div>
    </Tooltip>
  );
}

export default AtomicTop;

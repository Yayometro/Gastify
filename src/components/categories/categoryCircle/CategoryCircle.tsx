import React from "react";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { Tooltip } from "antd";

const TypedUniversalCategoIcon = UniversalCategoIcon as React.ComponentType<{
  type?: string;
  size?: number | string;
  siz?: number | string;
  className?: string;
}>;

export interface CategoryFatherLike {
  color?: string;
  name?: string;
  [key: string]: unknown;
}

export interface CategoryCircleProps<T = unknown> {
  size?: number | string;
  category?: T;
  color?: string;
  name?: string;
  icon?: string | null;
  father?: CategoryFatherLike | null | false | unknown;
  onSelect?: (category: T) => void;
  borderWidth?: number | string;
}

function CategoryCircle<T = unknown>({
  size,
  category,
  color,
  name,
  icon,
  father,
  onSelect,
  borderWidth,
}: CategoryCircleProps<T>): React.JSX.Element {
  return (
    <Tooltip title={`${name || "No name..."}`}>
      <div
        style={{
          backgroundColor: color || "#ABABAB",
          border: !father ? "" : `${borderWidth||"5"}px solid ${(father as CategoryFatherLike)?.color || "#ABABAB"}` ,
        }}
        className={`w-[${size || 100}px] h-[${
          size || 100
        }px] sm:w-[130px] sm:h-[130px] flex flex-col justify-center items-center rounded-full px-2 py-1 hover:brightness-90 transition-[filter] shadow-lg cursor-pointer`}
        onClick={() => onSelect(category)}
      >
        <div className="subCategory-list-icon-container w-full flex items-center justify-center">
          <div className={`cat-ico-cont  flex justify-center items-center`}>
            <TypedUniversalCategoIcon
              type={`${icon}` || "md/MdFilterNone"}
              size={40}
              className={`w-[28px] h-[28px] min-[400px]:w-[35px] min-[400px]:h-[35px] `}
            />
          </div>
        </div>
        <div className="cc-list-content-subCategory w-full flex items-center justify-center truncate">
          <p className="w-full min-[400px]:text-lg min-[600px]:text-xl truncate px-2">
            {name || "No name..."}
          </p>
        </div>
      </div>
    </Tooltip>
  );
}

export default CategoryCircle;

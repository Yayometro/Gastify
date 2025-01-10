import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { Tooltip } from "antd";

function CategoryCircle({
  size,
  category,
  color,
  name,
  icon,
  father,
  onSelect,
  borderWidth
}) {
  return (
    <Tooltip title={`${name || "No name..."}`}>
      <div
        style={{
          backgroundColor: color || "#ABABAB",
          border: !father ? "" : `${borderWidth||"5"}px solid ${father?.color || "#ABABAB"}` ,
        }}
        className={`w-[${size || 100}px] h-[${
          size || 100
        }px] sm:w-[130px] sm:h-[130px] flex flex-col justify-center items-center rounded-full px-2 py-1 hover:mix-blend-multiply shadow-lg cursor-pointer`}
        onClick={() => onSelect(category)}
      >
        <div className="subCategory-list-icon-container w-full flex items-center justify-center">
          <div className={`cat-ico-cont  flex justify-center items-center`}>
            <UniversalCategoIcon
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

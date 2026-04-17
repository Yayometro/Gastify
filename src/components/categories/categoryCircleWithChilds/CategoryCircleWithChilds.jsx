import React from "react";
import CategoryCircle from "../categoryCircle/CategoryCircle";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { Tooltip } from "antd";
import { FaRegQuestionCircle } from "react-icons/fa";

function CategoryCircleWithChilds({
  size,
  category,
  color,
  name,
  icon,
  onSelect,
  childs,
}) {
  return (
    <div className="father-container flex flex-col justify-start items-center gap-2">
      <span
        className="w-full text-4xl text-purple-700 hover:underline cursor-pointer flex justify-center items-center gap-2"
        onClick={() => onSelect(category)}
      >
        <UniversalCategoIcon type={icon} />
        <h1>{name}</h1>
        <Tooltip title={`Select the title of the father as well if you want to select the father and not the sub-category childs`}>
          <FaRegQuestionCircle size={25}/>
        </Tooltip>
      </span>
      <p className="text-sm font-semibold text-purple-700">
        {name} Sub Categories:
      </p>
      <div className="childs-container flex justify-center items-center gap-2 flex-wrap">
        {!childs ? (
          <p>{"This component hasn't sub-categories..."} 🤷</p>
        ) : (
          childs.map((sub) => (
            <CategoryCircle
              size={size || 50}
              category={sub}
              color={sub?.color}
              name={sub.name}
              icon={sub?.icon}
              father={sub?.fatherCategory || null}
              onSelect={onSelect}
              key={`cat-circle-childs-${sub._id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default CategoryCircleWithChilds;

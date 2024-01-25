import React from "react";


import { PiExcludeSquareDuotone } from "react-icons/pi";
import '@/components/animations.css'
import CategoIcon from "./CategoIcon";
import UniversalCategoIcon from "./UniversalCategoIcon";

function Category({category}) {
  return (
      <div
        className="category-container w-fit text-[10px] border-2- flex py-1 px-3 rounded-2xl text-center items-center gap-2 micro-pulse"
        key={category._id}
        style={{
          backgroundColor: category.color ? category.color : "gray",
        }}
      >
        <div className="incon-cate">
          {!category.icon ? (
            <UniversalCategoIcon type={`${"MdFilterNone"}`} size={20} />
          ) : (
            <UniversalCategoIcon type={`${category.icon}`} size={10} />
          )}
        </div>
        <p className="text-white font-semibold">
          {category.name ? category.name : "loading..."}
        </p>
      </div>
  );
}

export default Category;

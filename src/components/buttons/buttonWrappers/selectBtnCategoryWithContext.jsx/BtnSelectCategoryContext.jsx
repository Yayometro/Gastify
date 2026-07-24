import React, { useContext } from "react";
import SelectCategoryBtn from "../../selectCategoryBtn/SelectCategoryBtn";
import { SelectCategoryContext } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";

function BtnSelectCategoryContext({ onClose }) {
  const { itemSelected } = useContext(SelectCategoryContext);
  return (
    <>
    <span className="flex flex-col pl-2">
      <span className="flex items-center gap-2">
        <p className="text-sm text-purple-700">Selected: </p>
        <p className="text-sm text-purple-700 font-bold">{itemSelected?.name || "Nothing..."}</p>
      </span>
      {itemSelected?.fatherCategory && (
        <p className="text-[10px] text-slate-400 leading-tight">
          in {itemSelected.fatherCategory?.name || ""}
        </p>
      )}
    </span>
      <SelectCategoryBtn click={onClose} icon={itemSelected?.icon || null} />
    </>
  );
}

export default BtnSelectCategoryContext;

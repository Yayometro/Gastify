import React, { useContext } from "react";
import SelectCategoryBtn from "../../selectCategoryBtn/SelectCategoryBtn";
import { SelectCategoryContext } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";

function BtnSelectCategoryContext({ onClose }) {
  const { itemSelected } = useContext(SelectCategoryContext);
  return (
    <>
    <span className="flex justify-center items-center gap-2 pl-2">
      <p className="text-sm text-purple-700">Selected: </p>
      <p className="text-sm text-purple-700 font-bold">{itemSelected?.name||"Nothing..."}</p>
      
    </span>
      <SelectCategoryBtn click={onClose} icon={itemSelected?.icon || null} />
    </>
  );
}

export default BtnSelectCategoryContext;

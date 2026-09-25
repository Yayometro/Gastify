import React, { useContext } from "react";
import SelectCategoryBtn from "../../selectCategoryBtn/SelectCategoryBtn";
import { SelectCategoryContext } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";

export interface SelectedCategoryFather {
  name?: string;
  [key: string]: unknown;
}

export interface SelectedCategoryItem {
  name?: string;
  icon?: string;
  fatherCategory?: SelectedCategoryFather | null;
  [key: string]: unknown;
}

export interface BtnSelectCategoryContextProps {
  onClose?: () => void;
}

interface SelectCategoryBtnProps {
  size?: number;
  style?: string;
  click?: () => void;
  icon?: string | null;
}

const TypedSelectCategoryBtn = SelectCategoryBtn as React.ComponentType<SelectCategoryBtnProps>;

function BtnSelectCategoryContext({ onClose }: BtnSelectCategoryContextProps): React.JSX.Element {
  const { itemSelected } = useContext(SelectCategoryContext);
  const selected = itemSelected as SelectedCategoryItem | null;

  return (
    <>
      <span className="flex flex-col pl-2">
        <span className="flex items-center gap-2">
          <p className="text-sm text-purple-300">Selected: </p>
          <p className="text-sm text-purple-300 font-bold">{selected?.name || "Nothing..."}</p>
        </span>
        {selected?.fatherCategory && (
          <p className="text-[10px] text-gf-text-muted leading-tight">
            in {selected.fatherCategory?.name || ""}
          </p>
        )}
      </span>
      <TypedSelectCategoryBtn click={onClose} icon={selected?.icon || null} />
    </>
  );
}

export default BtnSelectCategoryContext;

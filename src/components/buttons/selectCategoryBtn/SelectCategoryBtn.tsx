import React from "react";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";

export interface SelectCategoryBtnProps {
  size?: number | string;
  style?: string;
  click?: () => void;
  icon?: string | null;
}

function SelectCategoryBtn({ size, style, click, icon }: SelectCategoryBtnProps): React.JSX.Element {
  return (
    <button className={style||' rounded-2xl border-2 border-purple-600 hover:bg-gf-accent-soft-bg p-2 flex flex-col justify-center items-center'} onClick={click} type="button">
        <p className='text-purple-600 text-xs pb-1'>{icon?"":"No "}Selected</p>
        <UniversalCategoIcon type={icon || "md/MdFilterNone"} siz={size||25} />
    </button>
  );
}

export default SelectCategoryBtn;
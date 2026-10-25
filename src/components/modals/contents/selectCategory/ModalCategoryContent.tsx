import CategoriesModalList from "@/components/categories/categoriesModalList/CategoriesModalList";
import RenderCategoriesSearch from "@/components/categories/renderCateoriesSelect/RenderCategoriesSearch";
import {
  SelectCategoryContext,
  type CategoryItem,
} from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import React, { useContext } from "react";
import { BiSolidCategory } from "react-icons/bi";
import { useT } from "@/i18n/client";

export interface ModalCategoryContentProps {
  getSelected?: (category: unknown) => void;
  close?: () => void;
  onlyFathers?: boolean;
  // Inside a form: the list opens in place, with no window, header or × of its own (the form has its own).
  inline?: boolean;
}

function ModalCategoryContent({
  getSelected,
  close,
  onlyFathers = false,
  inline = false,
}: ModalCategoryContentProps): React.JSX.Element {
  const t = useT();
  const { handleSelect } = useContext(SelectCategoryContext);

  const list = (
    <section className="w-full h-full flex flex-col items-center justify-start gap-1">
      <RenderCategoriesSearch
        onlyFathers={onlyFathers}
        getSelected={(cat: CategoryItem) => {
          if (onlyFathers && cat?.fatherCategory) return null;
          handleSelect(cat, getSelected, close);
        }}
      />
      <div className="cat-container w-full flex flex-col justify-start items-center gap-2">
        <CategoriesModalList
          onlyFathers={onlyFathers}
          onSelect={(cat: CategoryItem) => handleSelect(cat, getSelected, close)}
        />
      </div>
    </section>
  );

  if (inline) {
    return (
      <div className="w-full max-h-[340px] overflow-y-auto rounded-2xl gf-glass-inset p-3">
        {list}
      </div>
    );
  }

  return (
    <div className="content absolute gf-glass-violet flex flex-col w-full h-full max-w-[500px] max-h-[90%] rounded-2xl items-center justify-center overflow-hidden z-[10002]">
      <header className="pt-2 w-full h-fit flex flex-col justify-between items-center text-white sticky top-0 z-10">
        <span className="w-full flex gap-2 items-center justify-center font-bold text-3xl ">
          <BiSolidCategory size={40} className="hidden sm:inline" />
          <h1>{onlyFathers ? t("web.select.parent") : t("web.select.category")}</h1>
        </span>
        <div className="footer-eader w-full h-3 rounded-t-3xl mt-4"></div>
      </header>
      <div className={`w-full h-full overflow-y-scroll mb-[10px]`}>
        {list}
      </div>
      <button onClick={close}>
        <div className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short z-50">
          <CategoIcon type={"MdClose"} siz={20} />
        </div>
      </button>
    </div>
  );
}

export default ModalCategoryContent;

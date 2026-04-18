import CategoriesModalList from "@/components/categories/categoriesModalList/CategoriesModalList";
import RenderCategoriesSearch from "@/components/categories/renderCateoriesSelect/RenderCategoriesSearch";
import { SelectCategoryContext } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import { useContext} from "react";
import { BiSolidCategory } from "react-icons/bi";

function ModalCategoryContent({ getSelected, close, onlyFathers = false }) {
  const { handleSelect, searchCat } = useContext(SelectCategoryContext);

  const handleSelectedCategory = (cat) => {
    if (onlyFathers && cat?.fatherCategory) {
      // If onlyFathers is true, we should only allow selecting categories that don't have a father
      // But we can also check if the category itself is a "father" candidate
      // For now, let's just use the organized list filtering or block subcategories
      return null;
    }
    handleSelect(cat, getSelected, close);
  };

  return (
    <div className="content absolute bg-slate-100 border-2 border-purple-600 flex flex-col w-full h-full max-w-[500px] max-h-[90%] rounded-2xl items-center justify-center overflow-hidden z-[10002]">
      <header className="pt-2 w-full h-fit flex flex-col justify-between items-center bg-purple-600 text-white sticky top-0 z-10">
        <span className="w-full flex gap-2 items-center justify-center font-bold text-3xl ">
          <BiSolidCategory size={40} className="hidden sm:inline" />
          <h1>{onlyFathers ? "Select Father" : "Select Category"}</h1>
        </span>
        <div className="footer-eader w-full h-3 rounded-t-3xl bg-slate-100 mt-4"></div>
      </header>
      <div className={`w-full h-full overflow-y-scroll bg-slate-100 mb-[10px]`}>
        <section className="w-full h-full bg-slate-100 flex flex-col items-center justify-start gap-1">
          <RenderCategoriesSearch
            onlyFathers={onlyFathers}
            getSelected={(cat) => {
              if (onlyFathers && cat?.fatherCategory) return null;
              handleSelect(cat, getSelected, close);
            }}
          />
          <div className="cat-container w-full flex flex-col justify-start items-center gap-2">
            <CategoriesModalList
              onlyFathers={onlyFathers}
              onSelect={(cat) => handleSelect(cat, getSelected, close)}
            />
          </div>
        </section>
      </div>
      <button onClick={close}>
        <div className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short z-50">
          <CategoIcon type={"MdClose"} siz={20} />
        </div>
      </button>
    </div>
  );
}

export default ModalCategoryContent;

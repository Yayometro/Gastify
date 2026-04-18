import SearchInput from "@/components/inputs/search/SearchInput";
import { useContext } from "react";
import { SelectCategoryContext } from "../SelectCategoryProvider/SelectCategoryProvider";
import CategorySearchedItem from "../categorySearchedItem/CategorySearchedItem";

function RenderCategoriesSearch({ getSelected, onlyFathers = false }) {
  const { handleSearch, searchCat } = useContext(SelectCategoryContext);
  const filtered = onlyFathers ? searchCat.filter((c) => !c?.fatherCategory) : searchCat;
  return (
    <div className="cat-container w-[80%] max-w-[550px] h-fit flex flex-col  justify-start items-center gap-2 pt-2 pb-4">
      <span className="w-full flex justify-center items-center text-purple-600">
        <SearchInput onChange={handleSearch} />
      </span>
      {filtered.length <= 0 ? (
        ""
      ) : (
        <div className="finded-cats-container w-full h-fit shadow-md flex flex-col items-center justify-center gap-2 bg-slate-100">
          {filtered.map((cat) => (
            <CategorySearchedItem
              key={`item-search-category-${cat._id}`}
              category={cat}
              icon={cat?.icon}
              name={cat.name}
              onSelect={getSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RenderCategoriesSearch;

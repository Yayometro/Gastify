import React, { useContext } from "react";
import SearchInput from "@/components/inputs/search/SearchInput";
import { SelectCategoryContext, type CategoryItem } from "../SelectCategoryProvider/SelectCategoryProvider";
import CategorySearchedItem from "../categorySearchedItem/CategorySearchedItem";

export interface RenderCategoriesSearchProps {
  getSelected?: (category: CategoryItem) => void;
  onlyFathers?: boolean;
}

function RenderCategoriesSearch({ getSelected, onlyFathers = false }: RenderCategoriesSearchProps): React.JSX.Element {
  const { handleSearch, searchCat } = useContext(SelectCategoryContext);
  const cats = searchCat as CategoryItem[];
  const filtered = onlyFathers ? cats.filter((c) => !c?.fatherCategory) : cats;
  return (
    <div className="cat-container w-[80%] max-w-[550px] h-fit flex flex-col  justify-start items-center gap-2 pt-2 pb-4">
      <span className="w-full flex justify-center items-center text-purple-600">
        <SearchInput onChange={handleSearch as React.ChangeEventHandler<HTMLInputElement>} />
      </span>
      {filtered.length <= 0 ? (
        ""
      ) : (
        <div className="finded-cats-container w-full h-fit shadow-md flex flex-col items-center justify-center gap-2 bg-gf-surface-2">
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

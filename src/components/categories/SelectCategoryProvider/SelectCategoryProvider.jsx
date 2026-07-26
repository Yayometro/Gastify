import { organizedCategoriesAndSubCategories } from "@/helpers/transformers/categoriesTransformers";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import React, { useEffect, useState } from "react";

export const SelectCategoryContext = React.createContext({
  newCategories: [],
    setNewCategories: null,
    searchCat: [],
    setSearchCat: null,
    handleSearch: null,
    itemSelected: null,
    setItemSelected: null,
    handleSelect: null,
    handleClean: null
});

function SelectCategoryProvider({ children }) {
  const { categories, subCategories } = useGetDataFromProvider();
  const [newCategories, setNewCategories] = useState([]);
  const [itemSelected, setItemSelected] = useState(null)
  const [searchCat, setSearchCat] = useState([])
  useEffect(() => {
    const safeCats = Array.isArray(categories) ? categories : [];
    const safeSubCats = Array.isArray(subCategories) ? subCategories : [];
    if (safeCats.length > 0 || safeSubCats.length > 0) {
      const organized = organizedCategoriesAndSubCategories([...safeCats, ...safeSubCats]);
      setNewCategories(organized);
    }
  }, [categories, subCategories]);

  function handleSearch(e) {
    const val = e?.currentTarget?.value ?? e?.target?.value ?? "";
    if (!val.trim()) {
      setSearchCat([]);
    } else {
      const toSearch = val.trim();
      const regex = new RegExp(toSearch, "i");
      const safeCats = Array.isArray(categories) ? categories : [];
      const safeSubCats = Array.isArray(subCategories) ? subCategories : [];
      const searchResults = [...safeCats, ...safeSubCats].filter((c) => c && c.name && regex.test(c.name));
      setSearchCat(searchResults);
    }
  }
  function handleSelect(category, callBack, close){
    if(!category) return ;
    setItemSelected(category)
    callBack(category)
    close()
  }
  function handleClean(){
      setItemSelected(null)
  }
  const data = {
    newCategories,
    setNewCategories,
    searchCat,
    setSearchCat,
    handleSearch,
    itemSelected,
    setItemSelected,
    handleSelect,
    handleClean
  };
  return (
    <SelectCategoryContext.Provider value={data}>
      {children}
    </SelectCategoryContext.Provider>
  );
}

export default SelectCategoryProvider;

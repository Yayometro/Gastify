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
    if (categories.length >= 1 && subCategories.length >= 1) {
      setNewCategories(organizedCategoriesAndSubCategories([...categories, ...subCategories]));
    }
  }, [categories, subCategories]);

  function handleSearch(e){
    if(!e.currentTarget.value.trim()){
      setSearchCat([])
    } else {
      const toSearch = e.currentTarget.value.trim()
      const regex = new RegExp(toSearch, "i")
      const searchResults = [...categories, ...subCategories].filter(c => regex.test(c.name))
      setSearchCat(searchResults)
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

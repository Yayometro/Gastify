import { organizedCategoriesAndSubCategories } from "@/helpers/transformers/categoriesTransformers";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import React, { useEffect, useState } from "react";

export interface CategoryItem {
  _id?: string;
  name?: string;
  icon?: string;
  color?: string;
  fatherCategory?: unknown;
  children?: CategoryItem[];
  [key: string]: unknown;
}

export interface SelectCategoryContextType {
  newCategories: CategoryItem[] | unknown[];
  setNewCategories: React.Dispatch<React.SetStateAction<CategoryItem[] | unknown[]>> | null;
  searchCat: CategoryItem[] | unknown[];
  setSearchCat: React.Dispatch<React.SetStateAction<CategoryItem[] | unknown[]>> | null;
  handleSearch: ((e?: React.ChangeEvent<HTMLInputElement> | { target?: { value?: string }; currentTarget?: { value?: string } } | string) => void) | null;
  itemSelected: unknown | null;
  setItemSelected: React.Dispatch<React.SetStateAction<unknown | null>> | null;
  handleSelect: ((category: unknown, callBack: (cat: unknown) => void, close: () => void) => void) | null;
  handleClean: (() => void) | null;
}

export interface SelectCategoryProviderProps {
  children?: React.ReactNode;
}

export const SelectCategoryContext = React.createContext<SelectCategoryContextType>({
  newCategories: [],
  setNewCategories: null,
  searchCat: [],
  setSearchCat: null,
  handleSearch: null,
  itemSelected: null,
  setItemSelected: null,
  handleSelect: null,
  handleClean: null,
});

function SelectCategoryProvider({ children }: SelectCategoryProviderProps): React.JSX.Element {
  const { categories, subCategories } = useGetDataFromProvider() as {
    categories?: unknown;
    subCategories?: unknown;
  };
  const [newCategories, setNewCategories] = useState<CategoryItem[] | unknown[]>([]);
  const [itemSelected, setItemSelected] = useState<unknown | null>(null);
  const [searchCat, setSearchCat] = useState<CategoryItem[] | unknown[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const safeCats = (Array.isArray(categories) ? categories : []) as CategoryItem[];
    const safeSubCats = (Array.isArray(subCategories) ? subCategories : []) as CategoryItem[];
    if (safeCats.length > 0 || safeSubCats.length > 0) {
      const organized = organizedCategoriesAndSubCategories([...safeCats, ...safeSubCats]);
      setNewCategories(organized);
    }
  }, [categories, subCategories]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchCat([]);
    } else {
      const safeCats = (Array.isArray(categories) ? categories : []) as CategoryItem[];
      const safeSubCats = (Array.isArray(subCategories) ? subCategories : []) as CategoryItem[];
      const regex = new RegExp(searchTerm.trim(), "i");
      const searchResults = [...safeCats, ...safeSubCats].filter((c) => c && c.name && regex.test(c.name));
      setSearchCat(searchResults);
    }
  }, [searchTerm, categories, subCategories]);

  function handleSearch(
    e?: React.ChangeEvent<HTMLInputElement> | { target?: { value?: string }; currentTarget?: { value?: string } } | string
  ) {
    const val = typeof e === "string" ? e : (e?.target?.value ?? e?.currentTarget?.value ?? "");
    setSearchTerm(val);
  }

  function handleSelect(category: unknown, callBack: (cat: unknown) => void, close: () => void) {
    if (!category) return;
    setItemSelected(category);
    callBack(category);
    close();
  }

  function handleClean() {
    setItemSelected(null);
  }

  const data: SelectCategoryContextType = {
    newCategories,
    setNewCategories,
    searchCat,
    setSearchCat,
    handleSearch,
    itemSelected,
    setItemSelected,
    handleSelect,
    handleClean,
  };

  return (
    <SelectCategoryContext.Provider value={data}>
      {children}
    </SelectCategoryContext.Provider>
  );
}

export default SelectCategoryProvider;

import React from "react";
import SelectCategoryProvider from "./SelectCategoryProvider";

export interface SelectCategoriesProps {
  children?: React.ReactNode;
}

function SelectCategories({ children }: SelectCategoriesProps): React.JSX.Element {
  return (
    <>
      <SelectCategoryProvider>{children}</SelectCategoryProvider>
    </>
  );
}

export default SelectCategories;

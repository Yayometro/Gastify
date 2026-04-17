
import SelectCategoryProvider from "./SelectCategoryProvider";

function SelectCategories({ children }) {
  return (
    <>
      <SelectCategoryProvider>{children}</SelectCategoryProvider>
    </>
  );
}

export default SelectCategories;

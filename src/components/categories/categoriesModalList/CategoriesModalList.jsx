import React, { useContext } from "react";
import { SelectCategoryContext } from "../SelectCategoryProvider/SelectCategoryProvider";
import CategoryCircle from "../categoryCircle/CategoryCircle";
import CategoryCircleWithChilds from "../categoryCircleWithChilds/CategoryCircleWithChilds";

function CategoriesModalList({ onSelect }) {
  const { newCategories } = useContext(SelectCategoryContext);
  console.log("newCategories in CategoriesModalList", newCategories)
  return (
    <>
      {!newCategories || newCategories.length <= 0 ? (
        <p className="text-3xl text-center p-8">No categories to display 🤔</p>
      ) : (
        <>
          <h1 className="py-3">Categories without sub-categories:</h1>
          <div className="w-full flex justify-center items-center gap-2 flex-wrap">
            {newCategories.filter(c => c?.isDefaultCatego).map((cat) => (
              <CategoryCircle
                size={50}
                category={cat}
                color={cat?.color}
                name={cat.name}
                icon={cat?.icon}
                father={false}
                onSelect={onSelect}
                key={`catCircle-without-childrens-${cat._id}`}
              />
            ))}
          </div>
          <h1 className="py-3">Father categories: </h1>
          <div className="w-full flex flex-col justify-center items-center gap-2 flex-wraps">
            {newCategories.filter(c => c?.children).map((cat) => (
              <CategoryCircleWithChilds
                category={cat}
                size={50}
                color={cat?.color}
                icon={cat?.icon}
                name={cat.name}
                onSelect={onSelect}
                childs={cat.children}
                key={`catCircle-with-childrens-${cat._id}`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default CategoriesModalList;

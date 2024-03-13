import React, { useState, useEffect } from "react";
import EmptyModule from "./EmptyModule";
import UniversalCategoIcon from "./UniversalCategoIcon";
import { Spin, Tooltip } from "antd";
import EditCategoryModal from "./EditCategoryModal";
import runNotify from "@/helpers/gastifyNotifier";

function CategoryList({ clCategories ,clUser }) {
  const [onEdition, setOnEdition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState({});

  // useEffect(() => {
  //   if(clCategories){
  //     console.log(clCategories)
  //     setCategories(clCategories)
  //   }
  //   if(clSubCategory){
  //     console.log(clSubCategory)
  //     setSubCategories(clSubCategory)
  //   }
  // }, [clCategories, clSubCategory])
  
  return (
    <div className="category-list-component w-full h-full flex gap-2 flex-wrap justify-center items-center">
      <EditCategoryModal
        ecmMode={onEdition}
        ecmCategory={selectedCategory}
        ecmClose={(e) => setOnEdition(e)}
        ecmData={{ user: clUser, categories: clCategories }}
      />
      {
        !clCategories ? (
          <div className="w-full h-full flex justify-center items-center">
            <EmptyModule
              emMessage={`No categories to display. Please create a new one or refresh the page and try later... 🤕`}
            />
          </div>
        ) : clCategories.length <= 0 ? (
          <div className="w-full h-full flex flex-col justify-center items-center gap-2">
            <Spin size="large" />
            <p className="">Loading...</p>
          </div>
        ) : (
          clCategories.map((category) => (
            <Tooltip
              title={`${category?.name || "No name..."}`}
              key={`cc-clist-key-cat-${category._id}`}
            >
              <div
                style={{ backgroundColor: category.color || "#ABABAB" }}
                className={`w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] flex flex-col justify-center items-center rounded-full px-2 py-1 hover:mix-blend-multiply shadow-lg cursor-pointer`}
                onClick={() => {
                  if (category.isDefaultCatego) {
                    runNotify(
                      "warning",
                      `"${
                        category?.name || "This"
                      }" is a default category and can't be modified in any way 🚨`
                    );
                  } else {
                    setOnEdition(`edition`);
                    setSelectedCategory(category);
                  }
                }}
              >
                <div className="category-list-icon-container w-full flex items-center justify-center">
                  <div
                    className={`cat-ico-cont  flex justify-center items-center`}
                  >
                    {!category.icon ? (
                      <UniversalCategoIcon
                        type={"md/MdFilterNone"}
                        size={40}
                        className={`w-[100px] min-[400px]:w-[150px]`}
                      />
                    ) : (
                      <UniversalCategoIcon
                        type={`${category.icon}`}
                        size={40}
                        className={`w-[28px] h-[28px] min-[400px]:w-[35px] min-[400px]:h-[35px] `}
                      />
                    )}
                  </div>
                </div>
                <div className="cc-list-content-category w-full flex items-center justify-center truncate">
                  <p className="w-full min-[400px]:text-lg min-[600px]:text-xl truncate px-2">
                    {category?.name || "No name..."}
                  </p>
                </div>
              </div>
            </Tooltip>
          ))
        )
      }
    </div>
  );
}

export default CategoryList;

// subCtegories.map((subCategory) => (
//   <Tooltip
//     title={`${subCategory?.name || "No name..."}`}
//     key={`cc-clist-key-sub${subCategory._id}`}
//   >
//     <div
//       style={{
//         backgroundColor: subCategory.color || "#ABABAB",
//         border: `10px solid red`,
//       }}
//       className={`w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] border-[10px] sm:border-[20px]  flex flex-col justify-center items-center rounded-full px-2 py-1 hover:mix-blend-multiply shadow-lg cursor-pointer`}
//       onClick={() => {
//         if (subCategory.isDefaultSubCatego) {
//           runNotify(
//             "warning",
//             `"${
//               subCategory?.name || "This"
//             }" is a default SubCategory and can't be modified in any way 🚨`
//           );
//         } else {
//           setOnEdition(`edition`);
//           setSelectedCategory(subCategory);
//         }
//       }}
//     >
//       <div className="subCategory-list-icon-container w-full flex items-center justify-center">
//         <div
//           className={`cat-ico-cont  flex justify-center items-center`}
//         >
//           {!subCategory.icon ? (
//             <UniversalCategoIcon
//               type={"md/MdFilterNone"}
//               size={40}
//               className={`w-[100px] min-[400px]:w-[150px]`}
//             />
//           ) : (
//             <UniversalCategoIcon
//               type={`${subCategory.icon}`}
//               size={40}
//               className={`w-[28px] h-[28px] min-[400px]:w-[35px] min-[400px]:h-[35px] `}
//             />
//           )}
//         </div>
//       </div>
//       <div className="cc-list-content-subCategory w-full flex items-center justify-center truncate">
//         <p className="w-full min-[400px]:text-lg min-[600px]:text-xl truncate px-2">
//           {subCategory?.name || "No name..."}
//         </p>
//       </div>
//     </div>
//   </Tooltip>
// ))

// {!categories ? (
//   <div className="w-full h-full flex justify-center items-center">
//     <EmptyModule
//       emMessage={`No categories to display. Please create a new one or refresh the page and try later... 🤕`}
//     />
//   </div>
// ) : categories.length <= 0 ? (
//   <div className="w-full h-full flex flex-col justify-center items-center gap-2">
//     <Spin size="large" />
//     <p className="">Loading...</p>
//   </div>
// ) : (
//   categories.map((category) => (
//     <Tooltip
//       title={`${category?.name || "No name..."}`}
//       key={`cc-clist-key-cat-${category._id}`}
//     >
//       <div
//         style={{ backgroundColor: category.color || "#ABABAB" }}
//         className={`w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] flex flex-col justify-center items-center rounded-full px-2 py-1 hover:mix-blend-multiply shadow-lg cursor-pointer`}
//         onClick={() => {
//           if (category.isDefaultCatego) {
//             runNotify(
//               "warning",
//               `"${
//                 category?.name || "This"
//               }" is a default category and can't be modified in any way 🚨`
//             );
//           } else {
//             setOnEdition(`edition`);
//             setSelectedCategory(category);
//           }
//         }}
//       >
//         <div className="category-list-icon-container w-full flex items-center justify-center">
//           <div
//             className={`cat-ico-cont  flex justify-center items-center`}
//           >
//             {!category.icon ? (
//               <UniversalCategoIcon
//                 type={"md/MdFilterNone"}
//                 size={40}
//                 className={`w-[100px] min-[400px]:w-[150px]`}
//               />
//             ) : (
//               <UniversalCategoIcon
//                 type={`${category.icon}`}
//                 size={40}
//                 className={`w-[28px] h-[28px] min-[400px]:w-[35px] min-[400px]:h-[35px] `}
//               />
//             )}
//           </div>
//         </div>
//         <div className="cc-list-content-category w-full flex items-center justify-center truncate">
//           <p className="w-full min-[400px]:text-lg min-[600px]:text-xl truncate px-2">
//             {category?.name || "No name..."}
//           </p>
//         </div>
//       </div>
//     </Tooltip>
//   ))
// )}
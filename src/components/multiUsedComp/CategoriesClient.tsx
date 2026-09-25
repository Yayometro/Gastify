"use client";

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import EmptyModule from "./EmptyModule";
import "@/components/styles/animations.css";
import UniversalCategoIcon from "./UniversalCategoIcon";
import CategoryList from "./CategoryList";
import EditCategoryModal from "./EditCategoryModal";
import SelectCategories from "@/components/categories/SelectCategoryProvider/SelectCategories";
import SubCategoryList from "./SubCategoryList";

import { fetchCategories, type CategoryData } from "@/lib/features/categoriesSlice";
import { fetchUser, type UserData } from "@/lib/features/userSlice";
import { fetchSubCat, type SubCategoryData } from "@/lib/features/subCategorySlice";
import type { AppDispatch, RootState } from "@/lib/store";

export interface CategoriesClientProps {
  ccData?: unknown;
  ccSession?: string | null;
}

function CategoriesClient({ ccSession }: CategoriesClientProps): React.JSX.Element {
  const [onEdition, setOnEdition] = useState<string | boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);
  const ccategories = useSelector((state: RootState) => state.categoriesReducer);
  const ccSubCategories = useSelector((state: RootState) => state.subCategoryReducer);
  
  // const seeGeneralData = useSelector((state) => state.generalDataReducer);
  const userData = ccUser.data;
  const categoriesData: CategoryData[] = ccategories.data.user;
  const defCategoriesData: CategoryData[] = ccategories.data.default;
  const subCategoriesData: SubCategoryData[] = ccSubCategories.data.subCat;
  const defSubCategoriesData: SubCategoryData[] = ccSubCategories.data.default;

  const allCategoriesData = categoriesData.concat(defCategoriesData);

  const sortByName = (a: { name?: string }, b: { name?: string }) =>
    (a?.name || "").localeCompare(b?.name || "");
  const sortedCategoriesData = [...categoriesData].sort(sortByName);
  const sortedDefCategoriesData = [...defCategoriesData].sort(sortByName);

  const matchesQuery = (name?: string) => (name || "").toLowerCase().includes(searchQuery.trim().toLowerCase());
  const filteredCategoriesData = sortedCategoriesData.filter((c) => matchesQuery(c.name));
  const filteredSubCategoriesData = subCategoriesData.filter((c) => matchesQuery(c.name));
  const filteredDefCategoriesData = sortedDefCategoriesData.filter((c) => matchesQuery(c.name));
  const filteredDefSubCategoriesData = defSubCategoriesData.filter((c) => matchesQuery(c.name));

  const nameGeneral = (ccUser?.data as UserData)?.fullName;
  
  useEffect(() => {
    // User
    if (ccUser.status == 'idle') {
      dispatch(fetchUser(ccSession));
    }
    // Categories
    if (ccategories.status == 'idle') {
      dispatch(fetchCategories(ccSession));
    }
    // Sub-categories
    if (ccSubCategories.status == 'idle') {
      dispatch(fetchSubCat(ccSession));
    }
  }, []);

  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full relative">
          <div className="w-full profile-img py-4 text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-thin">
              {nameGeneral || ""} Categories
            </h1>
          </div>
          <div className="content-profile-cont w-full h-full content-wallet-glass text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl px-2 pt-6 pb-[80px]">
            <div className="cc-categoryList-cont w-full flex flex-col gap-3 justify-center items-center">
              <div
                className="cc-create-new-cat-cont flex gap-2 justify-center items-center gf-glass-button px-2 py-1 min-w-[150px] sm:min-w-[250px] rounded-3xl text-white cursor-pointer"
                onClick={() => {
                  setOnEdition('creation');
                }}
              >
                <p className="">Create new</p>
                <UniversalCategoIcon
                  type={`md/MdAddCircleOutline`}
                  siz={30}
                  className={` w-[15px] min-[400px]:w-[25px]`}
                />
              </div>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full max-w-[400px] h-10 rounded-3xl gf-glass-inset px-4 text-gf-text"
              />
              <SelectCategories>
                <EditCategoryModal
                  ecmMode={onEdition}
                  ecmCategory={undefined}
                  ecmClose={(e) => setOnEdition(e)}
                  ecmData={{
                      user: userData,
                      categories: allCategoriesData
                  }}
                />
              </SelectCategories>
              <div className="cc-categoryList-cont-suv flex gap-2 flex-col flex-wrap">
                <div className="category-list-container">
                  <h1 className="text-2xl font-thin py-2">Your Categories List</h1>
                  {categoriesData.length === 0 ? (
                    <EmptyModule
                      emMessage={`Ups! No categories to show. Ad a new category or try again later... 🤕`}
                    />
                  ) : (
                    <CategoryList clCategories={filteredCategoriesData} clUser={userData}/>
                  )}
                </div>
                <div className="category-list-container">
                  <h1 className="text-2xl font-thin py-2">Your Sub Categories List</h1>
                  {subCategoriesData.length === 0 ? (
                    <EmptyModule
                      emMessage={`Ups! No subcategory to show. Ad a new subcategory or try again later... 🤕`}
                    />
                  ) : (
                    <SubCategoryList sclSubCategory={filteredSubCategoriesData} clUser={userData} sclCategories={categoriesData} />
                  )}
                </div>
                <div className="category-list-container">
                  <h1 className="text-2xl font-thin py-2">
                    Default Categories
                  </h1>
                  {defCategoriesData.length === 0 ? (
                    <EmptyModule
                      emMessage={`Ups! No categories to show. Ad a new category or try again later... 🤕`}
                    />
                  ) : (
                    <CategoryList clCategories={filteredDefCategoriesData} clUser={userData}/>
                  )}
                </div>
                <div className="category-list-container">
                  <h1 className="text-2xl font-thin py-2">
                    Default Sub Categories
                  </h1>
                  {defSubCategoriesData.length === 0 ? (
                    <EmptyModule
                      emMessage={`Ups! No subcategory to show. Ad a new subcategory or try again later... 🤕`}
                    />
                  ) : (
                    <SubCategoryList sclSubCategory={filteredDefSubCategoriesData} clUser={userData} sclCategories={categoriesData} />
                  )}
                </div>
              </div>
            </div>
            {/* <div className="asociatedCategories py-3 px-1 flex gap-1 justify-center items-center flex-wrap">
              {categories.map((category) => (
                <Category
                  category={category}
                  key={category._id + String(Math.random(1))}
                />
              ))}
            </div> */}
          </div>
        </div>
    </div>
  );
}

export default CategoriesClient;

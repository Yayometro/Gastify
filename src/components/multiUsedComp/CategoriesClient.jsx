"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import EmptyModule from "./EmptyModule";
import "@/components/styles/animations.css";
import runNotify from "@/helpers/gastifyNotifier";
import fetcher from "@/helpers/fetcher";
import CategoIcon from "./CategoIcon";
import UniversalCategoIcon from "./UniversalCategoIcon";
import Category from "./Category";
import CategoryList from "./CategoryList";
import EditCategoryModal from "./EditCategoryModal";
import SubCategoryList from "./SubCategoryList";


import { fetchCategories} from '@/lib/features/categoriesSlice';
import { fetchUser } from '@/lib/features/userSlice'
import { fetchSubCat } from "@/lib/features/subCategorySlice";



function CategoriesClient({ccData, ccSession}) {
  const [onEdition, setOnEdition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Data in form
  const [accountInfo, setAccountInfo] = useState({
    name: "",
    amount: "",
  });
  // Categories
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  // 
  const toFetch = fetcher();
  // Redux
  const dispatch = useDispatch()
  const ccUser = useSelector((state) => state.userReducer)
  const ccategories = useSelector((state) => state.categoriesReducer)
  const ccSubCategories = useSelector((state) => state.subCategoryReducer)
  
  
  // const seeGeneralData = useSelector((state) => state.generalDataReducer);
  const userData = ccUser.data;
  const categoriesData = ccategories.data.user;
  const defCategoriesData = ccategories.data.default;
  const subCategoriesData = ccSubCategories.data.subCat;
  
  const allCategoriesData = categoriesData.concat(defCategoriesData);
  
  let nameGeneral = ccUser?.data.fullName
  
  useEffect(() => {
    // User
    if(ccUser.status == 'idle'){
      dispatch(fetchUser(ccSession))
    }
    //Categories
    if(ccategories.status == 'idle'){
      dispatch(fetchCategories(ccSession))
    }
    //Sub-categories
    if(ccSubCategories.status == 'idle'){
      dispatch(fetchSubCat(ccSession))
    }
  }, []);


  useEffect(() => {
    if (categoriesData) {
      if (categoriesData.length > 0) {
        const allCategories = [...categoriesData].sort((a, b) => {
          const firstName = a?.name;
          const secondName = b?.name;
          return firstName.localeCompare(secondName);
        });
        setCategories(allCategories);
      }
    }
    if(subCategoriesData){
        setSubCategories(subCategoriesData)
    }
  }, [categoriesData, subCategoriesData]);

  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full relative">
          <div className="w-full profile-img py-[40px] text-center text-white">
            <h1 className="text-3xl min-[400px]:text-[40px] sm:text-[40px] md:text-[60px] font-thin">
              {nameGeneral || ""} Categories
            </h1>
          </div>
          <div className="content-profile-cont w-full h-full bg-slate-100 text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl shadow-sm px-2 pt-6 pb-[80px]">
            <h1 className="3xl w-full "></h1>
            <div className="cc-categoryList-cont w-full flex flex-col justify-center items-center">
              <h1 className="text-3xl min-[text-[45px]]: py-2">
                Categories details
              </h1>
              <div
                className="cc-create-new-cat-cont flex gap-2 justify-center items-center bg-purple-600 px-2 py-1 min-w-[150px] sm:min-w-[250px] rounded-3xl text-white cursor-pointer hover:bg-purple-500"
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
              <EditCategoryModal
                ecmMode={onEdition}
                ecmClose={(e) => setOnEdition(e)}
                ecmData={{
                    user: userData,
                    categories: allCategoriesData
                }}
              />
              <div className="cc-categoryList-cont-suv flex gap-2 flex-col flex-wrap">
                <div className="category-list-container">
                  <h1 className="text-2xl font-thin py-2">Your Categories List</h1>
                  {categoriesData.length < 0 ? (
                    <EmptyModule
                      emMessage={`Ups! No categories to show. Ad a new category or try again later... 🤕`}
                    />
                  ) : (
                    <CategoryList clCategories={categoriesData} clUser={userData}/>
                  )}
                </div>
                <div className="category-list-container">
                  <h1 className="text-2xl font-thin py-2">Your Sub Categories List</h1>
                  {subCategoriesData.length < 0 ? (
                    <EmptyModule
                      emMessage={`Ups! No subcategory to show. Ad a new subcategory or try again later... 🤕`}
                    />
                  ) : (
                    <SubCategoryList sclSubCategory={subCategoriesData} clUser={userData} sclCategories={categoriesData} />
                  )}
                </div>
                <div className="category-list-container">
                  <h1 className="text-2xl font-thin py-2">
                    Default Categories
                  </h1>
                  {defCategoriesData.length < 0 ? (
                    <EmptyModule
                      emMessage={`Ups! No categories to show. Ad a new category or try again later... 🤕`}
                    />
                  ) : (
                    <CategoryList clCategories={defCategoriesData} clUser={userData}/>
                  )}
                </div>
                <div className="category-list-container">
                  <h1 className="text-2xl font-thin py-2">
                    Default Sub Categories
                  </h1>
                  {defCategoriesData.length < 0 ? (
                    <EmptyModule
                      emMessage={`Ups! No categories to show. Ad a new category or try again later... 🤕`}
                    />
                  ) : (
                    <CategoryList clCategories={defCategoriesData} clUser={userData}/>
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

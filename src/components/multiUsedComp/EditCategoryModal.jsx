import React, { useEffect, useState } from "react";
import CategoIcon from "./CategoIcon";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { DownOutlined } from "@ant-design/icons";
import {
  ColorPicker,
  ConfigProvider,
  Space,
  Spin,
  Switch,
  Tooltip,
} from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import IconDisplayerMenu from "./IconDisplayerMenu";
import { useDispatch, useSelector } from "react-redux";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "../modals/basicModal/BasicModal";
import ModalCategoryContent from "../modals/contents/selectCategory/ModalCategoryContent";
import {
  addNewCategory,
  removeOneCategory,
  updateCategory,
} from "@/lib/features/categoriesSlice";
import { addNewSubCategory, removeSubCategory, updateSubCategory } from "@/lib/features/subCategorySlice";

function EditCategoryModal({ ecmMode, ecmCategory, ecmClose, ecmData, isInline = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [formCategory, setFormCategory] = useState({
    id: "",
    name: "",
    icon: "",
    color: 0,
    fatherCategory: "",
    user: "",
    wallet: "",
  });
  const [isSub, setIsSub] = useState(false);
  const [fatherCat, setFatherCat] = useState({});
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const toFetch = fetcher();
  const { close: isSelectorOpen, handleClose: handleSelectorClose, handleOpen: handleSelectorOpen } = useModal();

  //REDUX
  const dispatchEcm = useDispatch();
  const edUser = useSelector((state) => state.userReducer);
  const edCategories = useSelector((state) => state.categoriesReducer);
  const edSubCategories = useSelector((state) => state.subCategoryReducer);
  //
  const userData = edUser.data;
  const userCat = edCategories.data.user;
  const defCat = edCategories.data.default;
  const categoriesData = userCat.concat(defCat) || ecmData.categories || [];

  useEffect(() => {
    if (ecmCategory) {
      if (ecmMode === "edition") {
        if (ecmCategory.fatherCategory) {
          setFormCategory({
            id: ecmCategory._id,
            name: ecmCategory?.name,
            icon: ecmCategory?.icon,
            color: ecmCategory?.color,
            fatherCategory: ecmCategory.fatherCategory._id,
          });
          setIsSub(true);
          setFatherCat(ecmCategory.fatherCategory);
        } else {
          // console.log(ecmCategory);
          setFormCategory({
            id: ecmCategory._id,
            name: ecmCategory?.name,
            icon: ecmCategory?.icon,
            color: ecmCategory?.color,
          });
        }
      }
    }
    if (ecmMode === "creation") {
      if (userData) {
        console.log(userData);
        setFormCategory({
          ...formCategory,
          user: userData._id,
          wallet: userData.wallet,
        });
      }
    }
    setActive(ecmMode);
  }, [ecmMode, ecmCategory, userData]);

  // console.log(formCategory);

  useEffect(() => {
    // console.log(formCategory);
  }, [formCategory]);
  // HANDLERS

  const handlerSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // console.log(formCategory);
    try {
      let res;
      if (ecmMode === "edition") {
        if (formCategory.fatherCategory && isSub) {
          // console.log(formCategory);
          res = await toFetch.post(
            "general-data/subcategory/update",
            formCategory
          );
          if (!res.ok) {
            // console.log(res);
            setIsLoading(false);
            handleClose();
          } else {
            // All OK 👌
            dispatchEcm(updateSubCategory(res.data))
            setIsLoading(false);
            handleClose();
            runNotify("ok", `${res.message}`);
            //Update the REDUX state
          }
        } else { //CTAEGORY
          // console.log(formCategory);
          res = await toFetch.post(
            "general-data/categories/update-category",
            formCategory
          );
          if (!res.ok) {
            // console.log(res);
            setIsLoading(false);
            handleClose();
          } else {
            // All OK 👌
            // console.log(res.data)
            dispatchEcm(updateCategory(res.data))
            setIsLoading(false);
            handleClose();
            runNotify("ok", `${res.message}`);
            //Update the REDUX state
          }
        }
      } else if (ecmMode === "creation") {
        if (isSub) {
          // console.log(formCategory);
          if (!formCategory.fatherCategory) {
            runNotify(
              "warning",
              `You must select a "father" category if you are going to create a sub category, please select one... 🚨`
            );
            setIsLoading(false);
            return null;
          }
          if (
            formCategory.icon === "md/MdFilterNone" ||
            formCategory.icon === "" ||
            formCategory.icon === undefined
          ) {
            runNotify(
              "warning",
              `You must select a icon for this category/sub-category... 🚨`
            );
            setIsLoading(false);
            return null;
          }
          res = await toFetch.post(
            "general-data/subcategory/new",
            formCategory
          );
          if (!res.ok) {
            // console.log(res);
            setIsLoading(false);
            handleClose();
          } else {
            // NEW SUB CATEGORY
            // All OK 👌
            console.log(res.data)
            dispatchEcm(addNewSubCategory(res.data))
            setIsLoading(false);
            handleClose();
            runNotify("ok", `${res.message}`);
            // Update the REDUX state
          }
        } else {
          //CTEGORY
          //CREATION OF NEW CATEGORY
          console.log(formCategory);
          res = await toFetch.post(
            "general-data/categories/new-category",
            formCategory
          );
          if (!res.ok) {
            console.log(res);
            setIsLoading(false);
            handleClose();
          } else {
            // All OK 👌
            console.log(res.data);
            dispatchEcm(addNewCategory(res.data));
            setIsLoading(false);
            handleClose();
            runNotify("ok", `${res.message}`);
            //Update the REDUX state
          }
        }
      }
    } catch (e) {
      console.log(e);
      runNotify("error", `${e}`);
      setIsLoading(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormCategory({
      name: "",
      icon: "",
      color: 0,
      fatherCategory: "",
      user: "",
      wallet: "",
    });
    setActive(false);
    ecmClose(false);
    // console.log(formCategory)
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormCategory({ ...formCategory, [name]: value });
  };
  const handleColorChange = (e) => {
    // console.log(`#${e}`);
    setFormCategory({ ...formCategory, color: `#${e}` });
  };

  const handleFatherCategory = (cat) => {
    setFormCategory({
      ...formCategory,
      fatherCategory: cat._id,
    });
    setFatherCat(cat);
  };

  const handleRemove = async () => {
    try {
      setIsLoading(true)
      const categoryRoute = "general-data/categories/remove-category";
      const subCategoryRoute = "general-data/subcategory/remove";
      const removedId = formCategory.id;
      const res = await toFetch.post(
        !formCategory.fatherCategory ? categoryRoute : subCategoryRoute,
        removedId
      );
      if (!res.ok) {
        console.log('first')
        runNotify("error", "Something went wrong, please try again later 🤕");
        setIsLoading(false)
        handleClose();
      } else {
        if(!formCategory.fatherCategory){ 
          // CATEGORIES
          dispatchEcm(removeOneCategory(res.data.categoRemoved._id));
          runNotify(
            "ok",
            `"${res.data.categoRemoved.name.toUpperCase()}" was removed successfully 🤓`
          );
        } else { // SUBCATEGORIES
          dispatchEcm(removeSubCategory(res.data._id));
          runNotify(
            "ok",
            `${res.message}`
          );
        }
        setIsLoading(false)
        handleClose()
      }
    } catch (e) {
      runNotify("error", "Something went wrong, please try again later 🤕");
      console.log(e);
      setIsLoading(false)
    }
  };

  const modalContent = (
    <div className={`content ${!isInline ? 'modal-gradient w-[90%] h-[95%] min-[450px]:w-[80%] min-[450px]:h-[80%] relative rounded-2xl pt-[40px] overflow-hidden flex flex-col' : 'w-full h-full bg-slate-50'}`}>
      <div
        className={`${
          isLoading ? "absolute" : "hidden"
        } top-0 left-0 bg-white/70 babackdrop-blur-sm flex justify-center items-center w-full h-full z-[1001] `}
      >
        <Spin size="large" />
      </div>
      {!isInline && (
        <h1 className="text-center font-thin py-[20px] text-2xl min-[400px]:text-3xl sm:text-[50px] text-white shrink-0">
          {ecmMode === "edition" ? "Edit" : "Create New"}{" "}
          {`"${ecmCategory?.name || "item"}"`} 🪄
        </h1>
      )}
      <div
        className={`edit-cat-modal w-[100%] flex-1 min-h-0 flex flex-col gap-2 items-start justify-start ${!isInline ? 'rounded-t-[60px] pt-[30px]' : ''} overflow-y-auto`}
      >
        {!isInline && (
          <div
            className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short cursor-pointer p-2"
            onClick={handleClose}
          >
            <CategoIcon type={"MdClose"} siz={20} />
          </div>
        )}
        <div className="w-full h-full">
          <form
            onSubmit={handlerSubmit}
            className={`w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 ${!isInline ? 'rounded-t-[60px] pt-[30px]' : 'pt-4'} pb-20`}
          >
            {isInline && (
              <h1 className=" text-xl min-[450px]:text-2xl font-light text-center w-full pb-4">
                Create New Category
              </h1>
            )}
            <p className="label-tfp ">Name</p>
            <input
              type="text"
              name="name"
              className="w-full rounded-3xl border-2 border-purple-400 px-2"
              value={formCategory.name || null}
              onChange={handleChange}
              placeholder="CategoryName"
            />
            <p className="label-tfp ">Icon</p>
            <div className="icon-form-cont flex gap-2">
              <div
                className="selected-icon-form-cont border-2 border-purple-400 rounded-2xl p-2 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setIsCatMenuOpen(true)}
              >
                <p className="label-tfp ">
                  {formCategory?.icon ? "Selected" : "No icon"}
                </p>
                <UniversalCategoIcon
                  type={`${formCategory?.icon || "md/MdFilterNone"}`}
                  siz={30}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <IconDisplayerMenu
                  idmActive={isCatMenuOpen}
                  idmIcon={(i) =>
                    setFormCategory({ ...formCategory, icon: i })
                  }
                  idmClose={(a) => setIsCatMenuOpen(a)}
                />
              </div>
            </div>
            <p className="label-tfp ">Color</p>
            <div className="flex gap-2">
              <Space direction="vertical">
                <ColorPicker
                  value={formCategory?.color || "#ABABAB"}
                  format="hex"
                  showText
                  style={{
                    border: `2px solid ${formCategory?.color || "#ABABAB"}`,
                  }}
                  onChange={(c) => handleColorChange(c.toHex())}
                />
              </Space>
              <Tooltip title="Select the color you want to set for your category or subcategory... 🤓">
                <div className="text-white w-[10px]">
                  <UniversalCategoIcon
                    type={`${"fa/FaRegQuestionCircle"}`}
                    siz={15}
                  />
                </div>
              </Tooltip>
            </div>
            {ecmMode === "creation" || (ecmMode === "edition" && isSub) ? (
              <div className="w-full flex flex-col">
                <p className="label-tfp text-[10px] text-purple-900 w-full text-start">
                  Is sub category?
                </p>
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: "#9700FF",
                      borderRadius: 2,
                      colorBgContainer: "#9700FF",
                      colorBorder: "#9700FF",
                    },
                  }}
                >
                  <Space>
                    <Switch
                      checked={isSub}
                      onChange={(checked) => setIsSub(checked)}
                      style={{ border: "#9700FF" }}
                    />
                  </Space>
                </ConfigProvider>
                <div
                  className={`edm-cat-selector ${
                    !isSub ? "hidden" : "flex"
                  } flex-col gap-1 w-full mt-2`}
                >
                  <p className="label-tfp !text-[12px] !text-purple-600">Selected Father Category:</p>
                  <div 
                    onClick={handleSelectorClose}
                    className="w-full bg-white border-2 border-purple-400 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UniversalCategoIcon
                        type={`${fatherCat?.icon || "md/MdFilterNone"}`}
                        siz={30}
                        color={fatherCat?.color}
                      />
                      <span className="font-medium text-purple-900">
                        {fatherCat?.name || "Click to select a father category"}
                      </span>
                    </div>
                    <DownOutlined className="text-purple-600" />
                  </div>
                </div>
                {isSelectorOpen && (
                  <BasicModal
                    close={handleSelectorClose}
                    renderContent={
                      <ModalCategoryContent
                        close={handleSelectorClose}
                        getSelected={handleFatherCategory}
                        onlyFathers={true}
                      />
                    }
                  />
                )}
              </div>

            ) : (
              ""
            )}
            <div className="remove-item">
              {ecmMode === "edition" ? (
                <div
                  className="w-full p-2 text-center text-red-500 underline rounded-full mt-3 hover:text-red-700 cursor-pointer"
                  onClick={handleRemove}
                >
                  Remove{" "}
                  {formCategory?.fatherCategory ? "Subcategory" : "Category"}
                </div>
              ) : (
                ""
              )}
            </div>
            <button
              className="w-full p-2 bg-purple-600 text-white text-center rounded-full mt-3 hover:bg-purple-500"
              type="submit"
            >
              {isLoading ? (
                <Spin />
              ) : ecmMode === "edition" ? (
                "Edit"
              ) : (
                "Create"
              )}
            </button>
            {isInline && (
              <div
                className="clearForm underline text-red-400 cursor-pointer w-full text-center mt-2 pb-4"
                onClick={handleClose}
              >
                Clear Form
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return modalContent;
  }

  return (
    <div
      className={`fixed top-[-0%] right-[-0%] w-[100%] h-[100%] z-[1000] ${
        !active ? "hidden" : "flex"
      } items-center justify-center backdrop-blur-[3px]`}
    >
      {modalContent}
    </div>
  );
}

export default EditCategoryModal;

import React, { useState, useEffect } from "react";
import CategoIcon from "./CategoIcon";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { createTheme, ThemeProvider } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDateTimePicker } from "@mui/x-date-pickers/StaticDateTimePicker";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { Switch } from "antd";
import { Button, ConfigProvider, Space, Spin } from "antd";
import fetcher from "@/helpers/fetcher";
import { useDispatch, useSelector } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import { updateTransaction } from "@/lib/features/transacctionsSlice";

function EditTransModal({ hidden, trans }) {
  const [active, setActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false)

  const toFetch = fetcher();
   // Redux
   const dispatch = useDispatch()
   const ccUser = useSelector((state) => state.userReducer)
   const ccategories = useSelector((state) => state.categoriesReducer)
   const ccSubCategories = useSelector((state) => state.subCategoryReducer)
   const ccAccounts = useSelector((state) => state.accountsReducer)
   
  const accounts = ccAccounts.data;
  const categories = ccategories.data.user.concat(ccategories.data.default)
  
  const subCategories = ccSubCategories.data.subCat;
  const [transactionInfo, setTransactionInfo] = useState({
    name: "",
    amount: 0,
    isIncome: false,
    isBill: false,
    isReadable: false,
    date: "",
    category: "",
    subCategory: "",
    tags: [],
    account: "",
  });

  useEffect(() => {
    if (trans) {
      setTransactionInfo({
        ...transactionInfo,
        id: trans._id,
        name: trans?.name,
        amount: trans?.amount,
        isIncome: trans?.isIncome,
        isBill: trans?.isBill,
        isReadable: trans?.isReadable,
        date: dayjs(trans.date || trans.createdAt).format("YYYY-MM-DDTHH:mm"),
        category: trans?.category?._id,
        subCategory: trans?.subCategory?._id,
        tags: trans?.tags.map((tag) => tag.name).join(","),
        account: trans?.account?._id,
      });
    }
  }, [trans]);
  //MATERIAL UI
  const theme = createTheme({
    components: {
      MuiTextField: {
        // Este es el componente interno usado en el DatePicker
        styleOverrides: {
          root: {
            height: "30px", // Establece la altura deseada
            // Aquí puedes añadir más estilos como el tamaño de la fuente, padding, etc.
          },
        },
      },
    },
  });

  const handleClose = () => {
    setActive(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransactionInfo({ ...transactionInfo, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    const trimmedName = transactionInfo.name.trim();
    const tagsArray = transactionInfo.tags.split(",");
    const tagsArrCleaned = tagsArray.map(tag => tag.trim())
    const newTrans = { ...transactionInfo, name: trimmedName, tags: tagsArrCleaned };
    
    try {
      const response = await toFetch.post(
        `general-data/transactions/${trans._id}`,
        newTrans
      );
      
      if (response.data) {
        runNotify("ok", response.message)
        //UPDATE FRONT END REDUX
        dispatch(updateTransaction(response.data))
        setIsLoading(false)
        handleClose();
      }
    } catch (e) {
      console.log(e)
      runNotify("error", String(e))
      throw new Error(e);
    }
  };
  //DATE
  function hanleDatePickerChange(newDate) {
    setTransactionInfo({ ...transactionInfo, date: new Date(newDate) });
  }
  //SWITCHER:
  const onChangeSwitch = (checked, typeBoolean) => {
    if (typeBoolean === "income") {
      setTransactionInfo({
        ...transactionInfo,
        isIncome: checked,
        isBill: !checked,
      });
    } else if (typeBoolean === "bill") {
      setTransactionInfo({
        ...transactionInfo,
        isBill: checked,
        isIncome: !checked,
      });
    } else if (typeBoolean === "readable") {
      setTransactionInfo({
        ...transactionInfo,
        isReadable: checked,
      });
    }
  };
  const handleDefAccount = (event) => {
    if(event.target.value ===   'No account'){
      setTransactionInfo({
        ...transactionInfo,
        account: null,
      });
    } else {
      setTransactionInfo({
        ...transactionInfo,
        account: event.target.value,
      });
    }
  };
  const handleDefCategory = (event) => {
    if(event.target.value ===   'No category'){
      setTransactionInfo({
        ...transactionInfo,
        category: null,
      });
    } else {
      setTransactionInfo({
        ...transactionInfo,
        category: event.target.value,
      });

    }
  };
  const handleDefSubCategory = (event) => {
    if(event.target.value ===   'No subcategory'){
      setTransactionInfo({
        ...transactionInfo,
        subCategory: null,
      });
    } else {
      const filterSub = subCategories.filter(sub => sub._id === event.target.value );
      const defFather = filterSub[0].fatherCategory._id
      setTransactionInfo({
        ...transactionInfo,
        subCategory: event.target.value,
        category: defFather
      });
    }
  };
  return !transactionInfo ? (
    <div>No transaccion passed</div>
  ) : (
    <div
      className={`fixed top-[-0%] right-[-0%] w-[100%] h-[100%] z-[1000] bg-white/10 backdrop-blur-sm ${
        active ? "hidden" : "flex"
      } items-center justify-center`}
    >
      <div className="content bg-purple-600 border-2 border-purple-600 flex flex-col w-[350px] h-[650px] relative rounded-2xl items-center justify-center pt-[40px] overflow-hidden">
        <div className={`${isLoading ? "absolute" : "hidden"} top-0 left-0 bg-white/70 babackdrop-blur-sm flex justify-center items-center w-full h-full z-[1001] `}>
          <Spin  size="large"/>
        </div>
        <h1 className="text-center py-[20px] text-2xl text-white">
          Edit Transaction 🪄
        </h1>
        <form
          onSubmit={handleSubmit}
          className={`form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 rounded-t-[60px] pt-[30px] pb-20`}
        >
          <p className="label-tfp ">Name</p>
          <input
            type="text"
            name="name"
            value={transactionInfo.name}
            onChange={handleChange}
            placeholder="Transaction Name"
          />
          <p className="label-tfp ">Amount</p>
          <input
            type="number"
            name="amount"
            value={transactionInfo.amount}
            onChange={handleChange}
            placeholder="Amount"
          />
          <div className="switchers-cont flex gap-3">
            <label>
              <ConfigProvider
                theme={{
                  token: {
                    // Seed Token
                    colorPrimary: "#9700FF",
                    borderRadius: 2,

                    // Alias Token
                    colorBgContainer: "#9700FF",
                  },
                }}
              >
                <Space direction="" size={12}>
                  <div className="switch-int-cont">
                    <p className="label-tfp ">Is Income:</p>
                    <Switch
                      onChange={(value) => onChangeSwitch(value, "income")}
                      value={transactionInfo?.isIncome}
                    />
                  </div>
                  <div className="switch-int-cont">
                    <p className="label-tfp ">Is Bill:</p>
                    <Switch
                      onChange={(value) => onChangeSwitch(value, "bill")}
                      value={transactionInfo?.isBill}
                    />
                  </div>
                  <div className="switch-int-cont">
                    <p className="label-tfp ">Is Readable:</p>
                    <Switch
                      onChange={(value) => onChangeSwitch(value, "readable")}
                      value={transactionInfo?.isReadable}
                    />
                  </div>
                </Space>
              </ConfigProvider>
            </label>
          </div>
          <p className="label-tfp ">Date</p>
          <div className="date-container w-full h-[100px] ">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["MobileDateTimePicker"]}>
                <DemoItem label="">
                  <MobileDateTimePicker
                    className="text-center flex items-center justify-between border-2"
                    slotProps={{ textField: { size: "small" } }}
                    onChange={(newValue) =>
                      hanleDatePickerChange(newValue.format())
                    }
                    value={dayjs(transactionInfo?.date)}
                    sx={{
                      "& .MuiInputBase-root": {
                        width: "100%",
                        height: "100%",
                        padding: "0px",
                        border: "none",
                      },
                      "& .MuiInputBase-input": {
                        width: "100%",
                        height: "100%",
                        border: "1px solid rgb(176, 23, 176)",
                      },
                    }}
                  />
                </DemoItem>
              </DemoContainer>
            </LocalizationProvider>
          </div>
          <p className="label-tfp ">Category</p>
          {
            transactionInfo.subCategory ? 
            (
              <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]text-center cursor-not-allowed">
              <select
                className=" bg-transparent appearance-none w-full pr-4 cursor-not-allowed"
                name="DateSelector"
                value={transactionInfo?.category || null}
                // onChange={handleDefCategory}
                disabled
              >
                <option value={null}>No category</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option value={cat._id} key={`option-cat-${cat._id}`}>
                      {cat.name}{" "}
                    </option>
                  ))
                ) : (
                  <div>No categories loaded...</div>
                )}
              </select>
            </div>
              ) : 
            (<div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]text-center">
            <select
              className=" bg-transparent appearance-none w-full pr-4"
              name="DateSelector"
              value={transactionInfo?.category || null}
              onChange={handleDefCategory}
            >
              <option value={null}>No category</option>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option value={cat._id} key={`option-cat-${cat._id}`}>
                    {cat.name}{" "}
                  </option>
                ))
              ) : (
                <div>No categories loaded...</div>
              )}
            </select>
          </div>)
          }
          
          <p className="label-tfp ">Sub Category</p>
          <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]text-center">
            <select
              className=" bg-transparent appearance-none w-full pr-4"
              name="DateSelector"
              value={transactionInfo?.subCategory || null}
              onChange={handleDefSubCategory}
            >
              <option value={null}>No subcategory</option>
              {subCategories.length > 0 ? (
                subCategories.map((sub) => (
                  <option value={sub._id} key={`option-subCat-${sub._id}`}>
                    {sub.name}{" "}
                  </option>
                ))
              ) : (
                <div>No sub categories loaded...</div>
              )}
            </select>
          </div>
          <p className="label-tfp ">Tags</p>
          <input
            type="text"
            name="tags"
            value={transactionInfo.tags || null}
            onChange={handleChange}
            placeholder="Tags (separated by comma)"
          />
          <p className="label-tfp ">Account</p>
          <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]text-center">
            <select
              className=" bg-transparent appearance-none w-full pr-4"
              name="DateSelector"
              value={transactionInfo?.account || null}
              onChange={handleDefAccount}
            >
              <option value={null}>No account</option>
              {accounts.length > 0 ? (
                accounts.map((acc) => (
                  <option value={acc._id} key={`option-acc-${acc._id}`}>
                    {acc.name}{" "}
                  </option>
                ))
              ) : (
                <div>No accounts loaded...</div>
              )}
            </select>
          </div>
          <button
            className="w-full p-2 bg-purple-600 text-white text-center rounded-full mt-3 hover:bg-purple-500"
            type="submit"
          >
            {isLoading ? (<Spin />) : "Submit"}
          </button>
        </form>
        <button onClick={handleClose}>
          <div className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short">
            <CategoIcon type={"MdClose"} siz={20} />
          </div>
        </button>
      </div>
    </div>
  );
}

export default EditTransModal;

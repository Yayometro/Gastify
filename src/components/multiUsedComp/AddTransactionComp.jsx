"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { createTheme, ThemeProvider } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { Switch } from "antd";
import { Button, ConfigProvider, Space, Spin } from "antd";
import fetcher from "@/helpers/fetcher";
import { useDispatch, useSelector } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import "@/components/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import { addNewTransacction } from "@/lib/features/transacctionsSlice";

function AddTransactionComp({
  atcUser,
  atcCategories,
  atcSubCategories,
  atcAccounts,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const toFetch = fetcher();
  let [transactionInfo, setTransactionInfo] = useState({
    name: "",
    amount: "",
    isIncome: false,
    isBill: false,
    isReadable: true,
    isForSaving: false,
    date: new Date(),
    account: "",
    category: "",
    subCategory: "",
    tags: "",
    user: "",
    wallet: "",
  });
  let [isShort, setIsShort] = useState(true);

  const user = atcUser;
  const categories = atcCategories;
  const subCategories = atcSubCategories;
  const accounts = atcAccounts;
  // console.log(subCategories)

  //REDUX
  const dispatch = useDispatch();

  //EFFECTS
  useEffect(() => {
    if (atcUser) {
      setTransactionInfo({
        ...transactionInfo,
        user: atcUser._id,
        wallet: atcUser.wallet,
      });
    }
  }, [atcUser]);
  //Handlers:
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransactionInfo({ ...transactionInfo, [name]: value });
  };

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
    if (event.target.value === "No account") {
      // console.log(event.target.value)
      setTransactionInfo({
        ...transactionInfo,
        account: null,
      });
    } else {
      // console.log(event.target.value)
      setTransactionInfo({
        ...transactionInfo,
        account: event.target.value,
      });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log(transactionInfo);
    const trimmedName = transactionInfo.name.trim();
    const tagsArray = transactionInfo.tags.split(",");
    // console.log(tagsArray)
    const tagsArrCleaned = tagsArray.map((tag) => tag.trim());
    // console.log(tagsArrCleaned)
    const newTrans = {
      ...transactionInfo,
      name: trimmedName,
      tags: tagsArrCleaned,
    };
    // console.log(newTrans)
    try {
      const response = await toFetch.post(
        `general-data/transactions/new-transaction`,
        newTrans
      );
      // console.log(response);
      if (response.data) {
        // console.log(response.data)
        runNotify("ok", response.message);
        const addlyData = [response.data]
        //UPDATE FRON END
        dispatch(addNewTransacction(response.data))
        // trans = response.data;
        // console.log(trans);
        setIsLoading(false);
        clearForm();
      }
    } catch (e) {
      runNotify("error", String(e));
      clearForm();
      throw new Error(e);
    }
  };
  //DATE
  function hanleDatePickerChange(newDate) {
    setTransactionInfo({ ...transactionInfo, date: new Date(newDate) });
  }
  // Clear FORM
  const clearForm = () => {
    setTransactionInfo({
      name: "",
      amount: "",
      isIncome: false,
      isBill: false,
      isReadable: true,
      isForSaving: false,
      date: new Date(),
      account: "",
      category: "",
      subCategory: "",
      tags: "",
      user: atcUser._id,
      wallet: atcUser.wallet,
    });
  };
  //
  const handleDefSubCategory = (event) => {
    if (event.target.value === "No subcategory") {
      // console.log(event.target.value)
      setTransactionInfo({
        ...transactionInfo,
        subCategory: null,
      });
    } else {
      // console.log(event.target.value);
      const filterSub = subCategories.filter(
        (sub) => sub._id === event.target.value
      );
      const defFather = filterSub[0].fatherCategory._id;
      // console.log(defFather)
      setTransactionInfo({
        ...transactionInfo,
        subCategory: event.target.value,
        category: defFather,
      });
    }
  };
  const handleDefCategory = (event) => {
    if (event.target.value === "No category") {
      // console.log(event.target.value)
      setTransactionInfo({
        ...transactionInfo,
        category: null,
      });
    } else {
      // console.log(event.target.value)
      setTransactionInfo({
        ...transactionInfo,
        category: event.target.value,
      });
    }
  };

  return (
    <div className="w-full h-full relative">
      <div
        className={`loader-add-trans absolute w-full h-full bg-white/90  items-center justify-center z-[100] rounded-t-2xl ${
          isLoading ? "flex" : "hidden"
        }`}
      >
        <Spin size="large" />
      </div>
      <div className="shortToggle w-full">
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
            <p className=" text-sm text-purple-500">Short transacction:</p>
            <Switch
              onChange={(value) => setIsShort(!isShort)}
              value={isShort}
            />
          </Space>
        </ConfigProvider>
      </div>
      {isShort ? (
        <div className="w-full h-full flex justify-center items-center">
          <form
            onSubmit={handleSubmit}
            className={`form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 rounded-[60px] pt-[30px] pb-10 min-[600px]:w-[500px] min-[820px]:w-[770px] min-[1200px]:w-[800px]`}
          >
            <h1 className=" text-xl min-[450px]:text-2xl font-light text-center w-full">
              Add Short Transaction
            </h1>
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
            <button
              className="w-full p-2 bg-purple-600 text-white text-center rounded-full mt-3 hover:bg-purple-500"
              type="submit"
            >
              {isLoading ? <Spin /> : "Submit"}
            </button>
            <div
              className="clearForm underline text-red-400 cursor-pointer"
              onClick={clearForm}
            >
              Clear Form
            </div>
          </form>
        </div>
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <form
            onSubmit={handleSubmit}
            className={`form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 rounded-[60px] pt-[30px] pb-20 min-[600px]:w-[500px] min-[820px]:w-[770px] min-[1200px]:w-[800px]`}
          >
            <h1 className=" text-xl min-[450px]:text-2xl font-light text-center w-full">
              Add New Transaction
            </h1>
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
            {transactionInfo.subCategory ? (
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
            ) : (
              <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]text-center">
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
              </div>
            )}

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
              {isLoading ? <Spin /> : "Submit"}
            </button>
            <div
              className="clearForm underline text-red-400 cursor-pointer"
              onClick={clearForm}
            >
              Clear Form
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AddTransactionComp;

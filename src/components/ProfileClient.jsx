"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmptyModule from "./multiUsedComp/EmptyModule";
import UniversalCategoIcon from "./multiUsedComp/UniversalCategoIcon";
import "@/components/animations.css";
import { Switch, Spin, ConfigProvider, Space, Input } from "antd";
import runNotify from "@/helpers/gastifyNotifier";
import fetcher from "@/helpers/fetcher";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { fetchUser, updateUser } from "@/lib/features/userSlice";

function ProfileClient({ pcSession }) {
  const [onEdition, setOnEdition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onEditPasswordState, setOnEditPasswordState] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    mail: "",
    password: "",
    passwordConfirm: null,
    image: "",
    phone: "",
  });
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  let userData = ccUser.data;
  // console.log(ccUser);
  // console.log(userData);
  //FETCHER
  const toFetch = fetcher();
  //USE EFFECTS
  useEffect(() => {
    // User
    if (ccUser.status == "idle") {
      // console.log("first");
      dispatch(fetchUser(pcSession));
    }
  }, []);
  useEffect(() => {
    if (ccUser.status == "loading") {
      console.log("first");
      setIsLoading(true);
    }
    if (ccUser.status == "succeeded") {
      // console.log("first");
      setIsLoading(false);
    }
    if (userData) {
      setUserInfo({
        ...userInfo,
        fullName: userData.fullName || null,
        mail: userData.mail || null,
        password: null,
        passwordConfirm: null,
        image: userData.image || null,
        phone: userData.phone || null,
      });
    }
  }, [userData]);

  const onEditPassword = (val) => {
    console.log(val);
    setOnEditPasswordState(val);
  };
  const handleChange = (e, tp) => {
    if (tp === "phone") {
      setUserInfo({ ...userInfo, phone: e });
    } else {
      const { name, value } = e.target;
      // console.log(name, value);
      setUserInfo({ ...userInfo, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      // console.log(userInfo);
      //   verify double password
      if (onEditPasswordState) {
        const regexCapital = /[A-Z]/;
        const regexSpecial = /[!@#$%^&*(),.?":_{}|<>]/;
        if (userInfo.password !== userInfo.passwordConfirm) {
          runNotify(
            "error",
            `Password don't match, review both inputs and try again ❌`
          );
          setUserInfo({ ...userInfo, password: null, passwordConfirm: null });
          setIsLoading(false);
        }
        if (
          userInfo.password.length < 8 &&
          userInfo.passwordConfirm.length < 8
        ) {
          runNotify(
            "error",
            `Password should have at least 8 characters of length ❌`
          );
          setUserInfo({ ...userInfo, password: null, passwordConfirm: null });
          setIsLoading(false);
        }
        if (
          !regexCapital.test(userInfo.password) &&
          !regexCapital.test(userInfo.passwordConfirm)
        ) {
          runNotify(
            "error",
            `Password should have at least one capital letter "A,B,C... etc" ❌`
          );
          setUserInfo({ ...userInfo, password: null, passwordConfirm: null });
          setIsLoading(false);
        }
        if (
          !regexSpecial.test(userInfo.password) &&
          !regexSpecial.test(userInfo.passwordConfirm)
        ) {
          runNotify(
            "error",
            `Password should have at at least one special character "!@#$%^&*(),.?":_{}|<>" ❌`
          );
          setUserInfo({ ...userInfo, password: null, passwordConfirm: null });
          setIsLoading(false);
        }
      }
      // console.log(userInfo);
      const res = await toFetch.post("general-data/user/update-user", userInfo);
      if (res.ok) {
        // console.log(res);
        runNotify("ok", `${res.message}`);
        //UPDATE REDUX FRONT END
        dispatch(updateUser(res.data))
        // userData = res.data;
        setIsLoading(false);
      }
    } catch (e) {
      // console.log(e);
      runNotify("error", String(e));
      setIsLoading(false);
    }
  };
  return (
    <div className="profile-component-container w-full h-full sm:pr-2">
      {!userData ? (
        <div className="flex justify-center items-center bg-slate-100 rounded-2xl h-screen">
          <EmptyModule
            emMessage={`Ups! No user data please refresh de page or try again later... 🤕`}
          />
        </div>
      ) : (
        <div className="w-full h-full relative">
          <div
            className="edit-profile-btn absolute top-[10px] right-[10px] text-white cursor-pointer pulse-animation"
            onClick={() => setOnEdition(!onEdition)}
          >
            {!onEdition ? (
              <UniversalCategoIcon type={"md/MdOutlineEdit"} siz={30} />
            ) : (
              <div className="onedit-btn border-2 rounded-full px-2 py-1 flex justify-center items-center gap-2">
                <p className="">Off</p>
                <UniversalCategoIcon type={"md/MdEditNote"} siz={30} />
              </div>
            )}
          </div>
          <div className="profile-img py-2">
            <Image
              className="rounded-full border-[1px]  m-auto w-[110px]  sm:w-[140px] shadow-md"
              src={
                userData.image
                  ? userData.image
                  : "/img/profile/user-non-profile.jpg"
              }
              alt={`${userData?.fullName} profile account`}
              width={150}
              height={150}
              objectPosition="center"
            />
          </div>
          {!onEdition ? (
            <div className="content-profile-cont w-full h-screen bg-slate-100 text-center flex flex-col justify-center items-center rounded-t-[100px] rounded-b-2xl shadow-sm">
              {userData.fullName == "" ? (
                <Spin size="large" />
              ) : (
                <h1 className="text-3xl pt-9 pb-1">
                  {`${userData.fullName} Profile` || "Profile"}
                </h1>
              )}
              <div className="w-full h-full displayed-profile flex flex-col items-start gap-6 pt-4 px-4 pb-12 sm:items-center sm:px-[150px] md:px-[200px] lg:px-[300px] xl:px-[400px]">
                <div className=" w-full cpc-name flex flex-col justify-center items-start">
                  <p className="text-[11px]">Full name:</p>
                  <div className="w-full border-2 border-purple-400 rounded-xl truncate px-2">
                    <p className="text-lg font-light">
                      {userData.fullName || "No name. Asign One..."}
                    </p>
                  </div>
                </div>
                <div className=" w-full cpc-name flex flex-col justify-center items-start">
                  <p className="text-[11px]">Mail:</p>
                  <div className="w-full border-2 border-purple-400 rounded-xl truncate px-2">
                    <p className="text-lg font-light">{userData.mail}</p>
                  </div>
                </div>
                <div className=" w-full cpc-name flex flex-col justify-center items-start">
                  <p className="text-[11px]">Password:</p>
                  <div className="w-full border-2 border-purple-400 rounded-xl truncate px-2">
                    <p className="text-lg font-light truncate pt-0.5">
                      ***********
                      {/* {userData.password ? userData.password 
                        .split("")
                        .map((c) => "*")
                        .join("")
                        : ''
                      } */}
                    </p>
                  </div>
                </div>
                <div className=" w-full cpc-name flex flex-col justify-center items-start">
                  <p className="text-[11px]">Image:</p>
                  <div className="w-full border-2 border-purple-400 rounded-xl truncate px-2">
                    <p className="text-lg font-light truncate pt-0.5">
                      {userData.image}
                    </p>
                  </div>
                </div>
                <div className=" w-full cpc-name flex flex-col justify-center items-start">
                  <p className="text-[11px]">Phone:</p>
                  <div className="w-full border-2 border-purple-400 rounded-xl truncate px-2">
                    <p className="text-lg font-light truncate pt-0.5">
                      {userData.phone || "No phone register"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="remove-account-prof w-full mb-[100px]">
                <div className="remove-acc w-full text-sm font-light text-red-700 underline cursor-pointer text-center">
                  Remove account
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-100 shadow-sm rounded-t-[100px] relative">
              <div
                className={`${
                  isLoading ? "absolute" : "hidden"
                } top-0 left-0 bg-white/70 babackdrop-blur-sm flex justify-center items-center w-full h-full z-[1001] rounded-t-[100px]`}
              >
                <Spin size="large" />
              </div>
              <form
                className="content-profile-form-cont w-full h-screen bg-slate-100 text-center flex flex-col justify-center items-center rounded-t-[100px] rounded-b-2xl shadow-sm sm:items-center sm:px-[150px] md:px-[200px] lg:px-[300px] xl:px-[400px]"
                onSubmit={handleSubmit}
              >
                <h1 className="text-3xl pt-9 pb-1">
                  {`${userData.fullName} Profile` || "Profile"}
                </h1>
                <div className="w-full h-full displayed-profile flex flex-col items-start gap-6 pt-4 px-4 ">
                  <div className=" w-full cpc-name flex flex-col justify-center items-start">
                    <p className="text-[11px]">Full name:</p>
                    <input
                      className="w-full border-2 border-purple-400 rounded-xl truncate px-2 text-lg font-light"
                      type="text"
                      name="fullName"
                      value={userInfo.fullName || null}
                      onChange={handleChange}
                    />
                  </div>
                  <div className=" w-full cpc-name flex flex-col justify-center items-start">
                    <p className="text-[11px]">Mail:</p>
                    <input
                      className="w-full border-2 border-purple-400 rounded-xl truncate px-2 text-lg font-light"
                      type="text"
                      name="mail"
                      value={userInfo.mail || null}
                      onChange={handleChange}
                    />
                  </div>
                  <div className=" w-full cpc-name flex gap-2 justify-start items-center">
                    <p className="text-[11px]">Change password?:</p>
                    <ConfigProvider
                      theme={{
                        token: {
                          // Seed Token
                          colorPrimary: "#9700FF",
                          borderRadius: 2,
                          colorBorder: "#9700FF",
                          // Alias Token
                          colorBgContainer: "#9700FF",
                        },
                      }}
                    >
                      <Space direction="" size={12}>
                        <div className="switch-profile-password rounded-full">
                          <Switch
                            onChange={(value) => onEditPassword(value)}
                            value={onEditPasswordState}
                            className="border-[2px] border-purple-300"
                          />
                        </div>
                      </Space>
                    </ConfigProvider>
                  </div>
                  {!onEditPasswordState ? (
                    <div
                      className={` w-full cpc-name flex flex-col justify-center items-start cursor-not-allowed`}
                    >
                      <p className="text-[11px]">Password:</p>
                      <input
                        className="w-full border-2 border-purple-400 rounded-xl truncate px-2 text-lg font-light"
                        type="text"
                        name="password"
                        placeholder="****************"
                        disabled
                      />
                    </div>
                  ) : (
                    <div className="edit-pass-sub-cont flex flex-col gap-3">
                      <div
                        className={` w-full cpc-name flex flex-col justify-center items-start cursor-not-allowed`}
                      >
                        <p className="text-[11px] text-start">Password:</p>
                        <Space direction="vertical">
                          <Input.Password
                            placeholder="input password"
                            className="profile-input-password"
                            name="password"
                            value={userInfo.password || ""}
                            onChange={(v) => handleChange(v, "password")}
                          />
                          <p className="text-[11px] text-start">
                            Confirm password:
                          </p>
                          <Input.Password
                            placeholder="input password"
                            className="profile-input-password"
                            name="passwordConfirm"
                            value={userInfo.passwordConfirm || ""}
                            onChange={(v) => handleChange(v, "passwordConfirm")}
                          />
                        </Space>
                      </div>
                    </div>
                  )}
                  <div className=" w-full cpc-name flex flex-col justify-center items-start">
                    <p className="text-[11px]">Image:</p>
                    <input
                      className="w-full border-2 border-purple-400 rounded-xl truncate px-2 text-lg font-light"
                      type="text"
                      name="image"
                      value={userInfo.image || null}
                      onChange={handleChange}
                    />
                  </div>
                  <div className=" w-full cpc-name flex flex-col justify-center items-start">
                    <p className="text-[11px]">Phone:</p>
                    <PhoneInput
                      defaultCountry="ua"
                      value={String(userInfo.phone) || ""}
                      // name="phone"
                      onChange={(phone) => handleChange(phone, "phone")}
                    />
                  </div>
                  <button
                    className={`w-full p-2 ${
                      !isLoading ? "bg-purple-600" : "bg-purple-200"
                    } text-white text-center rounded-full mt-3 hover:bg-purple-500`}
                    type="submit"
                  >
                    {isLoading ? <Spin /> : "Submit"}
                  </button>
                </div>
              </form>
              <div className="remove-account-prof w-full py-[100px]">
                <div className="remove-acc w-full text-sm font-light text-red-700 underline cursor-pointer text-center">
                  Remove account
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileClient;

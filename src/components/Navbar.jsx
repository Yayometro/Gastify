"use client";

import React, { useEffect, useState } from "react";
import { signOut } from "next-auth/react"; //only ones need it
import { useSession } from "next-auth/react"; //too
import Link from "next/link";
import Image from "next/image";
import "animate.css";
import "@/components/animations.css";

import { IoIosArrowUp } from "react-icons/io";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { FaWallet } from "react-icons/fa6";
import { MdAutoGraph } from "react-icons/md";
import { IoAddCircle } from "react-icons/io5";
import { MdAccountBalance } from "react-icons/md";
import { IoPricetags } from "react-icons/io5";
import { IoMdExit } from "react-icons/io";
import { BiSolidCategory } from "react-icons/bi";

import "@/components/NavbarStyle.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "@/lib/features/userSlice";

function Navbar({ sesion }) {
  const [toggleNav, setToggleNav] = useState(false);
  console.log(sesion);
  const handleToggleNav = () => {
    setToggleNav(!toggleNav);
  };
  // REDUX
  const reduxDispatch = useDispatch()
  const ccUser = useSelector((state) => state.userReducer.data);
  console.log(ccUser)
  // 
  useEffect(() => {
    // User
    if (ccUser.status == "idle") {
      reduxDispatch(fetchUser(sesion.user.email));
    }
  }, []);

  return (
    <nav className="navbar w-full fixed flex flex-col items-center justify-center bottom-0 md:w-fit md:fixed md:top-0 z-[1000] ">
      <ul
        className={`nav-full pt-8 pb-12 -mb-6 w-[93%] flex flex-col items-center justify-center gap-4 bg-white z-[1001] rounded-t-[50px] text-center text-purple-900 md:w-fit md:flex md:h-[95vh] md:inset-0  md:mb-0 md:rounded-3xl md:ml-2 md:justify-between shadow-xl ${
          toggleNav ? "" : "hidden"
        }`}
      >
        <li className="flex flex-row items-center justify-center micro-pulse sm:px-2">
          <Link href="/dashboard/profile">
            <Image
              className="rounded-full border-[1px] border-purple-800 m-auto w-[60px]  sm:w-[40px]"
              src={ccUser?.image || '/img/profile/user-non-profile.jpg'}
              alt={`${ccUser?.fullName} profile account`}
              width={50}
              height={50}
              objectPosition="center"
            />
            <p className="text-[10px] sm:text-[8px] w-[45px] break-word text-ellipsis overflow-hidden group truncate">{ccUser?.fullName}</p>
            <p className="hidden hoverTooltip">Profile</p>
          </Link>
        </li>
        <li className="micro-pulse">
          <Link href="/dashboard/movements">
            <FaMoneyBillTransfer size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Movements</p>
          </Link>
        </li>
        <li className="micro-pulse">
          <Link href="/dashboard">
            <FaWallet size={27} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Wallet</p>
          </Link>
        </li>
        <li className="micro-pulse">
          <Link href="/dashboard/accounts">
            <MdAccountBalance size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Accounts</p>
          </Link>
        </li>
        {/* <li className="text-purple-600 add-more hidden sm:flex micro-pulse">
          <Link href={`/dashboard/add-transaction`}>
            <IoAddCircle size={50} />
            <p className="hidden hoverTooltip">Add a transaction</p>
          </Link>
        </li> */}
        {/* <li className="micro-pulse">
          <Link href="/dashboard/cashflow">
            <MdAutoGraph size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Cash Flow</p>
          </Link>
        </li> */}
        <li className="micro-pulse">
          <Link href="/dashboard/categories">
            <BiSolidCategory size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Categories</p>
          </Link>
        </li>
        <li className=" flash">
          <button onClick={() => signOut()}>
            <IoMdExit size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Sign Out</p>
          </button>
        </li>
      </ul>
      <ul className="bg-white mb-3 n-mobile w-[93%] flex flex-row justify-between py-2 px-3 items-center rounded-full shadow-xl z-[1002] fadeInUp md:hidden">
        <li className="nb-li-btn">
          <button onClick={handleToggleNav}>
            <IoIosArrowUp size={20} />
          </button>
        </li>
        <li className="">
          <Link href={`/dashboard/movements`}>
            <FaMoneyBillTransfer size={30} />
          </Link>
        </li>
        <li className="">
          <Link href={`/dashboard/categories`}>
            <BiSolidCategory size={30} />
          </Link>
        </li>
        <li className="">
          <Link href={`/dashboard`}>
            <FaWallet size={25} />
          </Link>
        </li>
        <li className="">
          <Link href="/dashboard/profile">
            <Image
              className="rounded-full border-[1px] border-purple-800 m-auto w-[30px]  sm:w-[40px]"
              src={sesion?.user?.image}
              alt={`${sesion.user.name} profile account`}
              width={50}
              height={50}
              objectPosition="center"
            />
          </Link>
        </li>
      </ul>
      {/* <ul className="nav-desktop hidden sm:flex">
        li
      </ul> */}
    </nav>
  );
}

export default Navbar;

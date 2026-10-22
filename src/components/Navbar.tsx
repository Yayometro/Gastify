"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import type { auth } from "@/lib/auth/betterAuth";
import Link from "next/link";
import Image from "next/image";
import "animate.css";
import "@/components/styles/animations.css";

import { IoIosArrowUp } from "react-icons/io";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { FaMagnifyingGlassChart, FaWallet } from "react-icons/fa6";
import { MdAutoGraph } from "react-icons/md";
import { MdSavings } from "react-icons/md";
import { IoAdd } from "react-icons/io5";
import { MdAccountBalance } from "react-icons/md";
import { BiSolidCategory } from "react-icons/bi";
import { MdLightMode, MdDarkMode } from "react-icons/md";

import "@/components/styles/NavbarStyle.css";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import type { UserData } from "@/lib/features/userSlice";
import AddTransactionModal from "./multiUsedComp/AddTransactionModal";
import NotificationsBell from "./multiUsedComp/NotificationsBell";
import { FaHistory } from "react-icons/fa";
import { useThemeMode } from "@/app/ThemeProvider";

export type NavbarSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export interface NavbarProps {
  sesion: NavbarSession;
}

// (`sesion` stays in NavbarProps - the layout still passes it - but nothing here reads it any more.)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Navbar(_props: NavbarProps): React.JSX.Element {
  const [toggleNav, setToggleNav] = useState<boolean>(false);
  const [isAddTrans, setIsAddTrans] = useState<boolean>(false);
  const { mode, toggleMode } = useThemeMode();
  const pathname = usePathname();
  // The page the person is on: its icon gets the capsule (the same one the iPad's side bar uses).
  const isActive = (href: string): boolean => (href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`));
  const navItemClass = (href: string): string => `gf-nav-item ${isActive(href) ? "gf-nav-active" : ""}`;
  const handleToggleNav = (): void => {
    setToggleNav(!toggleNav);
  };
  // REDUX
  // `.data` is the plain user: it has no `status`, so the old
  // `if (ccUser.status == "idle") fetchUser(...)` here never ran (bug 41). The user is
  // loaded by AllDataProvider for every dashboard page, so that dead check was removed.
  const ccUser = useSelector((state: RootState) => state.userReducer.data as UserData);

  const toogleAddTrans = React.useCallback((): void => {
    setIsAddTrans(prev => !prev);
  }, []);

  return (
    <nav className="navbar w-full fixed flex flex-col items-center justify-center bottom-0 md:w-fit md:fixed md:top-0 z-[1000] ">
      <ul
        className={`nav-full pt-8 pb-12 -mb-6 w-[93%] flex flex-col items-center justify-center gap-4 gf-nav-surface z-[1001] rounded-t-[50px] text-center text-gf-text md:w-fit md:flex md:h-[95vh] md:inset-0  md:mb-0 md:rounded-3xl md:ml-2 md:justify-between shadow-xl ${
          toggleNav ? "" : "hidden"
        }`}
      >
        <li className="flex flex-row items-center justify-center micro-pulse sm:px-2">
          <Link href="/dashboard/profile">
            <Image
              className="rounded-full border-[1px] border-purple-500 m-auto w-[60px]  sm:w-[40px]"
              src={ccUser?.image || '/img/profile/user-non-profile.jpg'}
              alt={`${ccUser?.fullName} profile account`}
              width={50}
              height={50}
            />
            <p className="text-[10px] sm:text-[8px] w-[45px] break-word text-ellipsis overflow-hidden group truncate">{ccUser?.fullName}</p>
            <p className="hidden hoverTooltip">Profile</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/movements")}>
          <Link href="/dashboard/movements" aria-current={isActive("/dashboard/movements") ? "page" : undefined}>
            <FaMoneyBillTransfer size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Movements</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard")}>
          <Link href="/dashboard" aria-current={isActive("/dashboard") ? "page" : undefined}>
            <FaWallet size={27} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Wallet</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/budgets")}>
          <Link href="/dashboard/budgets" aria-current={isActive("/dashboard/budgets") ? "page" : undefined}>
            <MdSavings size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Budgets</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/projections")}>
          <Link href="/dashboard/projections" aria-current={isActive("/dashboard/projections") ? "page" : undefined}>
            <MdAutoGraph size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Projections</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/analyzer")}>
          <Link href="/dashboard/analyzer" aria-current={isActive("/dashboard/analyzer") ? "page" : undefined}>
            <FaMagnifyingGlassChart size={27} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Wallet Analyzer</p>
          </Link>
        </li>
        <li >
          <div className="add-more sm:flex micro-pulse">
              <button type="button" onClick={toogleAddTrans} aria-label="Add a transaction" className="gf-glass-fab w-[50px] h-[50px]">
                <IoAdd size={30} />
              </button>
              <p className="hidden hoverTooltip">Add a transaction</p>
            </div>
            {
              (isAddTrans && <AddTransactionModal  close={toogleAddTrans}/>)
            }
        </li>
        <li className={navItemClass("/dashboard/accounts")}>
          <Link href="/dashboard/accounts" aria-current={isActive("/dashboard/accounts") ? "page" : undefined}>
            <MdAccountBalance size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Accounts</p>
          </Link>
        </li>
        
        <li className={navItemClass("/dashboard/history")}>
          <Link href="/dashboard/history" aria-current={isActive("/dashboard/history") ? "page" : undefined}>
            <FaHistory size={30} className="hidden sm:inline"  />
            <p className="sm:hidden hoverTooltip">History</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/categories")}>
          <Link href="/dashboard/categories" aria-current={isActive("/dashboard/categories") ? "page" : undefined}>
            <BiSolidCategory size={30} className="hidden sm:inline" />
            <p className="sm:hidden hoverTooltip">Categories</p>
          </Link>
        </li>
        <li className="gf-nav-item">
          <button onClick={toggleMode} type="button" aria-label="Toggle light/dark mode">
            {mode === "dark" ? (
              <MdLightMode size={26} className="hidden sm:inline" />
            ) : (
              <MdDarkMode size={26} className="hidden sm:inline" />
            )}
            <p className="sm:hidden hoverTooltip">{mode === "dark" ? "Light mode" : "Dark mode"}</p>
          </button>
        </li>
        <li className="gf-nav-item">
          <NotificationsBell />
        </li>
      </ul>
      <ul className="gf-nav-surface text-gf-text mb-3 n-mobile w-[93%] flex flex-row justify-between py-2 px-3 items-center rounded-full shadow-xl z-[1002] fadeInUp md:hidden">
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
              <button type="button" onClick={toogleAddTrans} aria-label="Add a transaction" className="gf-glass-fab w-[50px] h-[50px]">
                <IoAdd size={30} />
              </button>
              <p className="hidden hoverTooltip">Add a transaction</p>
            {
              (isAddTrans && <AddTransactionModal close={toogleAddTrans}/>)
            }
        </li>
        <li className="">
          <Link href={`/dashboard/history`}>
            <FaHistory size={25} />
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
              className="rounded-full border-[1px] border-purple-500 m-auto w-[30px]  sm:w-[40px]"
              src={ccUser?.image || '/img/profile/user-non-profile.jpg'}
              alt={`${ccUser?.fullName} profile account`}
              width={50}
              height={50}
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

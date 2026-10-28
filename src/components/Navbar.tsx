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
import { useT } from "@/i18n/client";
import { IoNotificationsOutline } from "react-icons/io5";

export type NavbarSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export interface NavbarProps {
  sesion?: NavbarSession;
  demoMode?: boolean;
  demoThemeMode?: "dark" | "light";
  onDemoCreate?: () => void;
  onDemoNotifications?: () => void;
  onDemoThemeToggle?: () => void;
  demoNotificationCount?: number;
}

// (`sesion` stays in NavbarProps - the layout still passes it - but nothing here reads it any more.)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Navbar({ demoMode = false, demoThemeMode = "dark", onDemoCreate, onDemoNotifications, onDemoThemeToggle, demoNotificationCount = 0 }: NavbarProps): React.JSX.Element {
  const t = useT();
  const [toggleNav, setToggleNav] = useState<boolean>(false);
  const [isAddTrans, setIsAddTrans] = useState<boolean>(false);
  const { mode, toggleMode } = useThemeMode();
  const pathname = usePathname();
  // The page the person is on: its icon gets the capsule (the same one the iPad's side bar uses).
  const destination = (href: string): string => {
    if (!demoMode) return href;
    return href === "/dashboard" ? "/demo" : `/demo${href.slice("/dashboard".length)}`;
  };
  const isActive = (href: string): boolean => {
    const target = destination(href);
    return target === "/demo" ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);
  };
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
    if (demoMode) {
      onDemoCreate?.();
      return;
    }
    setIsAddTrans(prev => !prev);
  }, [demoMode, onDemoCreate]);

  const themeMode = demoMode ? demoThemeMode : mode;

  return (
    <nav className={`navbar w-full fixed flex flex-col items-center justify-center bottom-0 md:w-fit md:fixed md:top-0 z-[1000] ${demoMode ? "demo-navbar" : ""}`}>
      <ul
        className={`nav-full pt-8 pb-12 -mb-6 w-[93%] flex flex-col items-center justify-center gap-4 gf-nav-surface z-[1001] rounded-t-[50px] text-center text-gf-text md:w-fit md:flex md:h-[95vh] md:inset-0  md:mb-0 md:rounded-3xl md:ml-2 md:justify-between shadow-xl ${
          toggleNav ? "is-open" : "hidden"
        }`}
      >
        <li className={`demo-nav-brand flex flex-row items-center justify-center micro-pulse sm:px-2 ${demoMode ? navItemClass("/dashboard/profile") : ""}`}>
          <Link href={destination("/dashboard/profile")} aria-current={demoMode && isActive("/dashboard/profile") ? "page" : undefined}>
            <Image
              className="rounded-full border-[1px] border-purple-500 m-auto w-[60px]  sm:w-[40px]"
              src={ccUser?.image || '/img/profile/user-non-profile.jpg'}
              alt={t("navbar.profileAlt", { p1: ccUser?.fullName })}
              width={50}
              height={50}
            />
            <p className="demo-nav-label text-[10px] sm:text-[8px] w-[45px] break-word text-ellipsis overflow-hidden group truncate">{ccUser?.fullName}</p>
            <p className="hidden hoverTooltip">{t("navbar.profile")}</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/movements")}>
          <Link href={destination("/dashboard/movements")} aria-current={isActive("/dashboard/movements") ? "page" : undefined}>
            <FaMoneyBillTransfer size={30} className="hidden sm:inline" />
            <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.movements")}</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard")}>
          <Link href={destination("/dashboard")} aria-current={isActive("/dashboard") ? "page" : undefined}>
            <FaWallet size={27} className="hidden sm:inline" />
            <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.wallet")}</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/budgets")}>
          <Link href={destination("/dashboard/budgets")} aria-current={isActive("/dashboard/budgets") ? "page" : undefined}>
            <MdSavings size={30} className="hidden sm:inline" />
            <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.budgets")}</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/projections")}>
          <Link href={destination("/dashboard/projections")} aria-current={isActive("/dashboard/projections") ? "page" : undefined}>
            <MdAutoGraph size={30} className="hidden sm:inline" />
            <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.projections")}</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/analyzer")}>
          <Link href={destination("/dashboard/analyzer")} aria-current={isActive("/dashboard/analyzer") ? "page" : undefined}>
            <FaMagnifyingGlassChart size={27} className="hidden sm:inline" />
            <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.analyzer")}</p>
          </Link>
        </li>
        <li >
          <div className="add-more sm:flex micro-pulse">
              <button type="button" onClick={toogleAddTrans} aria-label={t("navbar.addTransaction")} className="gf-glass-fab w-[50px] h-[50px]">
                <IoAdd size={30} />
              </button>
              <p className="hidden hoverTooltip">{t("navbar.addTransaction")}</p>
            </div>
            {
              (isAddTrans && !demoMode && <AddTransactionModal close={toogleAddTrans}/>)
            }
        </li>
        <li className={navItemClass("/dashboard/accounts")}>
          <Link href={destination("/dashboard/accounts")} aria-current={isActive("/dashboard/accounts") ? "page" : undefined}>
            <MdAccountBalance size={30} className="hidden sm:inline" />
            <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.accounts")}</p>
          </Link>
        </li>
        
        <li className={navItemClass("/dashboard/history")}>
          <Link href={destination("/dashboard/history")} aria-current={isActive("/dashboard/history") ? "page" : undefined}>
            <FaHistory size={30} className="hidden sm:inline"  />
            <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.history")}</p>
          </Link>
        </li>
        <li className={navItemClass("/dashboard/categories")}>
          <Link href={destination("/dashboard/categories")} aria-current={isActive("/dashboard/categories") ? "page" : undefined}>
            <BiSolidCategory size={30} className="hidden sm:inline" />
            <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.categories")}</p>
          </Link>
        </li>
        <li className="gf-nav-item">
          <button onClick={demoMode ? onDemoThemeToggle : toggleMode} type="button" aria-label={t("navbar.toggleTheme")}>
            {themeMode === "dark" ? (
              <MdLightMode size={26} className="hidden sm:inline" />
            ) : (
              <MdDarkMode size={26} className="hidden sm:inline" />
            )}
            <p className="demo-nav-label sm:hidden hoverTooltip">{themeMode === "dark" ? "Light mode" : "Dark mode"}</p>
          </button>
        </li>
        <li className="gf-nav-item">
          {demoMode ? (
            <button type="button" aria-label={demoNotificationCount > 0 ? t("shared.demo.unreadNotifications", { p1: demoNotificationCount }) : t("navbar.notifications")} onClick={onDemoNotifications} className="demo-navbar-notification-button relative inline-flex items-center">
              <IoNotificationsOutline size={28} className="hidden sm:inline" />
              <p className="demo-nav-label sm:hidden hoverTooltip">{t("navbar.notifications")}</p>
              {demoNotificationCount > 0 && <span aria-hidden="true" className="demo-navbar-notification-count absolute -right-2 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full border border-[#2b1a3d] bg-rose-300 px-1 text-[9px] font-bold leading-none text-rose-950">{demoNotificationCount}</span>}
            </button>
          ) : <NotificationsBell />}
        </li>
      </ul>
      <ul className="gf-nav-surface text-gf-text mb-3 n-mobile w-[93%] flex flex-row justify-between py-2 px-3 items-center rounded-full shadow-xl z-[1002] fadeInUp md:hidden">
        <li className="nb-li-btn">
          <button onClick={handleToggleNav} aria-label={toggleNav ? t("shared.demo.closeMenu") : t("shared.demo.openMenu")} aria-expanded={toggleNav}>
            <IoIosArrowUp size={20} />
          </button>
        </li>
        <li className={isActive("/dashboard/movements") ? "gf-nav-active" : ""}>
          <Link href={destination("/dashboard/movements")} className={isActive("/dashboard/movements") ? "gf-nav-active" : ""}>
            <FaMoneyBillTransfer size={30} />
          </Link>
        </li>
        <li className={isActive("/dashboard/categories") ? "gf-nav-active" : ""}>
          <Link href={destination("/dashboard/categories")} className={isActive("/dashboard/categories") ? "gf-nav-active" : ""}>
            <BiSolidCategory size={30} />
          </Link>
        </li>
        <li className="demo-nav-mobile-create">
              <button type="button" onClick={toogleAddTrans} aria-label={t("navbar.addTransaction")} className="gf-glass-fab w-[50px] h-[50px]">
                <IoAdd size={30} />
              </button>
              <p className="hidden hoverTooltip">{t("navbar.addTransaction")}</p>
            {
              (isAddTrans && !demoMode && <AddTransactionModal close={toogleAddTrans}/>)
            }
        </li>
        <li className={isActive("/dashboard/history") ? "gf-nav-active" : ""}>
          <Link href={destination("/dashboard/history")} className={isActive("/dashboard/history") ? "gf-nav-active" : ""}>
            <FaHistory size={25} />
          </Link>
        </li>
        <li className={isActive("/dashboard") ? "gf-nav-active" : ""}>
          <Link href={destination("/dashboard")} className={isActive("/dashboard") ? "gf-nav-active" : ""}>
            <FaWallet size={25} />
          </Link>
        </li>
        <li className={isActive("/dashboard/profile") ? "gf-nav-active" : ""}>
          <Link href={destination("/dashboard/profile")} className={isActive("/dashboard/profile") ? "gf-nav-active" : ""}>
            <Image
              className="rounded-full border-[1px] border-purple-500 m-auto w-[30px]  sm:w-[40px]"
              src={ccUser?.image || '/img/profile/user-non-profile.jpg'}
              alt={t("navbar.profileAlt", { p1: ccUser?.fullName })}
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

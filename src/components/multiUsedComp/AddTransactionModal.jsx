"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AddTransactionComp from "./AddTransactionComp";
import CategoIcon from "./CategoIcon";
import ReadFileComp from "./ReadFileComp";
import SelectCategories from "../categories/SelectCategoryProvider/SelectCategories";
import EditCategoryModal from "./EditCategoryModal";
import TransferExchangeModal from "./TransferExchangeModal";
import { lockBodyScroll, unlockBodyScroll } from "@/helpers/scrollLock";

function AddTransactionModal({ close }) {
  const [active, setActive] = useState("manual");
  // Rendered from inside Navbar's gf-nav-surface, which uses backdrop-filter
  // - that makes it a new containing block for `position: fixed`
  // descendants, so without a portal this modal is "fixed" to the nav
  // panel's box instead of the viewport. See BasicModal.jsx for the same
  // fix and full explanation.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);
  if (!mounted) return null;

  return createPortal(
    <div className=" fixed w-screen h-screen top-0 left-0 flex justify-center items-center z-[5000] overflow-x-hidden ">
      <div
        className={`w-screen h-screen bg-black/50 backdrop-blur-md`}
        onClick={close}
      ></div>
      <div className="content absolute gf-glass-violet flex flex-col w-full h-full max-w-[500px] max-h-[90%] rounded-2xl items-center justify-center pt-[10px] overflow-hidden z-[10002]">
        <h1 className="text-center py-[20px] text-2xl text-white">
          Add Transaction 🪄
        </h1>
        <section className="w-full flex justify-between items-center p-2 gap-2">
          <button
            className={`w-full h-full py-1.5 rounded-full transition-all ${active === "manual" ? "gf-glass-button text-white font-semibold" : "text-purple-200/80 hover:bg-white/10"}`}
            onClick={() => setActive("manual")}
          >
            Manual
          </button>
          <button
            className={`w-full h-full py-1.5 rounded-full transition-all ${active === "excel" ? "gf-glass-button text-white font-semibold" : "text-purple-200/80 hover:bg-white/10"}`}
            onClick={() => setActive("excel")}
          >
            Excel
          </button>
          <button
            className={`w-full h-full py-1.5 rounded-full transition-all ${active === "categories" ? "gf-glass-button text-white font-semibold" : "text-purple-200/80 hover:bg-white/10"}`}
            onClick={() => setActive("categories")}
          >
            Categories
          </button>
          <button
            className={`w-full h-full py-1.5 rounded-full whitespace-nowrap transition-all ${active === "transfer" ? "gf-glass-button text-white font-semibold" : "text-purple-200/80 hover:bg-white/10"}`}
            onClick={() => setActive("transfer")}
          >
            Transfer
          </button>
        </section>
        {active === "manual" && (
          <SelectCategories>
            <AddTransactionComp />
          </SelectCategories>
        )}
        {active === "excel" && (
          <div className="w-full h-full overflow-y-auto">
            <ReadFileComp />
          </div>
        )}
        {active === "categories" && (
          <div className="w-full h-full overflow-y-scroll">
            <SelectCategories>
              <EditCategoryModal
                ecmMode="creation"
                isInline={true}
                ecmClose={() => {}}
                ecmData={{}}
              />
            </SelectCategories>
          </div>
        )}
        {active === "transfer" && <TransferExchangeModal />}
        <button onClick={close}>
          <div className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short">
            <CategoIcon type={"MdClose"} siz={20} />
          </div>
        </button>
      </div>
    </div>,
    document.body
  );
}

export default AddTransactionModal;

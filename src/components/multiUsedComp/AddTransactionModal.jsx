import React, { useState } from "react";
import AddTransactionComp from "./AddTransactionComp";
import CategoIcon from "./CategoIcon";
import VoiceRecognicionComponent from "./VoiceRecognicionComponent";
import ReadFileComp from "./ReadFileComp";
import SelectCategories from "../categories/SelectCategoryProvider/SelectCategories";
import EditCategoryModal from "./EditCategoryModal";

function AddTransactionModal({ close }) {
  const [active, setActive] = useState("manual");
  return (
    <div className=" fixed w-screen h-screen top-0 left-0 flex justify-center items-center z-[1000] overflow-x-hidden ">
      <div
        className={`w-screen h-screen bg-white/10 backdrop-blur-sm`}
        onClick={close}
      ></div>
      <div className="content absolute bg-purple-600 border-2 border-purple-600 flex flex-col w-full h-full max-w-[500px] max-h-[90%] rounded-2xl items-center justify-center pt-[10px] overflow-hidden z-[10002]">
        <h1 className="text-center py-[20px] text-2xl text-white">
          Add Transaction 🪄
        </h1>
        <section className="w-full flex justify-between items-center p-2 gap-2">
          <button
            className={`w-full h-full py-1 rounded-md text-white hover:bg-purple-800 ${active === "manual" ? "bg-purple-800" : ""}`}
            onClick={() => setActive("manual")}
          >
            Manual
          </button>
          <button
            className={`w-full h-full py-1 rounded-md text-white hover:bg-purple-800 ${active === "excel" ? "bg-purple-800" : ""}`}
            onClick={() => setActive("excel")}
          >
            Excel
          </button>
          <button
            className={`w-full h-full py-1 rounded-md text-white hover:bg-purple-800 ${active === "voice" ? "bg-purple-800" : ""}`}
            onClick={() => setActive("voice")}
          >
            Voice
          </button>
          <button
            className={`w-full h-full py-1 rounded-md text-white hover:bg-purple-800 ${active === "categories" ? "bg-purple-800" : ""}`}
            onClick={() => setActive("categories")}
          >
            Categories
          </button>
        </section>
        {active === "manual" && (
          <SelectCategories>
            <AddTransactionComp />
          </SelectCategories>
        )}
        {active === "excel" && (
          <div className="w-full h-full bg-slate-50">
            <ReadFileComp />
          </div>
        )}
        {active === "voice" && (
          <div className="w-full h-full overflow-y-scroll bg-slate-50">
            <VoiceRecognicionComponent />
          </div>
        )}
        {active === "categories" && (
          <div className="w-full h-full overflow-y-scroll bg-slate-50">
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
        <button onClick={close}>
          <div className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short">
            <CategoIcon type={"MdClose"} siz={20} />
          </div>
        </button>
      </div>
    </div>
  );
}

export default AddTransactionModal;

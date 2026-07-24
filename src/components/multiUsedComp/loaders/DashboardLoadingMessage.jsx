import React, { useEffect } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";

function DashboardLoadingMessage({setLoading, message, subMessage}) {
    //Loader
    useEffect(() => {
      import("ldrs").then(({ quantum }) => quantum.register());
    }, []);
  return (
    <div className=" fixed w-full h-full left-0 top-0 flex justify-center items-center z-[1009]">
      <div className="w-[90%] h-[70%] sm:w-[50%] bg-white/90 flex flex-col justify-center items-center text-center p-4 gap-4 rounded-2xl z-[1010] shadow-2xl relative">
        <div
          className="close absolute right-0 top-0 cursor-pointer"
          onClick={setLoading}
        >
          <IoIosCloseCircleOutline size={40} />
        </div>
        <l-quantum size="150" speed="3.1" color="purple"></l-quantum>
        <p className=" text-xl text-purple-800">
          {message}
        </p>
        <p className=" text-xl text-purple-800">{subMessage}</p>
      </div>
    </div>
  );
}

export default DashboardLoadingMessage;

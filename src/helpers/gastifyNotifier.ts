import React from "react";
import { toast, type Id } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export type NotifyType = "ok" | "error" | "info" | "warning" | string;

export default function runNotify(nType?: NotifyType, nMessage?: React.ReactNode): Id | number | string | void {
    if(nType === "ok"){
        return toast.success(`${nMessage}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          });
    } else if (nType === "error"){
      return toast.error(`${nMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        });
      } else if (nType === "info"){
      return toast.info(`${nMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        });

    } else if (nType === "warning"){
      return toast.warn(`${nMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        });
    } else {
      return toast(nMessage);

    }
}
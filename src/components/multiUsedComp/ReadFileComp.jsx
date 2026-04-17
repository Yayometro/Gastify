import React, { useEffect, useState } from "react";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { BsFiletypeXml } from "react-icons/bs";
import { Button, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import fetcher from "@/helpers/fetcher";
import { useSelector, useDispatch } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import { addNewTransacctions } from "@/lib/features/transacctionsSlice";
import { MdFormatAlignLeft } from "react-icons/md";
import { fetchUser } from "@/lib/features/userSlice";
import useGetUserSession from "@/hooks/useGetUserSession";

function ReadFileComp({}) {
  const [isExcel, setIsExcel] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  let { email } = useGetUserSession();
  const toFetch = fetcher();
  const reduxDispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer.data);

  useEffect(() => {
    if (ccUser.status == "idle") {
      reduxDispatch(fetchUser(email));
    }
  }, [ccUser, email]);

  const handleDownloadTemplate = async () => {
    const userEmail = ccUser.mail || email;
    if (!userEmail) return;
    try {
      setIsDownloading(true);
      const response = await fetch(
        toFetch.getFullPath(`general-data/files/template/${userEmail}`)
      );
      if (!response.ok) throw new Error("Template generation failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gastify-template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      runNotify("error", "Could not download template, please try again 🤕");
    } finally {
      setIsDownloading(false);
    }
  };

  const props = {
    name: "file",
    action: `${toFetch.getFullPath(
      `general-data/files/upload/${ccUser.mail}`
    )}`,
    headers: {
      authorization: "authorization-text",
    },
    onChange(info) {
      if (info.file.status === "done") {
        const res = info.file.response;
        if (res.versionMismatch) {
          runNotify(
            "error",
            `Your template is outdated (${res.message}). Please click "Download format" to get the latest template and try again 📥`
          );
          return;
        }
        runNotify(
          "ok",
          `${res.data.length} transactions have been processed and created from the file 😎`
        );
        reduxDispatch(addNewTransacctions(res.data));
      } else if (info.file.status === "error") {
        runNotify(
          "error",
          `The file transactions couldn't be created, please try again later 🤕`
        );
      }
    },
  };

  return (
    <div className="bg-slate-50 py-10 my-2 px-[30px] rounded-[60px] w-full max-w-[900px]">
      <h1 className="text-2xl font-light text-center">Read Bank States</h1>
      <div className="add-file-form flex flex-col gap-1 justify-center items-center">
        <div
          className="mode-cont-add-file flex justify-start items-center gap-2 text-purple-500 hover:text-purple-400 w-fit cursor-pointer pt-2 pb-2"
          onClick={() => setIsExcel(!isExcel)}
        >
          <p>{isExcel ? "Excel file On" : "XML file On"}</p>
          {isExcel ? (
            <PiMicrosoftExcelLogoFill size={20} />
          ) : (
            <BsFiletypeXml size={20} />
          )}
        </div>
        <div className="file-input-cont">
          <Upload {...props}>
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </div>
        <div
          className="example-file flex justify-start items-center w-fit pt-2 pb-2 cursor-pointer text-purple-400 hover:text-purple-300 hover:underline gap-1"
          onClick={handleDownloadTemplate}
        >
          <MdFormatAlignLeft size={20} />
          <span>{isDownloading ? "Generating..." : "Download format"}</span>
        </div>
      </div>
    </div>
  );
}

export default ReadFileComp;

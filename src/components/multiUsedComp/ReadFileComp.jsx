import React, { useState } from "react";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { BsFiletypeXml } from "react-icons/bs";
import { Button, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import fetcher from "@/helpers/fetcher";
import { useSelector, useDispatch } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import { addNewTransacctions } from "@/lib/features/transacctionsSlice";
import { MdFormatAlignLeft } from "react-icons/md";



function ReadFileComp({}) {
  const [isExcel, setIsExcel] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedTransactions, setLoadedTransactions] = useState([])
  //FETCHER
  const toFetch = fetcher()
  //HANDLERS
  const handleSubmit = (i) => {
    e.preventDefault();
  };
  //REDUX
  const reduxDispatch = useDispatch()
  const ccUser = useSelector((state) => state.userReducer.data);
  console.log(ccUser)
  //
  const handleFile = (f) => {
    console.log(f);
  };
//   console.log(toFetch.getFullPath('general-data/files/upload'))
  const props = {
    name: 'file',
    action: `${toFetch.getFullPath(`general-data/files/upload/${ccUser.mail}`)}`,
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
        console.log(info)
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        // message.success(`${info.file.name} file uploaded successfully`);
        // console.log(info.file.response.data)
        runNotify('ok', `${info.file.response.data.length} transactions have been processed and created from the file 😎`)
        reduxDispatch(addNewTransacctions(info.file.response.data))
    } else if (info.file.status === 'error') {
        runNotify('error', `The file transactions couldn't be created, please try again later 🤕`);
        // console.log(info)
    }
    },
  };

  return (
    <div className=" bg-slate-50 py-10 my-2 px-[30px] rounded-[60px] w-full min-[600px]:w-[500px] min-[820px]:w-[770px] min-[1200px]:w-[800px]">
      <h1 className=" text-2xl font-light">Read Bank States</h1>
      <form action="" className="add-file-form flex flex-col gap-1 justify-center items-center" onSubmit={handleSubmit}>
        <div
          className="mode-cont-add-file flex justify-start items-center gap-2 text-purple-500 hover:text-purple-400 w-fit cursor-pointer pt-2 pb-2"
          onClick={() => setIsExcel(!isExcel)}
        >
          <p className="">{isExcel ? "Excel file On" : "XML file On"}</p>
          {isExcel ? (
            <PiMicrosoftExcelLogoFill size={20} />
            ) : (
              <BsFiletypeXml size={20} />
              )}
        </div>
        <div className="file-input-cont">
          <Upload
            {...props}
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
            
        </div>
        <div className="example-file flex justify-start items-center w-fit pt-2 pb-2 cursor-pointer text-purple-400 hover:text-purple-300 hover:underline gap-1">
          <MdFormatAlignLeft size={20} />
          <a href="/excelExample/example.xlsx" className="" download>Download format</a>
        </div>
      </form>
    </div>
  );
}

export default ReadFileComp;

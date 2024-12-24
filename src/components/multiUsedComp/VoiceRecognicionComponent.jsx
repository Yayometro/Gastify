import React, { useEffect, useState } from "react";
import {
  FaDotCircle,
  FaFlagUsa,
  FaMicrophone,
  FaRegCommentDots,
} from "react-icons/fa";
import { GiMexico } from "react-icons/gi";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { waveform, quantum } from "ldrs";
import { useDispatch, useSelector } from "react-redux";
import { Spin } from "antd";
import { addNewTransacction } from "@/lib/features/transacctionsSlice";


function VoiceRecognicionComponent() {
  const [english, setEnglish] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transText, setTransText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer.data);
  //Speech
  const recognition = new window.webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.lang = english ? "en-US" : "es-Es";
  //To cut the intermiate phrases
  recognition.interimResult = false;
  //Microphone animation config
  waveform.register();
  quantum.register();
  //Fetch
  const toFetch = fetcher();

  useEffect(() => {
    if (isRecording) {
      recognition.start();
      recognition.onresult = (e) => {
        const text = e.results[e.results.length - 1][0].transcript;
        setTransText(text);
      };
      // recognition.onerror = (error) => {
      //   console.error("Recognition error:", error);
      //   runNotify("error", "An error occurred with the speech recognition.");
      //   setIsRecording(false);
      // };
    } else {
      recognition.stop(); 
      recognition.onresult = null; 
    }
  
    return () => {
      recognition.abort(); 
    };
  }, [isRecording]);
  
  const handleNotConfirmed = () => {
    setIsRecording(true);
    setTransText("");
  };
  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      const transObj = {
        text: transText,
        lang: english ? "English" : "Spanish",
        user: ccUser?._id,
      };
      console.log(transObj);
      const res = await toFetch.post(
        `general-data/transactions/speech-add`,
        transObj
      );
      if (!res || !res.ok) {
        console.log(res);
        runNotify(
          "error",
          "Something went wrong saving your transaction, please try again later... 🤕"
          );
          setIsLoading(false);
      }
      if (res.ok) {
        console.log(res.message)
        runNotify("ok", `${res.message}`);
        dispatch(addNewTransacction(res.data))
        setIsLoading(false);
      }
    } catch (e) {
      runNotify("error", e);
      console.log(e);
      setIsLoading(false)
    }
  };

  const handleChangeTextarea = (event) => {
    setTransText(`${event.target.value}`);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop(); // Detén el reconocimiento si está grabando
    } else {
      recognition.lang = english ? "en-US" : "es-ES"; // Configura el idioma antes de iniciar
      recognition.start(); // Inicia el reconocimiento
    }
    setIsRecording(!isRecording);
  };

  
  return (
    <div className=" w-full h-full bg-slate-50 py-10 my-2 px-[30px] rounded-[60px]  overflow-y-scrolls max-w-[900px]">
      {!isLoading ? (
        ""
      ) : (
        <div className="loader absolute top-0 left-0 w-full h-full flex justify-center items-center flex-col gap-2 bg-white/90 z-50 rounded-[60px]">
          <l-quantum size="150" speed="3.1" color="purple"></l-quantum>
          <p className=" text-xl text-purple-800">
            We are creating your new transaction, please wait 🤓
          </p>
        </div>
      )}
      <h1 className="text-2xl font-ligh text-center">Add transactions using your voice <b className="text-purple-400">{"(Beta)"}</b></h1>
      <div
        className="choose-lang cursor-pointer text-purple-500 hover:text-purple-400 text-ls flex justify-center items-center pb-2"
        onClick={() => setEnglish(!english)}
      >
        {english ? (
          <div className=" flex gap-2">
            <FaFlagUsa size={20} />
            <p>Mode in English</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <GiMexico size={20} />
            <p>Mode in Spanish <b className="text-purple-400">{"(Alfa)"}</b></p>
          </div>
        )}
      </div>
      <button
        className=" py-2 px-4 bg-violet-600 hover:bg-violet-500 rounded-full border-none pulse-animation-short"
        onClick={() => setIsRecording(!isRecording)}
      >
        {!isRecording ? (
          <div className=" text-white">
            <FaMicrophone size={50} />
          </div>
        ) : (
          <div className="listening-animation p-2">
            <l-waveform
              size="100"
              stroke="2"
              speed="1"
              color="white"
            ></l-waveform>
          </div>
        )}
      </button>
      <p className=" text-sm font-thin text-orange-600 py-0.5">
        {!isRecording
          ? ""
          : "Press again the record button to stop the recording ✋"}
      </p>
      <div className="transcription-container font-light rounded-lg pt-1 pb-5 my-2 px-2 bg-purple-100 relative">
        <textarea
          className="border-0 p-0 focus:ring-0 focus:border-0 focus:outline-none bg-transparent w-full h-full min-h-[100px] text-center"
          onChange={handleChangeTextarea}
          name="tText"
          id="tText"
          value={
            transText === ""
              ? "Nothing recorded yet. Start to talk..."
              : transText
          }
        ></textarea>
        <button className=" bg-purple-300 text-white py-1 px-3 rounded-xl absolute bottom-1 right-1">
          Edit
        </button>
      </div>
      {!transText ? (
        ""
      ) : (
        <div className="confirm flex flex-col items-center justify-center micro-bounceInUp">
          <h1>Is this what you wanted to say? 🤔</h1>
          <div className="btns-confirm flex gap-2 justify-center items-center text-white font-light pt-2">
            <button
              className=" py-2 px-4 bg-violet-600 hover:bg-violet-500 rounded-3xl"
              onClick={() => handleConfirm()}
            >
              Yes{" "} {
                !isLoading ? ('') : (
                  <Spin size="large"/>
                )
              }
            </button>
            <button
              className=" py-2 px-4 bg-violet-600 hover:bg-violet-500 rounded-3xl"
              onClick={() => handleNotConfirmed()}
            >
              No
            </button>
          </div>
        </div>
      )}
      <br />
      <div className="examples-container flex flex-col justify-start bg-blue-50 text-black/70 rounded-2xl py-2 px-4 text-left relative">
        <div className="icon absolute top-0 right-0 p-2">
          <FaRegCommentDots size={20} />
        </div>
        <p className=" text-base font-medium">
          The phrase must have the following structure to correctly add your new
          transaction.
        </p>
        <p className=" text-sm font-medium pb-2">Here and example:</p>
        <div className="flex gap-2 pl-2 items-center">
          <FaDotCircle size={10} />
          <div className=" text-sm font-light">
            Create a bill with the <strong className=" font-bold">title </strong>
            &quot; school payment&quot;, with a
            <strong className=" font-bold"> value</strong> of &quot; 250
            dollars&quot;,
          </div>
        </div>
        <p className=" text-sm font-medium pb-2">And you can also add more conditions. Here and example:</p>
        <div className="flex gap-2 pl-2 items-center">
          <FaDotCircle size={10} />
          <div className=" text-sm font-light">
            Create a bill with the <strong className=" font-bold">title </strong>
            &quot;Vacation in Hawaii&quot;, with a
            <strong className=" font-bold"> value</strong> of &quot;10,000
            dollars&quot;,
            <strong className=" font-bold"> dated</strong> &quot;August 20, 2024
            at 12:00 p.m.&quot;, with the &quot; vacation&quot;
            <strong className=" font-bold"> category</strong>, in the
            &quot; Santander&quot;
            <strong className=" font-bold"> account</strong>
          </div>
        </div>
        <p className=" text-base font-medium pt-2">
          The structure should be like this example:
        </p>
        <div className="flex gap-2 pl-2 items-center">
          <FaDotCircle size={10} />
          <div className=" text-sm font-light">
            Create an <b className=" font-bold">expense/income</b> with the{" "}
            <b className=" font-bold">title/name</b>{" "}
            <i>&quot;your transaction name here&quot;</i> , with{" "}
            <b className=" font-bold">value</b> <i>&quot;your value&quot;</i>,{" "}
            <b className=" font-bold">dated</b>
            <i>
              &quot;today/yesterday/OR specify day in format [day/month/year]
              and *optional the time&quot;
            </i>
            , with the <b>category</b> <i>&quot;name of your category&quot;</i>,
            in the <b>account</b> <i>&quot;your account name&quot;</i>
          </div>
        </div>
        <p className=" text-base font-medium pt-2">The optionales are:</p>
        <div className="flex gap-2 pl-2 items-center">
          <FaDotCircle size={10} />
          <div className=" text-sm font-light">Time (12:00pm)</div>
        </div>
        <div className="flex gap-2 pl-2 items-center">
          <FaDotCircle size={10} />
          <div className=" text-sm font-light">Category</div>
        </div>
        <div className="flex gap-2 pl-2 items-center pb-5">
          <div className="circle-div text-base font-normal flex justify-center items-center">
            <FaDotCircle size={10} />
          </div>
          <div className=" text-sm font-light">Account</div>
        </div>
        <br />
      </div>
    </div>
  );
}

export default VoiceRecognicionComponent;
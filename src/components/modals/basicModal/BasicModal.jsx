import CategoIcon from "@/components/multiUsedComp/CategoIcon";

function BasicModal({ close, renderContent, renderBodyContent }) {
  if (!close) return null;
  return (
    <div className=" fixed w-screen h-screen top-0 left-0 flex justify-center items-center z-[1000] overflow-x-hidden ">
      <div
        className={`w-screen h-screen bg-white/10 backdrop-blur-sm`}
        onClick={close}
      ></div>
      {renderContent || (
        <div className="content absolute bg-slate-100 border-2 border-purple-600 flex flex-col w-full h-full max-w-[500px] max-h-[90%] rounded-2xl items-center justify-center overflow-hidden z-[10002]">
          {renderBodyContent}
          <button onClick={close}>
            <div className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short z-[100]">
              <CategoIcon type={"MdClose"} siz={20} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default BasicModal;

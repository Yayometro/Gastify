import React, { useEffect, useState } from "react";
import UniversalCategoIcon from "./UniversalCategoIcon";
import CategoIcon from "./CategoIcon";
import { Spin, Tooltip } from "antd";
import { defaultIcons } from "@/helpers/defaultIconsDB";

function IconDisplayerMenu({ idmActive, idmIcon, idmClose }) {
  const [active, setActive] = useState(false);
  const [allIco, setAllIco] = useState([]);
  const defIconsDb = defaultIcons;

  useEffect(() => {
    if (idmActive) {
      setActive(idmActive);
    }

    // Llamada a setAllIco solo cuando sea necesario
    setAllIco(defIconsDb);
  }, [idmActive]);

  const handleSelectionIcon = (sIcon) => {
    // console.log(sIcon);
    idmIcon(sIcon);
  };

  // const handleSearch = (k) => {
  //   // console.log(k)
  //   const filteredIcons = defIconsDb.filter((icon) =>
  //     icon.toLowerCase().includes(k.toLowerCase())
  //   );
  //   setAllIco(filteredIcons);
  // };

  return (
    <div
      className={`fixed top-[-0%] right-[-0%] w-[100%] h-[100%] z-[1005] ${
        active ? "flex" : "hidden"
      } justify-center items-center bg-black/50 backdrop-blur-md`}
    >
      <div className=" w-[90%] h-[95%] gf-glass-violet pl-2 pr-4 py-4 relative rounded-2xl overflow-scroll ">
        <div
          className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short cursor-pointer p-2"
          onClick={() => {
            setActive(false), idmClose(false);
          }}
        >
          <CategoIcon type={"MdClose"} siz={20} />
        </div>
        <div className="flex gap-2 justify-center items-center">
          <h2 className=" text-3xl font-semibold">All icons</h2>
          <Tooltip title="Search the keyword related to the category or scroll and then just click to select the icon you want... 🤓">
            <div className=" w-[15px]">
              <UniversalCategoIcon
                type={`${"fa/FaRegQuestionCircle"}`}
                siz={15}
              />
            </div>
          </Tooltip>
        </div>
        {/* <div className="flex flex-col pb-3">
          <p className="text-sm">Search</p>
          <input
            type="search"
            name=""
            id=""
            className="w-full border-2 border-purple-500 px-2 py-1 rounded-full"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div> */}
        {allIco.length <= 0 ? (
          <div className="w-full h-full flex justify-center items-center">
            <div className="flex flex-col justify-center items-center">
              <Spin size="large" />
              <p className=" text-lg">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {allIco.map((icon, index) => (
              <div
                className="w-full  my-4 py-1 rounded-3xl  "
                key={`icdm-icon-gen-sec-${index}`}
              >
                <h1 className="text-2xl pb-1 text-purple-300 text-center">
                  {icon.name || "No name"}
                </h1>
                <ul className="flex flex-wrap justify-center items-center gap-2 pt-3 ">
                  {icon.icons.map((icon) => (
                    <Tooltip
                      title={`${icon}`}
                      key={`icon-displayer-menu-icon-${icon}`}
                    >
                      <li
                        className="flex justify-center items-center cursor-pointer gf-hover-glass hover:rounded-2xl"
                        onClick={() => {
                          handleSelectionIcon(icon),
                            setActive(false),
                            idmClose(false);
                        }}
                      >
                        <UniversalCategoIcon type={icon} siz={45} />
                      </li>
                    </Tooltip>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IconDisplayerMenu;

{
  /* <li
  className="flex justify-center items-center cursor-pointer"
  key={`icon-displayer-menu-${icon}`}
  onClick={() => {
    handleSelectionIcon(icon), setActive(false), idmClose(false);
  }}
>
  <Tooltip title={`${icon}`}>
    <UniversalCategoIcon type={icon} siz={45} />
  </Tooltip>
</li>; */
}

"use client";

import { useState } from "react";
import { Tooltip } from "antd";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import ToolsModal from "@/components/multiUsedComp/ToolsModal";

// Floating entry point for utility tools (currently: category suggestions).
// Fixed to the viewport so it stays reachable while the page scrolls.
function ToolsFab({ mail }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Tools" placement="left">
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 sm:top-auto bottom-auto sm:bottom-4 right-4 z-[2500] w-12 h-12 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-500 transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Open tools"
        >
          <CategoIcon type="MdAutoAwesome" siz={22} />
        </button>
      </Tooltip>

      {open && <ToolsModal mail={mail} onClose={() => setOpen(false)} />}
    </>
  );
}

export default ToolsFab;

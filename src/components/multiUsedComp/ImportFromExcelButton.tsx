"use client";

import React, { useState } from "react";
import { Tooltip } from "antd";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import ReadFileComp from "./ReadFileComp";
import { useT, useInfo } from "@/i18n/client";
import TitleWithHelp from "@/components/multiUsedComp/TitleWithHelp";

// Import from Excel as a button on the Movements page: it opens the import in a window of its own, in the same glass as the
// Tools window, so the page keeps only the buttons.
function ImportFromExcelButton(): React.JSX.Element {
  const t = useT();
  const { APP_INFO } = useInfo();
  const [open, setOpen] = useState<boolean>(false);
  return (
    <>
      <Tooltip title={t("movements.import.tooltip")}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full gf-glass-card px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          {t("movements.import.title")}
        </button>
      </Tooltip>
      {open && (
        <BasicModal
          zIndexClass="z-[3000]"
          close={() => setOpen(false)}
          renderContent={
            <div className="content absolute gf-glass-violet flex flex-col w-[94vw] max-w-[900px] max-h-[90vh] rounded-3xl overflow-hidden z-[3001]">
              <div className="px-6 pt-6 pb-3 pr-14 text-center">
                <TitleWithHelp as="h2" title={t("movements.import.title")} info={APP_INFO.importar_desde_excel} tour="addImport" titleClassName="text-xl font-semibold text-gf-text" className="justify-center" />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
                <ReadFileComp inWindow />
              </div>
              <button
                type="button"
                aria-label={t("movements.close")}
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 rounded-full gf-glass-card p-1.5 text-purple-100 transition-colors hover:text-white"
              >
                <CategoIcon type="MdClose" siz={18} />
              </button>
            </div>
          }
        />
      )}
    </>
  );
}

export default ImportFromExcelButton;

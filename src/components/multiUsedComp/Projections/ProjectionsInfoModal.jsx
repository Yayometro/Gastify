"use client";

import React from "react";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import CategoIcon from "../CategoIcon";

function ProjectionsInfoModal({ onClose }) {
  return (
    <BasicModal
      close={onClose}
      renderContent={
        <div className="content absolute bg-slate-100 border-2 border-purple-600 flex flex-col w-[95%] max-w-[550px] max-h-[85%] rounded-2xl items-center overflow-y-auto z-[1001] p-6">
          <div
            className="close-con absolute top-2 right-2 border-2 rounded-full bg-slate-50 text-purple-700 p-1 cursor-pointer"
            onClick={onClose}
          >
            <CategoIcon type={"MdClose"} siz={20} />
          </div>
          <h1 className="text-2xl text-purple-800 mb-4">How Projections works</h1>

          <div className="w-full flex flex-col gap-4 text-left">
            <div>
              <p className="font-bold text-purple-700">Net</p>
              <p className="text-sm text-gray-600">
                Income minus expense for that one month. It's the "result" of that specific
                month — positive means you came out ahead, negative means you spent more than
                you earned that month.
              </p>
            </div>
            <div>
              <p className="font-bold text-purple-700">Balance</p>
              <p className="text-sm text-gray-600">
                Your running account total, carried forward month by month starting from
                today's real balance. Past months show a dash because the app never
                auto-adjusts your account balance when you add a transaction — there's no
                reliable way to know what it actually was back then, so instead of guessing,
                you can set it yourself by clicking a past month and entering it manually.
              </p>
            </div>
            <div>
              <p className="font-bold text-purple-700">Why the current month can look "too high"</p>
              <p className="text-sm text-gray-600">
                For the month in progress, each Budget shows whichever is bigger: what you
                budgeted, or what you've actually spent so far. So if you budgeted $20,000 for
                a category but have only spent $17,000 so far this month, Projections still
                shows $20,000 for it — because the month isn't over, and that's what you
                planned to spend. Once your real spending passes the budget, the real number
                takes over automatically. This is why the current month's total can be a bit
                higher than what you've actually spent up to today — it's a forecast for the
                whole month, not a running total of what already happened.
              </p>
            </div>
            <div>
              <p className="font-bold text-purple-700">Unexpected buffers</p>
              <p className="text-sm text-gray-600">
                Two manual amounts (one for expenses, one for income) that cover anything that
                doesn't have its own Budget or Income source — your "just in case" cushion.
                Edit them from any month's detail view.
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default ProjectionsInfoModal;

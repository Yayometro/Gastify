import React, { useEffect, useState } from "react";
import EmptyModule from "./EmptyModule";
import UniversalCategoIcon from "./UniversalCategoIcon";
import CategoIcon from "./CategoIcon";
import currencyFormatter from "currency-formatter";
import dayjs from "dayjs";
import { Tooltip } from "antd";

function Top3({ t3List, t3Type, t3IsBill, t3IsTop }) {
  const [topList, setTopList] = useState([]);
  //   console.log(t3List);
  //   console.log(t3Type);

  useEffect(() => {
    if (t3List.length > 0) {
      const bills = t3List.filter((tra) => tra.isBill);
      // console.log(bills)
      const incomes = t3List.filter((tra) => !tra.isBill);
      // console.log(incomes)
      const sortedList = t3IsBill
        ? bills.sort((a, b) => a.amount - b.amount)
        : incomes.sort((a, b) => a.amount - b.amount);
      if (t3Type === "transactions") {
        setTopList(
          t3IsTop ? sortedList.reverse().slice(0, 3) : sortedList.slice(0, 3)
        );
      } else if (t3Type === "categories") {
        const transFormater = sortedList.map((tra) => {
          if (!tra.category) {
            return {
              category: "no category",
              amount: tra.amount,
              id: "no-cat",
              color: "#ABABAB",
              icon: "MdFilterNone",
            };
          } else {
            return {
              category: tra.category.name,
              amount: tra.amount,
              id: tra.category._id,
              color: tra.category.color || "#ABABAB",
              icon: tra.category.icon || "MdFilterNone",
            };
          }
        });
        // console.log(transFormater);
        const catReducer = transFormater.reduce((acc, current) => {
          const { id, amount } = current;
          if (!acc[id]) {
            acc[id] = { ...current, amount };
          } else {
            acc[id].amount += amount;
          }
          return acc;
        }, {});
        // console.log(catReducer)
        const catArray = Object.values(catReducer);
        const orderedCatArray = catArray.sort((a, b) => a.amount - b.amount);
        console.log(orderedCatArray);
        setTopList(
          t3IsTop
            ? orderedCatArray.reverse().slice(0, 3)
            : orderedCatArray.slice(0, 3)
        );
      }
    }
  }, [t3List]);
  //   console.log(topList);
  return (
    <div className="w-full">
      {t3Type === "transactions" ? (
        topList.lenght > 0 ? (
          <EmptyModule emMessage={"Nothing on top 3 transactions..."} />
        ) : (
          <div className="w-full text-center flex flex-col gap-2 justify-center items-center border-[2px] border-purple-200 px-1 py-2 rounded-2xl ">
            <h1 className="text-center text-lg">
              Top 3 {t3IsBill ? "Bills" : "Incomes"} transactions
            </h1>
            <div className="w-full flex flex-col gap-1 min-[352px]:flex-row">
              {topList.map((trans, index) => (
                <Tooltip title={`${trans.name}`} key={`t3-trans-${trans.id}`}>
                <div
                  className={`tra-cat-cont flex relative justify-between gap-1 items-center flex-1 rounded-3xl px-2 py-2 hover:mix-blend-multiply min-[352px]:justify-center min-[352px]:flex-col min-[352px]:px-2 min-[352px]:min-h-[130px] min-[352px]:min-w-[100px]`}
                  style={{
                    backgroundColor: trans?.category.color || "#DADADA",
                  }}
                  // key={`t3-trans-${trans.id}`}
                >
                  <div className="w-full flex gap-2 items-center truncate">
                    <div className=" bg-white flex justify-center items-center border-2 rounded-full min-w-[30px] min-[352px]:w-[25px] min-[352px]:h-[25px] min-[352px]:absolute min-[352px]:top-[6px] min-[352px]:left-[6px] min-[352px]:shadow-lg">
                      {index + 1}
                    </div>
                    <div className="w-full flex items-center justify-center gap-2 min-[352px]:flex-col min-[352px]:justify-start ">
                      <div className="t3-tra-icon-cont flex justify-center items-center min-w-[10px] min-[352px]:min-w-[30px] ">
                        {!trans.category ? (
                          <UniversalCategoIcon
                            type={`${"md/MdFilterNone"}`}
                            size={25}
                          />
                        ) : !trans.category.icon ? (
                          <UniversalCategoIcon
                            type={"md/MdFilterNone"}
                            size={25}
                          />
                        ) : (
                          <UniversalCategoIcon
                            type={`${trans.category.icon}`}
                            size={25}
                          />
                        )}
                      </div>
                      <p className="w-full text-[15px] font-semibold truncate">
                        {trans.name || "No category name"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center ">
                    {t3IsBill ? (
                      <div className="text-red-500">
                        <CategoIcon type={"MdKeyboardDoubleArrowDown"} />
                      </div>
                    ) : (
                      <div className="text-green-800">
                        <CategoIcon type={"MdKeyboardDoubleArrowUp"} />
                      </div>
                    )}
                    <p className="tra-amount ">
                      {currencyFormatter.format(trans.amount, {
                        locale: "en-US",
                      })}
                    </p>
                  </div>
                </div>
                </Tooltip>
              ))}
            </div>
          </div>
        )
      ) : t3Type === "categories" ? (
        <div className="w-full text-center flex flex-col gap-2 justify-center items-center border-[2px] border-purple-200 px-1 py-2 rounded-2xl ">
          <h1 className="text-center text-lg">
            Top 3 {t3IsBill ? "Bills" : "Incomes"} categories
          </h1>
          {topList.lenght < 0 ? (
            <EmptyModule emMessage={"Nothing on top 3 categories"} />
          ) : (
            <div className="w-full flex flex-col gap-1 min-[352px]:flex-row">
              {topList.map((transCat, index) => (
                <Tooltip title={`${transCat.category}`} key={`t3-trans-${transCat.id}`}>
                <div
                  className={`tra-cat-cont flex relative justify-between gap-1 items-center flex-1 rounded-3xl px-2 py-2 hover:mix-blend-multiply min-[352px]:justify-center min-[352px]:flex-col min-[352px]:px-2 min-[352px]:min-h-[130px] min-[352px]:min-w-[100px]`}
                  style={{
                    backgroundColor: transCat?.color || "#DADADA",
                  }}
                  // key={`t3-trans-${trans.id}`}
                >
                  <div className="w-full flex gap-2 items-center truncate">
                    <div className=" bg-white flex justify-center items-center border-2 rounded-full min-w-[30px] min-[352px]:w-[25px] min-[352px]:h-[25px] min-[352px]:absolute min-[352px]:top-[6px] min-[352px]:left-[6px] min-[352px]:shadow-lg">
                      {index + 1}
                    </div>
                    <div className="w-full flex items-center justify-center gap-2 min-[352px]:flex-col min-[352px]:justify-start ">
                      <div className="t3-tra-icon-cont flex justify-center items-center min-w-[10px] min-[352px]:min-w-[30px] ">
                        {!transCat.category ? (
                          <UniversalCategoIcon
                            type={`${"md/MdFilterNone"}`}
                            size={25}
                          />
                        ) : !transCat.icon ? (
                          <UniversalCategoIcon
                            type={"md/MdFilterNone"}
                            size={25}
                          />
                        ) : (
                          <UniversalCategoIcon
                            type={`${transCat.icon}`}
                            size={25}
                          />
                        )}
                      </div>
                      <p className="w-full text-[15px] font-semibold truncate">
                        {transCat.category || "No category name"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center ">
                    {t3IsBill ? (
                      <div className="text-red-500">
                        <CategoIcon type={"MdKeyboardDoubleArrowDown"} />
                      </div>
                    ) : (
                      <div className="text-green-800">
                        <CategoIcon type={"MdKeyboardDoubleArrowUp"} />
                      </div>
                    )}
                    <p className="tra-amount ">
                      {currencyFormatter.format(transCat.amount, {
                        locale: "en-US",
                      })}
                    </p>
                  </div>
                </div>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      ) : (
        <EmptyModule emMessage={"Nothing on top 3"} />
      )}
    </div>
  );
}

export default Top3;

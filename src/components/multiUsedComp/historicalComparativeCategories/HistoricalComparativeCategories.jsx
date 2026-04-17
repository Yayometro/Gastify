import { timeperiodRangesArray } from "@/helpers/timeFunctions/timeFunctions";
import {
  filterBillsOrIncomes,
  getTransactionsFromTimeRange,
  orderByHighestValue,
  reduceAndTransforToCategories,
} from "@/helpers/transformers/transactionsChange";
import useGetUserSession from "@/hooks/useGetUserSession";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ResponsiveBarsChartComponent from "../chartsComponents/responsiveBarsChartComponent/ResponsiveBarsChartComponent";
import HistoricalComparativeCategoriesView from "./view/HistoricalComparativeCategoriesView";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import RenderTransactionsInModal from "@/components/renderTransactionsInModal/RenderTransactionsInModal";

const today = new Date();

function HistoricalComparativeCategories() {
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [transactionCategories, setTransactionCategories] = useState([]);
  const [timePeriod, setTimePeriod] = useState([
    new Date(today.getFullYear(), today.getMonth() - 2, 1),
    today,
  ]);
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);

  const { email } = useGetUserSession();
  const { close, modalContent, renderModal, handleClose } = useModal();
  // USE EFFECTS:
  useEffect(() => {
    // User
    if (ccUser.status == "idle") {
      dispatch(fetchUser(email));
    }
    //Transactions
    if (ccTransacciones.status == "idle" && email) {
      setIsLoading(true);
      dispatch(fetchTrans(email));
    }
    if (ccUser.status == "succeeded") {
      setUser(ccUser.data);
    }
    //Transactions
    if (ccTransacciones.status == "succeeded") {
      setTransacctions(ccTransacciones.data);
      setIsLoading(false);
    }
  }, [ccUser, ccTransacciones, email]);

  // UseEffect for transactions mutation:
  useEffect(() => {
    if (ccTransacciones.data && ccTransacciones.data.length >= 1) {
      // Order by time and by the amount
      const transactionsOrdered = orderByHighestValue(
        getTransactionsFromTimeRange(
          ccTransacciones.data,
          timePeriod[0],
          timePeriod[1]
        )
      );
      // Divide in bills or incomes
      const dividedTrans = filterBillsOrIncomes(transactionsOrdered);
      // Transformed
      const finalBills = reduceAndTransforToCategories(dividedTrans.bills);
      const finalIncomes = reduceAndTransforToCategories(dividedTrans.incomes);
      //Set
      setTransactionCategories([finalBills.array, finalIncomes.array]);
      setTotalAmount([finalBills.totalAmount, finalIncomes.totalAmount]);
    }
  }, [ccTransacciones.data, timePeriod]);

  const components = [
    {
      tab: "bills",
      props: {
        data: transactionCategories[0] || [],
        totalValue: totalAmount[0] || 0,
        legendBottom: "Months",
        legenedLeft: "Amount",
        propsPlus: {
          onClick: (a, e) => {
            renderModal(<RenderTransactionsInModal data={a} />);
          },
        },
      },
      Component: ResponsiveBarsChartComponent,
    },
    {
      tab: "incomes",
      props: {
        data: transactionCategories[1] || [],
        totalValue: totalAmount[1] || 0,
        legendBottom: "Months",
        legenedLeft: "Amount",
      },
      Component: ResponsiveBarsChartComponent,
    },
  ];

  // FUNCTIONS
  function getValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setTimePeriod([dateStart, dateEnd]);
    }
  }
  const timePeriodsForSelecter = [
    {
      value: `${new Date(
        today.getFullYear(),
        today.getMonth() - 2,
        1
      )}*${today}`,
      name: "Last 3 months",
    },
    ...timeperiodRangesArray,
  ];
  // PROPS
  const props = {
    tabs: ["Bills", "Incomes"],
    components,
    handleRangeDate,
    getValueFromSelecter,
    periodFromFather: timePeriodsForSelecter[0],
    timePeriodsForSelecter,
    timePeriod,
    // isLoading,
  };

  return (
    <>
      <HistoricalComparativeCategoriesView {...props} />;
      {close && (
        <BasicModal close={handleClose} renderBodyContent={modalContent} />
      )}
    </>
  );
}

export default HistoricalComparativeCategories;

import { getPeriodLabel, timeperiodRangesArray } from "@/helpers/timeFunctions/timeFunctions";
import {
  filterBillsOrIncomes,
  getTransactionsFromTimeRange,
  orderByHighestValue,
  reduceAndTransforToCategories,
} from "@/helpers/transformers/transactionsChange";
import CategoriesCompareTable from "./CategoriesCompareTable";
import useGetUserSession from "@/hooks/useGetUserSession";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ResponsiveBarsChartComponent from "../chartsComponents/responsiveBarsChartComponent/ResponsiveBarsChartComponent";
import HistoricalComparativeCategoriesView from "./view/HistoricalComparativeCategoriesView";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";

const today = new Date();

function HistoricalComparativeCategories() {
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [transactionCategories, setTransactionCategories] = useState([]);
  const [timePeriod, setTimePeriod] = useState([
    new Date(today.getFullYear(), today.getMonth() - 2, 1),
    today,
  ]);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [comparePeriod, setComparePeriod] = useState(() => [
    new Date(
      today.getFullYear() - 1,
      today.getMonth() - 2,
      1
    ),
    new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
  ]);
  const [compareCategoryData, setCompareCategoryData] = useState(null);
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const walletPrimaryCurrency =
    useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";

  const { email } = useGetUserSession();
  const { close, modalContent, renderModal, handleClose } = useModal();
  // Stable across the component's lifetime (only depends on the
  // module-level `today`) - memoized so it can safely sit in the compare
  // effect's dependency array below without a new array reference on every
  // render re-triggering that effect in a loop.
  const timePeriodsForSelecter = useMemo(
    () => [
      {
        value: `${new Date(today.getFullYear(), today.getMonth() - 2, 1)}*${today}`,
        name: "Last 3 months",
      },
      ...timeperiodRangesArray,
    ],
    []
  );
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

  // UseEffect for the "compare vs another period" categories - mirrors the
  // primary effect above but for comparePeriod. Each period's categories
  // stay independently sorted by their own value (not merged into one
  // shared ranking) - CategoriesCompareTable renders them as two columns
  // that each keep their own order, since a period's #1 category isn't
  // necessarily the other period's #1.
  useEffect(() => {
    if (!compareEnabled) {
      setCompareCategoryData(null);
      return;
    }
    if (!(ccTransacciones.data && ccTransacciones.data.length >= 1)) return;
    if (!timePeriod[0] || !timePeriod[1] || !comparePeriod[0] || !comparePeriod[1]) return;

    const transB = getTransactionsFromTimeRange(
      ccTransacciones.data,
      comparePeriod[0],
      comparePeriod[1]
    );
    const dividedB = filterBillsOrIncomes(transB);
    const billsB = reduceAndTransforToCategories(dividedB.bills);
    const incomesB = reduceAndTransforToCategories(dividedB.incomes);

    const labelA = getPeriodLabel(timePeriodsForSelecter, timePeriod);
    const labelB = getPeriodLabel(timePeriodsForSelecter, comparePeriod);

    setCompareCategoryData({
      bills: {
        rowsA: transactionCategories[0] || [],
        rowsB: billsB.array,
        totalA: totalAmount[0] || 0,
        totalB: billsB.totalAmount,
      },
      incomes: {
        rowsA: transactionCategories[1] || [],
        rowsB: incomesB.array,
        totalA: totalAmount[1] || 0,
        totalB: incomesB.totalAmount,
      },
      labelA,
      labelB,
    });
  }, [
    ccTransacciones.data,
    timePeriod,
    comparePeriod,
    compareEnabled,
    transactionCategories,
    totalAmount,
    timePeriodsForSelecter,
  ]);

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
            renderModal(<ModalContentTopMonthItem item={a.data} close={handleClose} />);
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
        propsPlus: {
          onClick: (a, e) => {
            renderModal(<ModalContentTopMonthItem item={a.data} close={handleClose} />);
          },
        },
      },
      Component: ResponsiveBarsChartComponent,
    },
  ];

  const tabs = ["Bills", "Incomes"];
  if (compareEnabled && compareCategoryData) {
    const onOpenItem = (item) => renderModal(<ModalContentTopMonthItem item={item} close={handleClose} />);
    components.push(
      {
        tab: "compare bills",
        props: {
          rowsA: compareCategoryData.bills.rowsA,
          rowsB: compareCategoryData.bills.rowsB,
          totalA: compareCategoryData.bills.totalA,
          totalB: compareCategoryData.bills.totalB,
          labelA: compareCategoryData.labelA,
          labelB: compareCategoryData.labelB,
          kindLabel: "Bills",
          walletPrimaryCurrency,
          onOpenItem,
        },
        Component: CategoriesCompareTable,
      },
      {
        tab: "compare incomes",
        props: {
          rowsA: compareCategoryData.incomes.rowsA,
          rowsB: compareCategoryData.incomes.rowsB,
          totalA: compareCategoryData.incomes.totalA,
          totalB: compareCategoryData.incomes.totalB,
          labelA: compareCategoryData.labelA,
          labelB: compareCategoryData.labelB,
          kindLabel: "Incomes",
          walletPrimaryCurrency,
          onOpenItem,
        },
        Component: CategoriesCompareTable,
      }
    );
    tabs.push("Compare bills", "Compare incomes");
  }

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

  function getCompareValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setComparePeriod([new Date(start), new Date(end)]);
  }

  function handleCompareRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setComparePeriod([dateStart, dateEnd]);
    }
  }

  // PROPS
  const props = {
    tabs,
    components,
    handleRangeDate,
    getValueFromSelecter,
    periodFromFather: timePeriodsForSelecter[0],
    timePeriodsForSelecter,
    timePeriod,
    compareEnabled,
    setCompareEnabled,
    comparePeriod,
    getCompareValueFromSelecter,
    handleCompareRangeDate,
    timePeriodsForCompareSelecter: timePeriodsForSelecter,
    // isLoading,
  };

  return (
    <>
      <HistoricalComparativeCategoriesView {...props} />;
      {close && (
        <BasicModal close={handleClose} renderContent={modalContent} />
      )}
    </>
  );
}

export default HistoricalComparativeCategories;

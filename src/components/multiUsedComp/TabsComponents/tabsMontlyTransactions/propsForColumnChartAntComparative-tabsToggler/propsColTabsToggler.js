import AtomicTop from "@/components/multiUsedComp/top3/atomicTop/AtomicTop";
import TooltipForChart from "@/components/toltips/tooltipsForCharts/TooltipForChart";
import { formatMoneyMajor } from "@/lib/money/currencies";

export const generatePropForChartColAntTogglerTabs = ({data, clickedItems, setClickedItems, totalAmount, walletPrimaryCurrency = "MXN" }) => {
  return {
    data: data[2],
    totalValue: (
      <div className="w-full flex flex-col justify-center items-center">
        {clickedItems.length <= 0 ? (
          ""
        ) : (
          <div className="w-full flex flex-col justify-center items-center">
            <section className="w-full flex justify-center items-center py-2 gap-4">
              <button
                className=" py-2 px-2 bg-purple-600 rounded-full hover:bg-purple-800 gap-4 text-white"
                onClick={() => setClickedItems([])}
              >
                Clear
              </button>
              <p className=" text-xs">Selected: </p>
            </section>
            <div className="w-full grid grid-cols-2 items-center gap-2 min-[452px]:flex min-[452px]:justify-start min-[452px]:flex-wrap">
              {clickedItems.map((item, index) => (
                <AtomicTop
                  key={item.type + item.value + item.isBill + index}
                  index={index}
                  color={item.color}
                  icon={item.icon}
                  name={String(item.type).toUpperCase()}
                  isBill={item.isBill ? true : false}
                  value={item.value}
                  fatherStyle={
                    "flex relative justify-between gap-1 items-center flex-1 rounded-3xl px-2 py-2 hover:mix-blend-multiply min-[352px]:justify-center min-[352px]:flex-col min-[352px]:px-2"
                  }
                  tooltip={
                    <div className="flex flex-col justify-center items-center">
                      <b>Type: {item.type}</b>
                      <b>Value: {formatMoneyMajor(item.value, walletPrimaryCurrency)}</b>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        )}
        <div className="w-full pt-2 flex flex-col items-center gap-0.5 text-sm">
          <p className="text-emerald-600">
            Total incomes: <b>{formatMoneyMajor(totalAmount[0] || 0, walletPrimaryCurrency)}</b>
          </p>
          <p className="text-red-500">
            Total bills: <b>{formatMoneyMajor(totalAmount[1] || 0, walletPrimaryCurrency)}</b>
          </p>
          <div className="border-t border-slate-300 w-48 my-1"></div>
          <p className={`font-semibold ${(totalAmount[0] || 0) - (totalAmount[1] || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            Balance (Incomes - Bills):{" "}
            <b>{formatMoneyMajor((totalAmount[0] || 0) - (totalAmount[1] || 0), walletPrimaryCurrency)}</b>
          </p>
        </div>
      </div>
    ),
    propPlus: {
      legend: {
        color: {
          itemMarkerFill: (datum, index, data) => {
            return datum.id === "bill" ? "#ff8c8c" : "#88FFE3";
          },
        },
      },
      state: {
        unselected: { opacity: 0.5 },
        selected: { fill: "orange" },
      },
      interaction: {
        elementSelectByX: true,
        tooltip: {
          render: (e, { items, title }) => {
            return (
              <div
                className="max-w-[250px] flex gap-1 flex-col items-center justify-center rounded-lg p-1 font-sans"
                key={title}
              >
                <h1 className="text-base text-center text-wrap font-bold">
                  {String(title).toUpperCase()}
                </h1>
                {items.map((transMonth) => {
                  const { channel, value, color, name } = transMonth;
                  return (
                    <TooltipForChart
                      item={channel}
                      value={value}
                      color={color}
                      key={name + value}
                      totalValue={
                        name === "bill" ? totalAmount[1] : totalAmount[0]
                      }
                    />
                  );
                })}
              </div>
            );
          },
        },
      },
      label: {
        text: ({ value, isBill }) => {
          if (isBill) {
            return ((value / totalAmount[1]) * 100).toFixed(1) + "%";
          } else {
            return ((value / totalAmount[0]) * 100).toFixed(1) + "%";
          }
        },
        textBaseline: "bottom",
      },
      style: {
        fill: ({ color }) => color,
        inset: 0.2,
      },
      onReady: ({ chart }) => {
        chart.on("interval:click", (evt) => {
          const { data } = evt;
          setClickedItems((prev) => {
            let isRepeated = new Set(prev.map((i) => JSON.stringify(i)));
            return isRepeated.has(JSON.stringify(data?.data))
              ? [...prev]
              : [...prev, data?.data];
          });
        });
      },
    },
  };
};

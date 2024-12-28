import { Column } from "@ant-design/plots";

function ColumnChartAntComparative({
  data,
  propPlus,
  totalIncome,
  totalBill,
  totalValue,
}) {
  const config = {
    data: data,
    xField: "type",
    yField: "value",
    colorField: "transactionType",
    colorLabel: "color",
    group: true,
    style: {
      // Here you can destructerd the object and get the specific prop that you want, in this case I want the property color and that the only one that I get
      fill: ({ color }) => color,
      // 矩形四个方向的内边距
      inset: 0.2,
      // 矩形单个方向的内边距
      // insetLeft:5,
      // insetRight:20,
      // insetBottom:10
      // insetTop:10
    //   click: (d,e,f) => {
    //     console.log(d,e,f)

    //   }
    },
    label: {
      text: ({ value }) => {
        return ((value / totalValue) * 100).toFixed(1) + "%";
      },
      offsed: 0,
    },
    tooltip: (item) => {
        // console.log(item)
        return {
            color: item.color,
            channel: item,
            value: item.value
        }
        
    },
    legend: {
        color: {
            itemMarker: (datum, index, data) => {
                // console.log(datum, index, data)
            },
            itemMarkerFill: (datum, index, data) => {
                // console.log(datum, index, data)
            },
            itemValueFill: (datum, index, data) => {
                // console.log(datum, index, data)
            },
        }
    },
    interaction: {
      tooltip:  {
        render: (e, { items, title }) => {
          console.log(items);
          console.log(title);

          return (
            <div
              className="max-w-[250px] flex gap-1 flex-col items-center justify-center rounded-lg p-1"
              key={title}
            >
              <h1 className="text-base text-center text-wrap font-bold font-sans">
                {String(title).toUpperCase()}
              </h1>
            </div>
          );
        },
      },
    },
    ...propPlus,
  };
  return (
    <div className="responsive-bars-chart-comp w-[100%] h-[400px] min-h-[300px] max-h-[600px]">
      <span className=" text-center text-xs">
        {totalValue}
      </span>
      <Column {...config} />
    </div>
  );
}

export default ColumnChartAntComparative;

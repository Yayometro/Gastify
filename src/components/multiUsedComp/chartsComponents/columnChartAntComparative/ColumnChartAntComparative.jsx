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
    legend: (l) => (l) => {
            console.log(l)

        },
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
  //   [
  //     {
  //       january: 93.76,
  //       type: 'january',
  //       color: '#FF5733',
  //       value: 26343.120000000003,
  //       icon: 'md/MdOutlineFilter1',
  //       index: 1,
  //       isBill: null,
  //       isIncome: true
  //     },]

  //   let temp = [
  //     { name: 'London', '月份': 'Jan.', '月均降雨量': 18.9 },
  //     { name: 'London', '月份': 'Feb.', '月均降雨量': 28.8 },
  //     { name: 'London', '月份': 'Mar.', '月均降雨量': 39.3 },
  //     { name: 'London', '月份': 'Apr.', '月均降雨量': 81.4 },
  //     { name: 'London', '月份': 'May', '月均降雨量': 47 },
  //     { name: 'London', '月份': 'Jun.', '月均降雨量': 20.3 },
  //     { name: 'London', '月份': 'Jul.', '月均降雨量': 24 },
  //     { name: 'London', '月份': 'Aug.', '月均降雨量': 35.6 },
  //     { name: 'Berlin', '月份': 'Jan.', '月均降雨量': 12.4 },
  //     { name: 'Berlin', '月份': 'Feb.', '月均降雨量': 23.2 },
  //     { name: 'Berlin', '月份': 'Mar.', '月均降雨量': 34.5 },
  //     { name: 'Berlin', '月份': 'Apr.', '月均降雨量': 99.7 },
  //     { name: 'Berlin', '月份': 'May', '月均降雨量': 52.6 },
  //     { name: 'Berlin', '月份': 'Jun.', '月均降雨量': 35.5 },
  //     { name: 'Berlin', '月份': 'Jul.', '月均降雨量': 37.4 },
  //     { name: 'Berlin', '月份': 'Aug.', '月均降雨量': 42.4 }
  //   ]

  return (
    <div className="responsive-bars-chart-comp w-[100%] h-[400px] min-h-[300px] max-h-[600px]">
      <span className=" text-center text-xs">
        {totalValue}
      </span>
      <Column {...config} />;
    </div>
  );
}

export default ColumnChartAntComparative;

"use client"
import dynamic from "next/dynamic";

const Column = dynamic(() => import("@ant-design/plots").then((m) => m.Column), {
  ssr: false,
});

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
    // AntV's default theme assumes a light page - axis numbers/labels and
    // the legend all rendered in a dark grey that was unreadable against
    // this app's dark surfaces. "classicDark" is G2's own built-in dark
    // theme and covers every text element this chart draws (axis, legend,
    // labels) in one shot.
    theme: "classicDark",
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
      // @ant-design/plots' Column chart defaults to
      // `elementHighlight: { background: true }` (see its own
      // getDefaultOptions) - a separate interaction from the tooltip's own
      // crosshairs, drawing a shaded rect behind the whole hovered
      // x-category. Off since the tooltip already marks what's active.
      elementHighlight: false,
      tooltip: {
        // Previously only showed the title (a leftover partial
        // implementation) - dropping every item's own name/value, which is
        // the whole point of a tooltip. Matches the dark "glass chip" style
        // already used by ResponsiveBarsChartComponent's tooltip instead of
        // G2's own default (light, cramped) tooltip box.
        render: (e, { items, title }) => (
          <div
            className="max-w-[250px] gf-glass-chip text-gf-text rounded-2xl p-3 flex flex-col gap-1.5"
            key={title}
          >
            <h1 className="text-sm text-center text-wrap font-bold">
              {String(title).toUpperCase()}
            </h1>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        ),
      },
    },
    ...propPlus,
  };
  return (
    <div className="responsive-bars-chart-comp w-full h-full">
      <span className=" text-center text-xs">
        {totalValue}
      </span>
      <Column {...config} />
    </div>
  );
}

export default ColumnChartAntComparative;

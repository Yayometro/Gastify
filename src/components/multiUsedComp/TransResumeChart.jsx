import React, { useEffect, useState } from "react";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { Sunburst } from "@ant-design/plots";
import { IoMdRefresh } from "react-icons/io";
import UniversalCategoIcon from "./UniversalCategoIcon";


function TransResumeChart({ trchTransactions, trchIsBill }) {
  const [dataCat, setDataCat] = useState({});
  const [drilldownData, setDrilldownData] = useState(null);
  const [totalValueOn, setTotalValueOn] = useState(0);
  
  useEffect(() => {
    if (trchTransactions) {
      // SET THE TOTAL AMOUNT
      let totalAmount = trchTransactions.reduce((acc, trans) => acc += trans.amount , 0)
      if(totalAmount) setTotalValueOn(totalAmount)
      //
      let transWithoutCategory = trchTransactions.filter(
        (trans) => !trans.category
      );
      let transWithCategory = trchTransactions.filter(
        (trans) => trans?.category && !trans?.subCategory
      );
      console.log(transWithCategory);
      let transWithSubCat = trchTransactions.filter(
        (trans) => trans?.subCategory
      );
      console.log(transWithSubCat);
      // Save with no category
      let cateFaseOne = transWithoutCategory.map((traWCat) => {
        return {
          fatherId: "Generic-1",
          name: "With no category",
          loc: traWCat?.amount,
          value: traWCat?.amount,
          color: "#ABABAB",
          icon: "MdFilterNone",
          children: [],
        };
      });
      console.log(cateFaseOne);
      let cateFaseDos = transWithCategory.map((traCat) => {
        return {
          fatherId: traCat.category._id,
          name: traCat?.category.name,
          loc: traCat?.amount,
          value: traCat?.amount,
          color: traCat?.category?.color ? traCat?.category?.color : "#ABABAB",
          icon: traCat?.category?.icon || "MdFilterNone",
          children: [],
        };
      });
      console.log(cateFaseDos);
      if (transWithSubCat) {
        transWithSubCat.forEach((traSub) => {
          cateFaseDos.push({
            fatherId: traSub.category._id,
            name: traSub.category?.name,
            color: traSub.category?.color ? traSub.category?.color : "#ABABAB",
            icon: traSub?.category?.icon || "MdFilterNone",
            children: [
              {
                childId: traSub.subCategory._id,
                name: traSub.subCategory?.name,
                loc: traSub?.amount,
                value: traSub?.amount,
                color: traSub.subCategory?.color
                  ? traSub?.subCategory?.color
                  : "#ABABAB",
                icon: traSub?.subCategory?.icon || "MdFilterNone",
              },
            ],
          });
        });
        cateFaseDos = cateFaseDos.concat(cateFaseOne);
        console.log(cateFaseDos);
        const result = cateFaseDos.reduce((acc, item) => {
          // Si la categoría no existe en el acumulador, la inicializamos
          if (!acc[item.fatherId]) {
            acc[item.fatherId] = { ...item, loc: 0, children: [] }; // Inicializamos loc en 0 para sumarlo correctamente después
          }
          
          // Sumamos loc solo si no es una entrada de subcategoría directa
          if (!item.children.length) {
            acc[item.fatherId].loc += item.loc;
          }
          
          // Procesamos los hijos (subcategorías)
          item.children.forEach((child) => {
            const existingChild = acc[item.fatherId].children.find(c => c.childId === child.childId);
            if (existingChild) {
              existingChild.loc += child.loc; // Sumamos si el hijo ya existe
            } else {
              acc[item.fatherId].children.push({ ...child }); // Añadimos el hijo si no existe
            }
          });
        
          return acc;
        }, {});
        if (result) {
          console.log(result);
          const newDataCat = {
            name: trchIsBill ? "Total expenses" : "Total incomes",
            color: trchIsBill ? "#FF9775" : "#A4F379",
            icon: "md/MdMonetizationOn",
            children: Object.values(result),
          };
          //   console.log(newDataCat);
          setDataCat(newDataCat);
        }
        console.log(dataCat);
      }
    }
  }, [trchTransactions]);
const handleSelect = (node) => {
    // Aquí filtras los datos para mostrar solo los hijos del segmento seleccionado
    const filteredData = dataCat.children.find(child => child.name === node.data.name);
    setDrilldownData(filteredData ? { ...dataCat, children: [filteredData] } : dataCat);
}

const resetDrilldown = () => {
    setDrilldownData(null); // Restablecer a los datos originales
}
  return (
    <div className="trch-container w-full h-full">
      <div className="trch-Content-title pt-5 flex justify-center items-center gap-3">
        <h1 className="wallet-budget-title text-2xl text-center font-bold">
          Category {trchIsBill ? "Bills" : "Incomes"} Details
        </h1>
        <div className="return p-2 text-black border-2 border-purple-500 rounded-2xl flex items-center justify-cente text-center cursor-pointer " onClick={resetDrilldown}>
          <IoMdRefresh size={20}/>
        </div>
      </div>
      <div className="trch-content w-full h-full">
        <div className="trhc-ResponsiveSunburst-cont w-[100%] h-[500px] sm:h-[600px]">
          <ResponsiveSunburst
            animate
            data={drilldownData || dataCat}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            id="name"
            value="loc"
            borderColor="#ffffff"
            colors={(cData) => {
              return String(cData.data[`color`]);
            }}
            //Whith individual cgild colors:
            childColor={(parent, child) => {return child.data.color}}
            //inheritColorFromParent To have all the childrens with individual color
            inheritColorFromParent={false}
            enableArcLabels={true}
            arcLabel={(e) => e.id + " ( $" + e.value + ")"}
            arcLabelsRadiusOffset={0.05}
            arcLabelsSkipAngle={12}
            arcLabelsTextColor={{
              from: "color",
              modifiers: [["darker", 1.4]],
            }}
            // ANIMATIONS AND NESTED CHILDS CONFIGS
            motionConfig="gentle"
            onClick={(node) => {
              handleSelect(node)
            }}
            
            transitionMode="pushIn"
            //Center LAYER
            tooltip={(dataa) => {
              // console.log(dataa);
              return (
                <div
                  style={{
                    padding: 5,
                    background: "#F7F9F9",
                    boxShadow: `0px 7px 16px 0px ${
                      dataa.color ? dataa.color : "rgba(0,0,0,0.27)"
                    }`,
                    display: "flex",
                    gap: "5px",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                  }}
                  className="max-w-[250px]"
                >
                  <h1 className="text-base text-center text-wrap font-bold">
                    {dataa.data.name}
                  </h1>
                  <div className="flex gap-2">
                    <div
                      style={{
                        backgroundColor: `${dataa.color}`,
                      }}
                      className="flex items-center justify-center text-[17px] min-w-[60px] h-[60px] rounded-3xl"
                    >
                      <UniversalCategoIcon type={dataa.data.icon} siz={15} />
                    </div>
                    <div className="flex flex-col text-[13px] font-semibold">
                      <div className="flex gap-2">
                        <p className="font-semibold">
                          {trchIsBill ? "Total spent:" : "Total earned:"}
                        </p>
                        ${totalValueOn.toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Amount:</p>
                        {dataa.formattedValue}
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Percentage:</p>
                        {String((dataa.value / totalValueOn) * 100).slice(0, 4)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default TransResumeChart;

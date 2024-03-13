import React, { useEffect, useRef, useState } from "react";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import UniversalCategoIcon from "./UniversalCategoIcon";

function CategoryCirclePacking({ ccpTransacctions, ccpIsBill }) {
  const [zoomedId, setZoomedId] = useState(null);
  const [dataCat, setDataCat] = useState({});
  const [totalValueOn, setTotalValueOn] = useState(0);

  useEffect(() => {
    if (ccpTransacctions) {
      // SET THE TOTAL AMOUNT
      let totalAmount = ccpTransacctions.reduce((acc, trans) => acc += trans.amount , 0)
      if(totalAmount) setTotalValueOn(totalAmount)
      //NO CATEGORY FILTER
      let transNoCategory = ccpTransacctions.filter(
        (trans) => !trans.category
      );
      // console.log(transNoCategory);
      //CATEGORY FILTER
      let transWithCategory = ccpTransacctions.filter(
        (trans) => trans?.category && !trans?.subCategory
      );
      // SUB CAT FILTER
      let transWithSubCat = ccpTransacctions.filter(
        (trans) => trans?.subCategory
      );
      // CREATE NEW OBJ NO CATEGORY
      let cateFaseOne = transNoCategory.map((traNoCat) => {
        return {
          fatherId: "Generic-1",
          name: "No category",
          loc: traNoCat?.amount,
          color: "#ABABAB",
          icon: "MdFilterNone",
          children: [],
        };
      });
      let cateFaseDos = transWithCategory.map((traCat) => {
        return {
          fatherId: traCat.category._id,
          name: traCat?.category.name,
          loc: traCat?.amount,
          color: traCat?.category?.color || "#ABABAB",
          icon: traCat?.category?.icon || "MdFilterNone",
          children: [],
        };
      });
      if (transWithSubCat) {
        transWithSubCat.forEach((traSub) => {
          cateFaseDos.push({
            fatherId: traSub.category._id,
            name: traSub.category?.name,
            color: traSub.category?.color|| "#ABABAB",
            icon: traSub?.category?.icon || "MdFilterNone",
            children: [
              {
                childId: traSub.subCategory._id,
                name: traSub.subCategory?.name,
                loc: traSub?.amount,
                color: traSub.subCategory?.color || "#ABABAB",
                icon: traSub?.subCategory?.icon || "MdFilterNone",
              },
            ],
          });
        });
        cateFaseDos = cateFaseDos.concat(cateFaseOne);
        // console.log(cateFaseDos);
        const result = cateFaseDos.reduce((acc, item) => {
          // Si la categoría no existe en el acumulador, la inicializamos
          if (!acc[item.fatherId]) {
            // console.log(acc[item.fatherId])
            acc[item.fatherId] = { ...item, loc: 0, children: [] }; // Inicializamos loc en 0 para sumarlo correctamente después
          }
          
          // Sumamos loc solo si no es una entrada de subcategoría directa
          if (!item.children.length) {
            // console.log(acc[item.fatherId])
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
        // console.log(result);
        if (result) {
          const newDataCat = {
            name: ccpIsBill ? "Total expenses" : "Total incomes",
            color: ccpIsBill ? "#FF9797" : "#A7E295",
            icon: "md/MdMonetizationOn",
            children: Object.values(result),
          };
          //   console.log(newDataCat);
          setDataCat(newDataCat);
        }
      }
    }
  }, [ccpTransacctions]);
  // console.log(newColors);
  // console.log(dataCat);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="CategoryCircle-Content-title pt-5">
        <h1 className="wallet-budget-title text-2xl text-center font-bold">
          Category {ccpIsBill ? "Bills" : "Incomes"} Details
        </h1>
      </div>
      <div className="circle-graph-container w-full h-full">
        <div className="circle-graph-container w-[100%] h-[500px] sm:[600px]">
          <ResponsiveCirclePacking
            data={dataCat}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            id="name"
            value="loc"
            valueFormat=" >-$"
            // colors={{ scheme: "nivo" }}
            colors={(cData) => {
              return String(cData.data[`color`]);
            }}
            colorBy="id"
            childColor={{
              from: "color",
              //   modifiers: [["brighter", 0.4]],
            }}
            padding={10}
            enableLabels={true}
            label={(e) => e.id + ": " + e.value}
            labelsFilter={(n) => 2 === n.node.depth}
            labelsSkipRadius={9}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 2]],
            }}
            borderWidth={1}
            borderColor={{
              from: "color",
              modifiers: [["darker", 0.5]],
            }}
            motionConfig="slow"
            zoomedId={zoomedId}
            onClick={(node) => {
              setZoomedId(zoomedId === node.id ? null : node.id);
            }}
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
                          {ccpIsBill ? "Total spent:" : "Total earned:"}
                        </p>
                        ${totalValueOn.toFixed(2)}
                      </div>
                      <div className="flex gap-2 underline" >
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

export default CategoryCirclePacking;

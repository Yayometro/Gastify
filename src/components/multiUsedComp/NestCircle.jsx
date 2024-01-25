import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Gauge, CirclePacking } from '@ant-design/plots';
import { Line } from '@ant-design/charts';

const NestCircle = () => {
    // const [data, setData] = useState([]);
    const otherData = {
      name: "Flare",
      children: [
        {
          name: "Something 1",
          children: [
            {
              name: "AgglomerativeCluster",
              value: 3938
            },
            {
              name: "CommunityStructure",
              value: 3812
            },
            {
              name: "HierarchicalCluster",
              value: 6714
            },
            {
              name: "MergeEdge",
              value: 743
            }
          ]
        },
        {
          name: "Something 2",
          value: 244,
          children: [] // Asegúrate de que haya una propiedad children, incluso si está vacía
        },
        {
          name: "Something 3",
          value: 24244,
          children: [] // Asegúrate de que haya una propiedad children, incluso si está vacía
        },
      ]
    }
    

  // useEffect(() => {
  //   // asyncFetch();
  //   setData(otherData)
  // }, []);

  const asyncFetch = () => {
    fetch('https://gw.alipayobjects.com/os/antvdemo/assets/data/flare.json')
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch((error) => {
        console.log('fetch data failed', error);
      });
  };
  const config = {
    autoFit: true,
    padding: 0,
    data: otherData,
    sizeField: 'r',
    // 自定义颜色
    colorField: 'r',
    color: 'rgb(252, 253, 191)-rgb(231, 82, 99)-rgb(183, 55, 121)',
    // 自定义样式
    pointStyle: {
      stroke: 'rgb(183, 55, 121)',
      lineWidth: 0.5,
    },
    label: false,
    legend: false,
    drilldown: {
      enabled: true,
      breadCrumb: {
        position: 'top-left',
      },
    },
  };
      return <CirclePacking {...config} />;
};

export default NestCircle
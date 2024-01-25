
import React from 'react'
import { Liquid } from '@ant-design/plots';

function GoalLiquid({color}) {
    let percent = 0.3;
    const config = {
        percent: 0.3,
        style: {
          outlineBorder: 4,
        //   outlineDistance: 2,
          waveLength: 128, 
          fill: '#9700FF',
          stroke: '#9700FF',
          annotations: false,
          statistic: false,
          text: false
        },
      };
  return (
    <div>
        <h1 className=''>${percent} of XXX budget</h1>
        <Liquid {...config} />
    </div>
  )
}

export default GoalLiquid
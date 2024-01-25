
import { Tiny } from '@ant-design/plots';
import React from 'react';

function GoalBudget({budge, color}) {

    const percent = 0.7;
  const config = {
    percent,
    autoFit: true,
    color: ['#E8EFF5', `${color}`],
    annotations: [
      {
        type: 'text',
        style: {
          text: `${percent * 100}%`,
          x: '50%',
          y: '50%',
          textAlign: 'center',
          fontSize: 16,
          fontStyle: 'bold',
        },
      },
    ],
  };
  return (
    <div>
        <Tiny.Ring {...config} />
    </div>
  )
}

export default GoalBudget
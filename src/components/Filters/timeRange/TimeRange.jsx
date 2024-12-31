"use client"
import React, { useEffect, useState } from "react";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import { DatePicker, Space } from "antd";

function TimeRange({ rpDate, rpResponse, styles }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  useEffect(() => {
    rpDate(startDate, endDate);
  }, [startDate, endDate]);

  const onChangeStart = (date, dateString) => {
    if(!date) return null
    if(!date.$d) return null
    setStartDate(date.$d);
  };
  const onChangeEnd = (date, dateString) => {
    if(!date) return null
    if(!date.$d) return null
    setEndDate(date.$d);
  };

  const dateFormat = "DD/MM/YYYY";
  return (
    <div className={`w-fit ${!styles ? "bg-slate-200 px-1.5 rounded-full" : styles}`}>
      <Space
        direction="horizontal"
        size={5}
        className="ant-date-range-encapsulator3"
      >
        <div className="unit-date-enc3">
          <DatePicker
            size="small"
            onChange={onChangeStart}
            className="ant-date-picker-range3"
            format={dateFormat}
            placeholder="Start"
          />
        </div>
        <div className="unit-date-enc3">
          <DatePicker
            size="small"
            onChange={onChangeEnd}
            format={dateFormat}
            className="ant-date-picker-range3"
            placeholder="End"
          />
        </div>
      </Space>
    </div>
  );
}

export default TimeRange;

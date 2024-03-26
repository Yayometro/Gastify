import React, { useEffect, useState } from "react";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import dayjs from "dayjs";
import { DatePicker, Radio, Space } from "antd";

function RangePicker({ rpDate, rpResponse }) {
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
    <div className="w-fit">
      <Space
        direction="horizontal"
        size={5}
        className="ant-date-range-encapsulator"
      >
        <div className="unit-date-enc">
          <DatePicker
            size="small"
            onChange={onChangeStart}
            className="ant-date-picker-range"
            placeholder="Start"
          />
        </div>
        <div className="unit-date-enc">
          <DatePicker
            size="small"
            onChange={onChangeEnd}
            format={dateFormat}
            className="ant-date-picker-range"
            placeholder="End"
          />
        </div>
      </Space>
    </div>
  );
}

export default RangePicker;

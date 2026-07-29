"use client";
import React, { useEffect, useState } from "react";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import { DatePicker, Space, Tooltip } from "antd";
import dayjs from "dayjs";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { months } from "@/helpers/timeFunctions/timeFunctions";

function TimeRange({ rpDate, rpResponse, styles }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    rpDate(startDate, endDate);
  }, [startDate, endDate]);

  const onChangeStart = (date) => {
    if (!date) {
      setStartDate(null);
      return;
    }
    const d = date.toDate ? date.toDate() : date.$d;
    if (d && !isNaN(d)) setStartDate(d);
  };

  const onChangeEnd = (date) => {
    if (!date) {
      setEndDate(null);
      return;
    }
    const d = date.toDate ? date.toDate() : date.$d;
    if (d && !isNaN(d)) setEndDate(d);
  };

  const getRefDate = () => {
    if (startDate instanceof Date && !isNaN(startDate)) return startDate;
    if (endDate instanceof Date && !isNaN(endDate)) return endDate;
    return new Date();
  };

  const getPrevMonthInfo = () => {
    const ref = getRefDate();
    const currYear = ref.getFullYear();
    const currMonth = ref.getMonth(); // 0 - 11
    const prevMonth = currMonth === 0 ? 11 : currMonth - 1;
    const prevYear = currMonth === 0 ? currYear - 1 : currYear;
    const start = new Date(prevYear, prevMonth, 1, 0, 0, 0);
    const end = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59);
    return {
      name: months[prevMonth],
      year: prevYear,
      start,
      end,
      label: `${months[prevMonth]} ${prevYear} (${dayjs(start).format("DD/MM/YYYY")} – ${dayjs(end).format("DD/MM/YYYY")})`,
    };
  };

  const getNextMonthInfo = () => {
    const ref = getRefDate();
    const currYear = ref.getFullYear();
    const currMonth = ref.getMonth();
    const nextMonth = currMonth === 11 ? 0 : currMonth + 1;
    const nextYear = currMonth === 11 ? currYear + 1 : currYear;
    const start = new Date(nextYear, nextMonth, 1, 0, 0, 0);
    const end = new Date(nextYear, nextMonth + 1, 0, 23, 59, 59);
    return {
      name: months[nextMonth],
      year: nextYear,
      start,
      end,
      label: `${months[nextMonth]} ${nextYear} (${dayjs(start).format("DD/MM/YYYY")} – ${dayjs(end).format("DD/MM/YYYY")})`,
    };
  };

  const handlePrevMonth = () => {
    const prev = getPrevMonthInfo();
    setStartDate(prev.start);
    setEndDate(prev.end);
  };

  const handleNextMonth = () => {
    const next = getNextMonthInfo();
    setStartDate(next.start);
    setEndDate(next.end);
  };

  const prevInfo = getPrevMonthInfo();
  const nextInfo = getNextMonthInfo();
  const dateFormat = "DD/MM/YYYY";

  return (
    <div className={`w-fit flex items-center gap-1 ${!styles ? "bg-slate-200 px-1.5 py-0.5 rounded-full" : styles}`}>
      <Tooltip title={`Go to previous month: ${prevInfo.label}`}>
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-white hover:bg-purple-600 hover:text-white text-slate-600 shadow-2xs border border-slate-300 transition-all active:scale-95 flex-shrink-0"
        >
          <MdChevronLeft size={16} />
        </button>
      </Tooltip>

      <Space
        direction="horizontal"
        size={5}
        className="ant-date-range-encapsulator3"
      >
        <div className="unit-date-enc3">
          <DatePicker
            size="small"
            value={startDate ? dayjs(startDate) : null}
            onChange={onChangeStart}
            className="ant-date-picker-range3"
            format={dateFormat}
            placeholder="Start"
          />
        </div>
        <div className="unit-date-enc3">
          <DatePicker
            size="small"
            value={endDate ? dayjs(endDate) : null}
            onChange={onChangeEnd}
            format={dateFormat}
            className="ant-date-picker-range3"
            placeholder="End"
          />
        </div>
      </Space>

      <Tooltip title={`Go to next month: ${nextInfo.label}`}>
        <button
          type="button"
          onClick={handleNextMonth}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-white hover:bg-purple-600 hover:text-white text-slate-600 shadow-2xs border border-slate-300 transition-all active:scale-95 flex-shrink-0"
        >
          <MdChevronRight size={16} />
        </button>
      </Tooltip>
    </div>
  );
}

export default TimeRange;

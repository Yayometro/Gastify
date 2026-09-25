"use client";
import React, { useEffect, useRef, useState } from "react";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import { DatePicker, Space, Tooltip } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { months } from "@/helpers/timeFunctions/timeFunctions";

export interface MonthInfo {
  name: string;
  year: number;
  start: Date;
  end: Date;
  label: string;
}

export interface TimeRangeProps {
  rpDate?: (startDate: Date | null, endDate: Date | null) => void;
  rpResponse?: string;
  styles?: string;
  startDateValue?: Date | string | number | Dayjs | null;
  endDateValue?: Date | string | number | Dayjs | null;
}

function TimeRange({
  rpDate,
  styles,
  startDateValue,
  endDateValue,
}: TimeRangeProps): React.JSX.Element {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const isControlled = startDateValue !== undefined || endDateValue !== undefined;
  const selectedStartDate = isControlled ? startDateValue || null : startDate;
  const selectedEndDate = isControlled ? endDateValue || null : endDate;
  const rpDateRef = useRef(rpDate);

  useEffect(() => {
    rpDateRef.current = rpDate;
  }, [rpDate]);

  useEffect(() => {
    if (!isControlled) rpDateRef.current(startDate, endDate);
  }, [startDate, endDate, isControlled]);

  const updateRange = (nextStart: Date | null, nextEnd: Date | null): void => {
    if (isControlled) {
      rpDate(nextStart, nextEnd);
      return;
    }
    setStartDate(nextStart);
    setEndDate(nextEnd);
  };

  const onChangeStart = (date: Dayjs | null): void => {
    if (!date) {
      updateRange(null, selectedEndDate as Date | null);
      return;
    }
    const d: Date | undefined = date.toDate ? date.toDate() : (date as unknown as { $d?: Date }).$d;
    if (d && !isNaN(Number(d))) updateRange(d, selectedEndDate as Date | null);
  };

  const onChangeEnd = (date: Dayjs | null): void => {
    if (!date) {
      updateRange(selectedStartDate as Date | null, null);
      return;
    }
    const d: Date | undefined = date.toDate ? date.toDate() : (date as unknown as { $d?: Date }).$d;
    if (d && !isNaN(Number(d))) updateRange(selectedStartDate as Date | null, d);
  };

  const getRefDate = (): Date => {
    if (selectedStartDate instanceof Date && !isNaN(selectedStartDate.getTime())) return selectedStartDate;
    if (selectedEndDate instanceof Date && !isNaN(selectedEndDate.getTime())) return selectedEndDate;
    return new Date();
  };

  const getPrevMonthInfo = (): MonthInfo => {
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

  const getNextMonthInfo = (): MonthInfo => {
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

  const handlePrevMonth = (): void => {
    const prev = getPrevMonthInfo();
    updateRange(prev.start, prev.end);
  };

  const handleNextMonth = (): void => {
    const next = getNextMonthInfo();
    updateRange(next.start, next.end);
  };

  const prevInfo = getPrevMonthInfo();
  const nextInfo = getNextMonthInfo();
  const dateFormat = "DD/MM/YYYY";

  return (
    <div className={`w-fit flex items-center gap-1 ${!styles ? "gf-glass-card px-1.5 py-0.5 rounded-full" : styles}`}>
      <Tooltip title={`Go to previous month: ${prevInfo.label}`}>
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-5 h-5 flex items-center justify-center rounded-full gf-glass-inset hover:bg-purple-600 hover:text-white text-gf-text shadow-2xs transition-all active:scale-95 flex-shrink-0"
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
            value={selectedStartDate ? dayjs(selectedStartDate) : null}
            onChange={onChangeStart}
            className="ant-date-picker-range3"
            format={dateFormat}
            placeholder="Start"
          />
        </div>
        <div className="unit-date-enc3">
          <DatePicker
            size="small"
            value={selectedEndDate ? dayjs(selectedEndDate) : null}
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
          className="w-5 h-5 flex items-center justify-center rounded-full gf-glass-inset hover:bg-purple-600 hover:text-white text-gf-text shadow-2xs transition-all active:scale-95 flex-shrink-0"
        >
          <MdChevronRight size={16} />
        </button>
      </Tooltip>
    </div>
  );
}

export default TimeRange;

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 날짜 값은 시간대 영향을 받지 않도록 "YYYY-MM-DD" 문자열로 주고받는다. Date는 화면 계산에만 로컬 시간으로 쓴다.
export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const parseDateKey = (value: string | undefined | null): Date | null => {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(value ?? "").trim().replace(/[./]/g, "-"));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getMonth() === Number(match[2]) - 1 ? date : null;
};

export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  // 단일 선택이면 selected만, 기간 선택이면 rangeStart/rangeEnd를 넘긴다.
  selected?: string;
  rangeStart?: string;
  rangeEnd?: string;
  min?: string;
  max?: string;
  onSelect: (dateKey: string) => void;
  // 처음 보여줄 달. 없으면 선택된 날짜, 그것도 없으면 오늘이 있는 달.
  initialMonth?: string;
  // true면 열릴 때 선택된 날짜(없으면 오늘)에 키보드 포커스를 둔다.
  autoFocus?: boolean;
  onEscape?: () => void;
}

/**
 * 한 달 단위 달력. DateField와 DateRangeField가 띄우는 패널 안에서 쓴다.
 * 방향키로 하루·한 주씩, PageUp/PageDown으로 한 달씩 움직이고 Enter·Space로 고른다.
 */
const Calendar = ({ selected, rangeStart, rangeEnd, min, max, onSelect, initialMonth, autoFocus = false, onEscape }: Props) => {
  const todayKey = toDateKey(new Date());
  const startFocus = parseDateKey(selected || rangeEnd || rangeStart || initialMonth) ?? new Date();
  const [focusDate, setFocusDate] = useState(startFocus);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const keyboardMoved = useRef(autoFocus);

  const viewYear = focusDate.getFullYear();
  const viewMonth = focusDate.getMonth();

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [viewYear, viewMonth]);

  const focusKey = toDateKey(focusDate);

  useEffect(() => {
    if (!keyboardMoved.current) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusKey}"]`)?.focus();
  }, [focusKey]);

  const isDisabled = (key: string) => Boolean((min && key < min) || (max && key > max));

  // 기간의 끝을 아직 고르지 않았으면 마우스가 올라간 날짜까지 미리 칠한다.
  const previewEnd = rangeStart && !rangeEnd ? hoverKey : rangeEnd;
  const [lowKey, highKey] =
    rangeStart && previewEnd ? (rangeStart <= previewEnd ? [rangeStart, previewEnd] : [previewEnd, rangeStart]) : [null, null];

  const move = (next: Date) => {
    keyboardMoved.current = true;
    setFocusDate(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const steps: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDate, -1),
      ArrowRight: () => addDays(focusDate, 1),
      ArrowUp: () => addDays(focusDate, -7),
      ArrowDown: () => addDays(focusDate, 7),
      PageUp: () => new Date(viewYear, viewMonth - 1, Math.min(focusDate.getDate(), 28)),
      PageDown: () => new Date(viewYear, viewMonth + 1, Math.min(focusDate.getDate(), 28)),
      Home: () => addDays(focusDate, -focusDate.getDay()),
      End: () => addDays(focusDate, 6 - focusDate.getDay()),
    };
    if (steps[event.key]) {
      event.preventDefault();
      move(steps[event.key]());
    } else if (event.key === "Escape" && onEscape) {
      event.preventDefault();
      onEscape();
    }
  };

  const navButton =
    "flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-white";

  return (
    <div className="w-[280px] select-none" onKeyDown={handleKeyDown}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="이전 달" className={navButton} onClick={() => setFocusDate(new Date(viewYear, viewMonth - 1, 1))}>
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-semibold text-gray-950 dark:text-white" aria-live="polite">
          {viewYear}년 {viewMonth + 1}월
        </div>
        <button type="button" aria-label="다음 달" className={navButton} onClick={() => setFocusDate(new Date(viewYear, viewMonth + 1, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-400 dark:text-dark-400">
        {WEEKDAYS.map((day, index) => (
          <div key={day} className={`py-1.5 ${index === 0 ? "text-red-400" : index === 6 ? "text-blue-400" : ""}`}>
            {day}
          </div>
        ))}
      </div>

      <div ref={gridRef} role="grid" className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => setHoverKey(null)}>
        {days.map((day) => {
          const key = toDateKey(day);
          const outside = day.getMonth() !== viewMonth;
          const disabled = isDisabled(key);
          const isSelected = key === selected || key === rangeStart || key === rangeEnd;
          const inRange = lowKey && highKey && key > lowKey && key < highKey;
          const isEdgeLow = lowKey === key && highKey !== key;
          const isEdgeHigh = highKey === key && lowKey !== key;
          return (
            <div
              key={key}
              className={`flex justify-center ${inRange ? "bg-gray-100 dark:bg-dark-800" : ""} ${
                isEdgeLow ? "rounded-l-full bg-gradient-to-r from-transparent from-50% to-gray-100 to-50% dark:to-dark-800" : ""
              } ${isEdgeHigh ? "rounded-r-full bg-gradient-to-l from-transparent from-50% to-gray-100 to-50% dark:to-dark-800" : ""}`}
            >
              <button
                type="button"
                data-date={key}
                tabIndex={key === focusKey ? 0 : -1}
                disabled={disabled}
                aria-selected={isSelected}
                aria-current={key === todayKey ? "date" : undefined}
                aria-label={`${day.getFullYear()}년 ${day.getMonth() + 1}월 ${day.getDate()}일`}
                onClick={() => {
                  setFocusDate(day);
                  onSelect(key);
                }}
                onMouseEnter={() => setHoverKey(key)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:text-gray-300 dark:disabled:text-dark-600 ${
                  isSelected
                    ? "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-950"
                    : outside
                      ? "text-gray-300 hover:bg-gray-100 dark:text-dark-600 dark:hover:bg-dark-800"
                      : "text-gray-700 hover:bg-gray-100 dark:text-dark-200 dark:hover:bg-dark-700"
                } ${key === todayKey && !isSelected ? "font-semibold ring-1 ring-inset ring-gray-300 dark:ring-dark-500" : ""}`}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;

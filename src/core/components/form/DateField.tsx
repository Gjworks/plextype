"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X } from "lucide-react";

import { useFloatingPlacement } from "@hooks/useFloatingPlacement";
import Calendar, { addDays, parseDateKey, toDateKey } from "./Calendar";
import { fieldBoxClass, fieldIconClass, fieldLabelClass, floatingPanelClass } from "./fieldStyles";

const PANEL_WIDTH = 306;
const PANEL_HEIGHT = 360;

interface DateFieldProps {
  inputTitle: string;
  name?: string;
  id?: string;
  // "YYYY-MM-DD". 넘기면 controlled, defaultValue만 넘기면 uncontrolled로 동작한다. 빈 문자열은 선택 안 함.
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  // true면 지우기 버튼을 보여준다.
  clearable?: boolean;
  hideLabel?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

// 바깥을 누르면 닫는다. 달력 패널은 portal로 body에 붙으므로 기준 요소와 패널을 모두 확인한다.
const useOutsideClose = (open: boolean, close: () => void, ...refs: React.RefObject<HTMLElement | null>[]) => {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!refs.some((ref) => ref.current?.contains(target))) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
};

/**
 * 날짜 하나를 고르는 입력. 직접 "2026-11-09"(또는 2026.11.09, 2026/11/09)로 입력하거나 달력에서 고른다.
 * 입력창에서 ↓ 또는 Alt+↓를 누르면 달력으로 키보드 포커스가 옮겨간다.
 */
export const DateField = ({
  inputTitle,
  name,
  id,
  value,
  defaultValue = "",
  onChange,
  min,
  max,
  placeholder = "YYYY-MM-DD",
  clearable = true,
  hideLabel = false,
  disabled,
  error,
  className = "",
}: DateFieldProps) => {
  const autoId = useId();
  const inputId = id || name || autoId;
  const hasError = !!error;
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState(defaultValue);
  const current = isControlled ? value : innerValue;
  const [text, setText] = useState(current);
  const [open, setOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { style } = useFloatingPlacement(fieldRef, open, { width: PANEL_WIDTH, needHeight: PANEL_HEIGHT });

  useEffect(() => setText(current), [current]);
  useOutsideClose(open, () => setOpen(false), fieldRef, panelRef);

  const commit = (next: string) => {
    if (!isControlled) setInnerValue(next);
    setText(next);
    if (next !== current) onChange?.(next);
  };

  // 입력한 글자를 날짜로 바꿔 확정한다. 잘못된 날짜나 범위를 벗어난 값은 이전 값으로 되돌린다.
  const commitTyped = () => {
    const trimmed = text.trim();
    if (!trimmed) return commit("");
    const parsed = parseDateKey(trimmed);
    const key = parsed ? toDateKey(parsed) : "";
    if (key && !(min && key < min) && !(max && key > max)) commit(key);
    else setText(current);
  };

  return (
    <div className={`w-full ${className}`}>
      {!hideLabel && (
        <label htmlFor={inputId} className={fieldLabelClass(disabled)}>
          {inputTitle}
        </label>
      )}
      <div ref={fieldRef} className={fieldBoxClass({ disabled, hasError })}>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="달력 열기"
          onClick={() => {
            setKeyboardOpen(false);
            setOpen((prev) => !prev);
          }}
          className={`pl-3 pr-1 ${fieldIconClass(disabled)}`}
        >
          <CalendarDays size={16} />
        </button>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={hideLabel ? inputTitle : undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          onClick={() => {
            setKeyboardOpen(false);
            setOpen(true);
          }}
          onChange={(event) => setText(event.target.value)}
          onBlur={commitTyped}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitTyped();
              setOpen(false);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setKeyboardOpen(true);
              setOpen(true);
            } else if (event.key === "Escape" && open) {
              event.preventDefault();
              setOpen(false);
            }
          }}
          className="w-full min-w-0 bg-transparent px-2 py-2.5 text-sm tabular-nums text-black outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-dark-100 dark:placeholder:text-dark-400"
        />
        {clearable && current && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="날짜 지우기"
            onClick={() => commit("")}
            className="mr-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:text-dark-400 dark:hover:bg-dark-700 dark:hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {name && <input type="hidden" name={name} value={current} />}

      {open &&
        style &&
        createPortal(
          <div ref={panelRef} role="dialog" aria-label={`${inputTitle} 달력`} style={style} className={`p-3 ${floatingPanelClass}`}>
            <Calendar
              key={current}
              selected={current}
              min={min}
              max={max}
              autoFocus={keyboardOpen}
              onSelect={(key) => {
                commit(key);
                setOpen(false);
                inputRef.current?.focus();
              }}
              onEscape={() => {
                setOpen(false);
                inputRef.current?.focus();
              }}
            />
            <div className="mt-2 flex justify-end border-t border-gray-100 pt-2 dark:border-dark-800">
              <button
                type="button"
                onClick={() => {
                  commit(toDateKey(new Date()));
                  setOpen(false);
                }}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-white"
              >
                오늘
              </button>
            </div>
          </div>,
          document.body,
        )}

      {error && (
        <div id={`${inputId}-error`} className="mt-1.5 text-xs leading-5 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export interface DateRangeValue {
  start: string;
  end: string;
}

interface DateRangeFieldProps {
  inputTitle: string;
  // 넘기면 `${name}Start`, `${name}End` hidden input으로 form에 보낸다.
  name?: string;
  id?: string;
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  // 최근 7일·30일·이번 달 같은 빠른 선택 버튼. false로 숨긴다.
  presets?: boolean;
  hideLabel?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const buildPresets = () => {
  const today = new Date();
  const todayKey = toDateKey(today);
  return [
    { label: "오늘", value: { start: todayKey, end: todayKey } },
    { label: "최근 7일", value: { start: toDateKey(addDays(today, -6)), end: todayKey } },
    { label: "최근 30일", value: { start: toDateKey(addDays(today, -29)), end: todayKey } },
    {
      label: "이번 달",
      value: {
        start: toDateKey(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: toDateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      },
    },
    {
      label: "지난달",
      value: {
        start: toDateKey(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        end: toDateKey(new Date(today.getFullYear(), today.getMonth(), 0)),
      },
    },
  ];
};

/**
 * 시작일과 종료일을 고르는 입력. 달력에서 두 번 누르면 기간이 정해지고, 거꾸로 눌러도 앞뒤를 맞춰 저장한다.
 */
export const DateRangeField = ({
  inputTitle,
  name,
  id,
  value,
  defaultValue = { start: "", end: "" },
  onChange,
  min,
  max,
  placeholder = "기간 선택",
  presets = true,
  hideLabel = false,
  disabled,
  error,
  className = "",
}: DateRangeFieldProps) => {
  const autoId = useId();
  const inputId = id || name || autoId;
  const hasError = !!error;
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState(defaultValue);
  const current = isControlled ? value : innerValue;
  const [open, setOpen] = useState(false);
  // 기간 고르기 도중의 시작일. 두 번째 날짜를 누르면 확정하고 비운다.
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  const fieldRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelWidth = presets ? PANEL_WIDTH + 112 : PANEL_WIDTH;
  const { style } = useFloatingPlacement(fieldRef, open, { width: panelWidth, needHeight: PANEL_HEIGHT });

  const close = () => {
    setOpen(false);
    setPendingStart(null);
  };
  useOutsideClose(open, close, fieldRef, panelRef);

  const commit = (next: DateRangeValue) => {
    if (!isControlled) setInnerValue(next);
    onChange?.(next);
  };

  const label = current.start ? `${current.start} ~ ${current.end || current.start}` : "";

  return (
    <div className={`w-full ${className}`}>
      {!hideLabel && (
        <label htmlFor={inputId} className={fieldLabelClass(disabled)}>
          {inputTitle}
        </label>
      )}
      <div className={fieldBoxClass({ disabled, hasError })}>
        <button
          ref={fieldRef}
          id={inputId}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={hasError}
          aria-label={hideLabel ? inputTitle : undefined}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          onClick={() => (open ? close() : setOpen(true))}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) close();
          }}
          className="flex w-full min-w-0 items-center gap-2 px-3 py-2.5 text-left text-sm outline-none disabled:cursor-not-allowed"
        >
          <CalendarDays size={16} className={`shrink-0 ${fieldIconClass(disabled)}`} />
          <span className={`truncate tabular-nums ${label ? "text-black dark:text-dark-100" : "text-gray-400 dark:text-dark-400"}`}>
            {label || placeholder}
          </span>
        </button>
        {current.start && !disabled && (
          <button
            type="button"
            aria-label="기간 지우기"
            onClick={() => commit({ start: "", end: "" })}
            className="mr-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:text-dark-400 dark:hover:bg-dark-700 dark:hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {name && (
        <>
          <input type="hidden" name={`${name}Start`} value={current.start} />
          <input type="hidden" name={`${name}End`} value={current.end} />
        </>
      )}

      {open &&
        style &&
        createPortal(
          <div ref={panelRef} role="dialog" aria-label={`${inputTitle} 달력`} style={style} className={`flex p-3 ${floatingPanelClass}`}>
            {presets && (
              <div className="mr-3 grid w-[100px] content-start gap-0.5 border-r border-gray-100 pr-3 dark:border-dark-800">
                {buildPresets().map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      commit(preset.value);
                      close();
                      fieldRef.current?.focus();
                    }}
                    className="rounded-md px-2.5 py-1.5 text-left text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
            <div>
              <Calendar
                rangeStart={pendingStart ?? current.start}
                rangeEnd={pendingStart ? undefined : current.end}
                min={min}
                max={max}
                autoFocus
                onSelect={(key) => {
                  if (!pendingStart) {
                    setPendingStart(key);
                    return;
                  }
                  commit(pendingStart <= key ? { start: pendingStart, end: key } : { start: key, end: pendingStart });
                  close();
                  fieldRef.current?.focus();
                }}
                onEscape={() => {
                  close();
                  fieldRef.current?.focus();
                }}
              />
              <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-400 dark:border-dark-800 dark:text-dark-400">
                {pendingStart ? `${pendingStart}부터, 종료일을 고르세요.` : "시작일을 고르세요."}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {error && (
        <div id={`${inputId}-error`} className="mt-1.5 text-xs leading-5 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default DateField;

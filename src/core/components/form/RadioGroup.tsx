"use client";

import React, { useId, useState } from "react";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

interface Props {
  name: string;
  options: RadioOption[];
  inputTitle?: string;
  // 넘기면 controlled, defaultValue만 넘기면 uncontrolled로 동작한다.
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  // list는 세로 목록, card는 테두리 있는 선택 카드(요금제·옵션 고르기 등)로 보여준다.
  variant?: "list" | "card";
  direction?: "vertical" | "horizontal";
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * 같은 name의 radio input 묶음. 실제 input을 쓰므로 방향키 이동과 form 전송이 브라우저 기본대로 동작한다.
 */
const RadioGroup = ({
  name,
  options,
  inputTitle,
  value,
  defaultValue,
  onChange,
  variant = "list",
  direction = "vertical",
  disabled,
  error,
  className = "",
}: Props) => {
  const groupId = useId();
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const current = value !== undefined ? value : innerValue;

  const layoutClass =
    direction === "horizontal" ? "flex flex-wrap gap-x-5 gap-y-2" : variant === "card" ? "grid gap-2" : "grid gap-2.5";

  return (
    <div className={className}>
      {inputTitle && (
        <div id={`${groupId}-title`} className="mb-2 block text-sm font-medium text-black dark:text-dark-200">
          {inputTitle}
        </div>
      )}
      <div
        role="radiogroup"
        aria-labelledby={inputTitle ? `${groupId}-title` : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${groupId}-error` : undefined}
        className={`${layoutClass} ${direction === "horizontal" && variant === "card" ? "grid-cols-2 md:grid-cols-3" : ""}`}
      >
        {options.map((option) => {
          const optionDisabled = disabled || option.disabled;
          const checked = current === option.value;
          const inputId = `${groupId}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={`group flex items-start gap-2.5 ${optionDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
                variant === "card"
                  ? `rounded-lg border p-3.5 transition-colors ${
                      checked
                        ? "border-gray-900 bg-gray-50 dark:border-dark-300 dark:bg-dark-800"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500"
                    }`
                  : ""
              }`}
            >
              <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                <input
                  id={inputId}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={checked}
                  disabled={optionDisabled}
                  onChange={() => {
                    if (value === undefined) setInnerValue(option.value);
                    onChange?.(option.value);
                  }}
                  className={`peer absolute inset-0 m-0 cursor-[inherit] appearance-none rounded-full border bg-white transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200/80 checked:border-gray-900 dark:bg-dark-800 dark:focus-visible:ring-dark-700/60 dark:checked:border-white ${
                    error ? "border-red-400 dark:border-red-500/70" : "border-gray-300 group-hover:border-gray-400 dark:border-dark-500 dark:group-hover:border-dark-400"
                  }`}
                />
                <span className="pointer-events-none relative hidden h-2 w-2 rounded-full bg-gray-900 peer-checked:block dark:bg-white" />
              </span>
              <span className="min-w-0">
                <span className={`block text-sm ${checked ? "font-medium text-gray-950 dark:text-white" : "text-gray-800 dark:text-dark-100"}`}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-dark-400">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <div id={`${groupId}-error`} className="mt-1.5 text-xs leading-5 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default RadioGroup;

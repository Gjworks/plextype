"use client";

import React, { forwardRef, useEffect, useId, useRef } from "react";
import { Check, Minus } from "lucide-react";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  // 일부만 선택된 상태(전체 선택 체크박스 등). checked와 별개로 표시만 바꾼다.
  indeterminate?: boolean;
  error?: string;
}

/**
 * 브라우저 기본 체크박스를 숨기고 같은 자리에 그린 체크박스. 실제 input을 쓰므로 form 전송, 키보드, label 클릭이 그대로 동작한다.
 */
const Checkbox = forwardRef<HTMLInputElement, Props>(
  ({ label, description, indeterminate = false, error, id, className = "", disabled, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const innerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    const setRef = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    return (
      <div className={className}>
        <label
          htmlFor={inputId}
          className={`group inline-flex items-start gap-2.5 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <input
              {...rest}
              ref={setRef}
              id={inputId}
              type="checkbox"
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={error ? `${inputId}-error` : undefined}
              className={`peer absolute inset-0 m-0 cursor-[inherit] appearance-none rounded-[5px] border bg-white transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200/80 checked:border-gray-900 checked:bg-gray-900 indeterminate:border-gray-900 indeterminate:bg-gray-900 dark:bg-dark-800 dark:focus-visible:ring-dark-700/60 dark:checked:border-white dark:checked:bg-white dark:indeterminate:border-white dark:indeterminate:bg-white ${
                error ? "border-red-400 dark:border-red-500/70" : "border-gray-300 group-hover:border-gray-400 dark:border-dark-500 dark:group-hover:border-dark-400"
              }`}
            />
            {indeterminate ? (
              <Minus size={13} strokeWidth={3} className="pointer-events-none relative text-white dark:text-gray-950" />
            ) : (
              <Check
                size={13}
                strokeWidth={3}
                className="pointer-events-none relative hidden text-white peer-checked:block dark:text-gray-950"
              />
            )}
          </span>
          {(label || description) && (
            <span className="min-w-0">
              {label && <span className="block text-sm text-gray-800 dark:text-dark-100">{label}</span>}
              {description && <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-dark-400">{description}</span>}
            </span>
          )}
        </label>
        {error && (
          <div id={`${inputId}-error`} className="mt-1.5 text-xs leading-5 text-red-500">
            {error}
          </div>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;

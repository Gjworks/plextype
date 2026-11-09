"use client";

import React, { forwardRef, useId } from "react";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md";
  // 라벨을 왼쪽에 두고 스위치를 오른쪽 끝에 붙인다. 설정 목록의 한 줄로 쓸 때 사용한다.
  labelPosition?: "right" | "left";
}

const SIZE = {
  sm: { track: "h-5 w-9", knob: "h-4 w-4 peer-checked:translate-x-4" },
  md: { track: "h-6 w-11", knob: "h-5 w-5 peer-checked:translate-x-5" },
};

/**
 * 켜고 끄는 설정용 스위치. checkbox input에 role="switch"를 붙여 form 전송과 키보드(Space)가 그대로 동작한다.
 * 체크되지 않으면 form에 값이 실리지 않는 것도 checkbox와 같다.
 */
const Switch = forwardRef<HTMLInputElement, Props>(
  ({ label, description, size = "md", labelPosition = "right", id, className = "", disabled, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const sizeClass = SIZE[size];

    const control = (
      <span className={`relative inline-flex shrink-0 items-center ${sizeClass.track}`}>
        <input
          {...rest}
          ref={ref}
          id={inputId}
          type="checkbox"
          role="switch"
          disabled={disabled}
          className={`peer absolute inset-0 m-0 cursor-[inherit] appearance-none rounded-full bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200/80 checked:bg-gray-900 dark:bg-dark-700 dark:focus-visible:ring-dark-700/60 dark:checked:bg-white ${sizeClass.track}`}
        />
        <span
          className={`pointer-events-none relative ml-0.5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 dark:bg-dark-200 dark:peer-checked:bg-gray-950 ${sizeClass.knob}`}
        />
      </span>
    );

    const text = (label || description) && (
      <span className="min-w-0 flex-1">
        {label && <span className="block text-sm text-gray-800 dark:text-dark-100">{label}</span>}
        {description && <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-dark-400">{description}</span>}
      </span>
    );

    return (
      <label
        htmlFor={inputId}
        className={`flex items-start gap-3 ${labelPosition === "left" ? "w-full justify-between" : "w-fit"} ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${className}`}
      >
        {labelPosition === "left" ? (
          <>
            {text}
            {control}
          </>
        ) : (
          <>
            {control}
            {text}
          </>
        )}
      </label>
    );
  },
);

Switch.displayName = "Switch";

export default Switch;

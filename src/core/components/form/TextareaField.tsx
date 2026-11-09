"use client";

import React, { forwardRef, useId, useLayoutEffect, useRef, useState } from "react";

import { fieldBoxClass, fieldLabelClass } from "./fieldStyles";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  inputTitle: string;
  hideLabel?: boolean;
  error?: string;
  // 내용에 맞춰 높이를 늘린다. minRows~maxRows 줄 사이에서 움직이고, maxRows를 넘으면 스크롤한다.
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  // maxLength가 있으면 오른쪽 아래에 "현재/최대" 글자 수를 보여준다. false로 숨길 수 있다.
  showCount?: boolean;
}

/**
 * InputField와 같은 톤의 여러 줄 입력.
 */
const TextareaField = forwardRef<HTMLTextAreaElement, Props>((props, ref) => {
  const {
    inputTitle,
    hideLabel = false,
    error,
    autoResize = true,
    minRows = 3,
    maxRows = 12,
    showCount = true,
    id,
    name,
    disabled,
    maxLength,
    value,
    defaultValue,
    onChange,
    className = "",
    ...rest
  } = props;

  const autoId = useId();
  const inputId = id || name || autoId;
  const hasError = !!error;
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const [length, setLength] = useState(String(value ?? defaultValue ?? "").length);

  const setRef = (node: HTMLTextAreaElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const resize = () => {
    const node = innerRef.current;
    if (!node || !autoResize) return;
    const style = window.getComputedStyle(node);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    node.style.height = "auto";
    const height = Math.min(Math.max(node.scrollHeight, lineHeight * minRows + padding), lineHeight * maxRows + padding);
    node.style.height = `${height}px`;
    node.style.overflowY = node.scrollHeight > height ? "auto" : "hidden";
  };

  useLayoutEffect(() => {
    resize();
    if (value !== undefined) setLength(String(value).length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, autoResize, minRows, maxRows]);

  return (
    <div className={`w-full ${className}`}>
      {!hideLabel && (
        <label htmlFor={inputId} className={fieldLabelClass(disabled)}>
          {inputTitle}
        </label>
      )}
      <div className={`${fieldBoxClass({ disabled, hasError })} flex-col !items-stretch`}>
        <textarea
          {...rest}
          ref={setRef}
          id={inputId}
          name={name}
          rows={minRows}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-label={hideLabel ? inputTitle : undefined}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          onChange={(event) => {
            setLength(event.target.value.length);
            resize();
            onChange?.(event);
          }}
          className="scrollbar-subtle w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-black outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-dark-100 dark:placeholder:text-dark-400"
        />
        {showCount && maxLength && (
          <div
            className={`px-3 pb-2 text-right text-xs tabular-nums ${
              length >= maxLength ? "text-red-500" : "text-gray-400 dark:text-dark-400"
            }`}
          >
            {length.toLocaleString()}/{maxLength.toLocaleString()}
          </div>
        )}
      </div>
      {error && (
        <div id={`${inputId}-error`} className="mt-1.5 text-xs leading-5 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
});

TextareaField.displayName = "TextareaField";

export default TextareaField;

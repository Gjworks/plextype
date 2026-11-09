"use client";

import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { useFloatingPlacement } from "@hooks/useFloatingPlacement";
import { fieldBoxClass, fieldIconClass, floatingPanelClass, normalizeSearchText as normalize } from "./fieldStyles";

export interface ComboboxOption {
  value: string;
  label: string;
  // 항목 오른쪽에 보이는 보조 숫자(건수 등)
  count?: number | string;
  disabled?: boolean;
}

interface Props {
  inputTitle: string;
  options: ComboboxOption[];
  name?: string;
  id?: string;
  // 선택된 option의 value. 넘기면 controlled, defaultValue만 넘기면 uncontrolled로 동작한다.
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: ComboboxOption | null) => void;
  // true면 목록에 없는 입력도 값으로 확정한다. false면 포커스를 잃을 때 마지막 선택으로 되돌린다.
  allowCustomValue?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  icon?: React.ReactNode;
  hideLabel?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const LIST_MAX_HEIGHT = 288;

const ComboboxField = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const {
    inputTitle,
    options,
    name,
    id,
    value,
    defaultValue = "",
    onChange,
    allowCustomValue = false,
    placeholder,
    emptyMessage = "일치하는 항목이 없습니다.",
    icon,
    hideLabel = false,
    disabled,
    error,
    className = "",
  } = props;

  const autoId = useId();
  const inputId = id || name || autoId;
  const listId = `${inputId}-listbox`;
  const hasError = !!error;
  const isControlled = value !== undefined;

  const [innerValue, setInnerValue] = useState(defaultValue);
  const selectedValue = isControlled ? value : innerValue;
  const selectedOption =
    options.find((option) => option.value === selectedValue) || null;
  const selectedText =
    selectedOption?.label ?? (allowCustomValue ? selectedValue : "");

  const [open, setOpen] = useState(false);
  const [text, setText] = useState(selectedText);
  // 열자마자는 전체 목록을 보여주고, 사용자가 타이핑한 뒤부터 거른다.
  const [filtering, setFiltering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  // 닫혀 있는 동안에는 외부 값 변경을 입력창에 반영한다.
  useEffect(() => {
    if (!open) setText(selectedText);
  }, [selectedText, open]);

  const visibleOptions = useMemo(() => {
    const keyword = normalize(text);
    if (!filtering || !keyword) return options;
    return options.filter((option) =>
      normalize(option.label).includes(keyword),
    );
  }, [options, text, filtering]);

  // 목록은 body에 fixed로 띄워 부모의 overflow-hidden에 잘리지 않게 하고, 아래 공간이 모자라면 위로 연다.
  const { style: placement } = useFloatingPlacement(fieldRef, open, {
    matchWidth: true,
    maxHeight: LIST_MAX_HEIGHT,
  });

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const item = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const commit = (nextValue: string, option: ComboboxOption | null) => {
    if (!isControlled) setInnerValue(nextValue);
    setText(option?.label ?? nextValue);
    if (nextValue !== selectedValue) onChange?.(nextValue, option);
  };

  const openList = () => {
    if (disabled || open) return;
    // 열 때마다 기존 글자를 전체 선택해 바로 새 검색어를 칠 수 있게 한다.
    inputRef.current?.select();
    setOpen(true);
    setFiltering(false);
    const index = options.findIndex((option) => option.value === selectedValue);
    setActiveIndex(index);
  };

  // 포커스를 잃거나 Esc로 닫을 때 입력값을 정리한다.
  const closeList = (restore: boolean) => {
    setOpen(false);
    setFiltering(false);
    setActiveIndex(-1);
    if (restore) {
      setText(selectedText);
      return;
    }
    const typed = text.trim();
    const exact = options.find(
      (option) =>
        !option.disabled && normalize(option.label) === normalize(typed),
    );
    if (exact) commit(exact.value, exact);
    else if (allowCustomValue) commit(typed, null);
    else setText(selectedText);
  };

  const selectOption = (option: ComboboxOption) => {
    if (option.disabled) return;
    commit(option.value, option);
    setOpen(false);
    setFiltering(false);
    setActiveIndex(-1);
  };

  const moveActive = (step: number) => {
    if (!visibleOptions.length) return;
    let next = activeIndex;
    for (let i = 0; i < visibleOptions.length; i += 1) {
      next = (next + step + visibleOptions.length) % visibleOptions.length;
      if (!visibleOptions[next].disabled) break;
    }
    setActiveIndex(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList();
        else moveActive(-1);
        break;
      case "Enter":
        if (!open) return;
        event.preventDefault();
        if (activeIndex >= 0 && visibleOptions[activeIndex])
          selectOption(visibleOptions[activeIndex]);
        else closeList(false);
        break;
      case "Escape":
        if (!open) return;
        event.preventDefault();
        closeList(true);
        break;
      case "Tab":
        if (open) closeList(false);
        break;
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (open && !rootRef.current?.contains(event.relatedTarget as Node | null))
      closeList(false);
  };

  const containerClass = fieldBoxClass({ disabled, hasError });
  const iconClass = fieldIconClass(disabled);

  return (
    <div ref={rootRef} className={`w-full ${className}`} onBlur={handleBlur}>
      {!hideLabel && (
        <label
          htmlFor={inputId}
          className={`mb-2 block text-sm font-medium ${disabled ? "text-gray-400 dark:text-dark-500" : "text-black dark:text-dark-200"}`}
        >
          {inputTitle}
        </label>
      )}

      <div className="relative">
        <div ref={fieldRef} className={containerClass}>
          {icon && (
            <div className={`pl-3 pr-2 transition-colors ${iconClass}`}>
              {icon}
            </div>
          )}

          <input
            ref={setInputRef}
            id={inputId}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-label={hideLabel ? inputTitle : undefined}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            value={text}
            disabled={disabled}
            placeholder={placeholder || ""}
            onFocus={openList}
            onClick={openList}
            onChange={(event) => {
              setText(event.target.value);
              setFiltering(true);
              setActiveIndex(0);
              if (!open) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-black outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-dark-100 dark:placeholder:text-dark-400 dark:disabled:text-dark-500"
          />

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={open ? "목록 닫기" : "목록 열기"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) closeList(true);
              else {
                inputRef.current?.focus();
                openList();
              }
            }}
            className={`mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:hover:bg-dark-700 ${iconClass}`}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {name && <input type="hidden" name={name} value={selectedValue} />}

        {open &&
          placement &&
          createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={inputTitle}
              style={placement}
              className={`scrollbar-subtle overflow-y-auto p-1.5 ${floatingPanelClass}`}
            >
              {visibleOptions.length === 0 && (
                <li className="px-3 py-2.5 text-sm text-gray-400 dark:text-dark-400">
                  {allowCustomValue && text.trim()
                    ? `"${text.trim()}" 그대로 사용`
                    : emptyMessage}
                </li>
              )}

              {visibleOptions.map((option, index) => {
                const selected = option.value === selectedValue;
                const active = index === activeIndex;
                return (
                  <li
                    key={option.value}
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={option.disabled || undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseMove={() =>
                      !option.disabled &&
                      activeIndex !== index &&
                      setActiveIndex(index)
                    }
                    onClick={() => selectOption(option)}
                    className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                      option.disabled
                        ? "cursor-not-allowed text-gray-300 dark:text-dark-600"
                        : selected
                          ? "font-semibold text-gray-950 dark:text-white"
                          : "text-gray-700 dark:text-dark-200"
                    } ${active && !option.disabled ? "bg-gray-100 dark:bg-dark-800" : selected ? "bg-gray-50 dark:bg-dark-800/60" : ""}`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="shrink-0 text-xs font-normal tabular-nums text-gray-400 dark:text-dark-400">
                        {option.count}
                      </span>
                    )}
                    <Check
                      size={15}
                      className={`shrink-0 ${selected ? "text-gray-900 dark:text-white" : "invisible"}`}
                    />
                  </li>
                );
              })}
            </ul>,
            document.body,
          )}
      </div>

      {error && (
        <div
          id={`${inputId}-error`}
          className="mt-1.5 text-xs leading-5 text-red-500"
        >
          {error}
        </div>
      )}
    </div>
  );
});

ComboboxField.displayName = "ComboboxField";

export default ComboboxField;

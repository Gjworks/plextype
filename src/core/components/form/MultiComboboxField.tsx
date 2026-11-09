"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

import { useFloatingPlacement } from "@hooks/useFloatingPlacement";
import type { ComboboxOption } from "./ComboboxField";
import { fieldBoxClass, fieldLabelClass, floatingPanelClass, normalizeSearchText as normalize } from "./fieldStyles";

interface Props {
  inputTitle: string;
  options: ComboboxOption[];
  // 넘기면 같은 이름의 hidden input을 값마다 하나씩 만들어 form으로 보낸다(FormData.getAll(name)).
  name?: string;
  id?: string;
  // 넘기면 controlled, defaultValue만 넘기면 uncontrolled로 동작한다.
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  // true면 목록에 없는 입력을 Enter로 새 항목(태그)으로 추가한다.
  allowCustomValue?: boolean;
  // 고를 수 있는 최대 개수. 다 차면 목록의 나머지 항목을 막는다.
  max?: number;
  placeholder?: string;
  emptyMessage?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * 여러 값을 골라 칩으로 보여주는 Combobox. 태그, 권한 그룹, 담당자 지정에 쓴다.
 * 고른 항목은 목록을 닫지 않고 계속 고를 수 있고, 빈 입력에서 Backspace를 누르면 마지막 칩을 지운다.
 */
const MultiComboboxField = ({
  inputTitle,
  options,
  name,
  id,
  value,
  defaultValue = [],
  onChange,
  allowCustomValue = false,
  max,
  placeholder,
  emptyMessage = "일치하는 항목이 없습니다.",
  hideLabel = false,
  disabled,
  error,
  className = "",
}: Props) => {
  const autoId = useId();
  const inputId = id || name || autoId;
  const listId = `${inputId}-listbox`;
  const hasError = !!error;
  const isControlled = value !== undefined;

  const [innerValues, setInnerValues] = useState<string[]>(defaultValue);
  const values = isControlled ? value : innerValues;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { style: placement } = useFloatingPlacement(fieldRef, open, { matchWidth: true, maxHeight: 288 });

  const labelOf = (item: string) => options.find((option) => option.value === item)?.label ?? item;
  const full = max !== undefined && values.length >= max;

  const visibleOptions = useMemo(() => {
    const keyword = normalize(text);
    return keyword ? options.filter((option) => normalize(option.label).includes(keyword)) : options;
  }, [options, text]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const update = (next: string[]) => {
    if (!isControlled) setInnerValues(next);
    onChange?.(next);
  };

  const toggle = (item: string) => {
    if (values.includes(item)) update(values.filter((current) => current !== item));
    else if (!full) update([...values, item]);
    setText("");
  };

  const addCustom = () => {
    const typed = text.trim();
    if (!typed || full) return;
    const exact = options.find((option) => normalize(option.label) === normalize(typed));
    const item = exact?.value ?? typed;
    if (!values.includes(item)) update([...values, item]);
    setText("");
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
        if (!open) setOpen(true);
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        moveActive(-1);
        break;
      case "Enter":
        event.preventDefault();
        if (open && activeIndex >= 0 && visibleOptions[activeIndex] && !visibleOptions[activeIndex].disabled) {
          toggle(visibleOptions[activeIndex].value);
        } else if (allowCustomValue) {
          addCustom();
        }
        break;
      case "Backspace":
        if (!text && values.length) update(values.slice(0, -1));
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className={`w-full ${className}`}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
          setActiveIndex(-1);
          if (allowCustomValue) addCustom();
          else setText("");
        }
      }}
    >
      {!hideLabel && (
        <label htmlFor={inputId} className={fieldLabelClass(disabled)}>
          {inputTitle}
        </label>
      )}

      <div
        ref={fieldRef}
        onMouseDown={(event) => {
          if (event.target !== inputRef.current) event.preventDefault();
          inputRef.current?.focus();
          if (!disabled) setOpen(true);
        }}
        className={`${fieldBoxClass({ disabled, hasError })} min-h-[42px] flex-wrap gap-1.5 px-2 py-1.5 ${disabled ? "" : "cursor-text"}`}
      >
        {values.map((item) => (
          <span
            key={item}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-gray-100 py-0.5 pl-2 pr-1 text-xs font-medium text-gray-700 dark:bg-dark-700 dark:text-dark-100"
          >
            <span className="truncate">{labelOf(item)}</span>
            {!disabled && (
              <button
                type="button"
                tabIndex={-1}
                aria-label={`${labelOf(item)} 빼기`}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => update(values.filter((current) => current !== item))}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-800 dark:text-dark-400 dark:hover:bg-dark-600 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-label={hideLabel ? inputTitle : undefined}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          value={text}
          disabled={disabled}
          placeholder={values.length ? "" : placeholder || ""}
          onFocus={() => !disabled && setOpen(true)}
          onChange={(event) => {
            setText(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-1 text-sm text-black outline-none placeholder:text-gray-400 disabled:cursor-not-allowed dark:text-dark-100 dark:placeholder:text-dark-400"
        />
      </div>

      {name && values.map((item) => <input key={item} type="hidden" name={name} value={item} />)}

      {open &&
        placement &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={inputTitle}
            style={placement}
            className={`scrollbar-subtle overflow-y-auto p-1.5 ${floatingPanelClass}`}
          >
            {max !== undefined && (
              <li className="px-3 pb-1.5 pt-1 text-xs text-gray-400 dark:text-dark-400">
                {values.length}/{max}개 선택
              </li>
            )}
            {visibleOptions.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-gray-400 dark:text-dark-400">
                {allowCustomValue && text.trim() ? `Enter로 "${text.trim()}" 추가` : emptyMessage}
              </li>
            )}
            {visibleOptions.map((option, index) => {
              const selected = values.includes(option.value);
              const blocked = option.disabled || (full && !selected);
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={blocked || undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => !blocked && activeIndex !== index && setActiveIndex(index)}
                  onClick={() => !blocked && toggle(option.value)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    blocked ? "cursor-not-allowed text-gray-300 dark:text-dark-600" : "cursor-pointer text-gray-700 dark:text-dark-200"
                  } ${selected ? "font-semibold text-gray-950 dark:text-white" : ""} ${
                    index === activeIndex && !blocked ? "bg-gray-100 dark:bg-dark-800" : ""
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected
                        ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-950"
                        : "border-gray-300 dark:border-dark-500"
                    }`}
                  >
                    {selected && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="shrink-0 text-xs font-normal tabular-nums text-gray-400 dark:text-dark-400">{option.count}</span>
                  )}
                </li>
              );
            })}
          </ul>,
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

export default MultiComboboxField;

"use client";

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useFloatingPlacement } from "@hooks/useFloatingPlacement";

interface Props {
  content: React.ReactNode;
  children: React.ReactNode;
  // 기본으로 띄울 방향. 공간이 모자라면 반대쪽으로 뒤집는다.
  side?: "top" | "bottom";
  // 마우스를 올린 뒤 보이기까지 기다리는 시간(ms). 화면을 훑을 때 툴팁이 마구 뜨지 않게 한다.
  delay?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * 아이콘 버튼처럼 글자가 없는 요소에 짧은 설명을 붙인다. 마우스를 올리거나 키보드로 포커스하면 보이고, Esc로 닫힌다.
 * body에 fixed로 띄우므로 부모의 overflow-hidden에 잘리지 않는다.
 * 터치 기기에서는 hover가 없으므로 꼭 필요한 정보는 툴팁에만 두지 않는다.
 */
const Tooltip = ({ content, children, side = "top", delay = 150, disabled = false, className = "" }: Props) => {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(0);

  const { style } = useFloatingPlacement(anchorRef, open, {
    prefer: side,
    needHeight: 48,
    gap: 6,
    align: "center",
    width,
  });

  useLayoutEffect(() => {
    if (open && bubbleRef.current) setWidth(bubbleRef.current.offsetWidth);
  }, [open, content, style]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const show = () => {
    if (disabled) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setOpen(false);
  };

  return (
    <>
      <span
        ref={anchorRef}
        className={`inline-flex ${className}`}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {open &&
        style &&
        createPortal(
          <div
            ref={bubbleRef}
            id={tooltipId}
            role="tooltip"
            style={style}
            className="pointer-events-none fixed z-[150] max-w-xs rounded-md bg-gray-900 px-2.5 py-1.5 text-xs leading-5 text-white shadow-lg dark:bg-dark-100 dark:text-gray-950"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
};

export default Tooltip;

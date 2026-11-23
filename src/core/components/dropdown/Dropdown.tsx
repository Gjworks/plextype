"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";

interface DropdownProps {
  state: boolean;
  close: (val: boolean) => void;
  children: React.ReactNode;
  /** 기준 요소의 어느 쪽 모서리에 맞출지. 화면 밖으로 넘치면 반대쪽으로 바꾼다. */
  align?: "left" | "right";
  /**
   * 감싸는 요소에 붙일 클래스. 기준 요소와의 간격(`mt-2`, hover로 여는 메뉴라면 틈이 없는 `pt-2`)이나 너비를 정한다.
   * 위치는 직접 계산하므로 `left-0`, `right-0`, `top-full` 같은 위치 클래스는 쓰지 않는다
   * (넘어오면 걸러 내고, `right-0`은 `align="right"`로 해석한다).
   */
  className?: string;
}

// 화면 가장자리와 드롭다운 사이에 남기는 여백(px).
const VIEWPORT_PADDING = 12;

const POSITION_CLASSES = new Set(["left-0", "right-0", "top-full", "left-auto", "right-auto"]);

/**
 * 투명도는 감싸는 요소가 아니라 바로 아래 자식(패널)에게 준다. 감싸는 요소는 CSS 변수만 움직이고,
 * 자식이 그 값을 자기 opacity로 쓴다. 감싸는 요소의 투명도가 1보다 낮으면 Chromium에서는 그 요소가
 * backdrop-filter의 기준 범위가 되어, 패널의 배경 흐림이 열리는 동안 꺼졌다가 끝날 때 갑자기 켜진다.
 */
const variants = {
  open: {
    "--dropdown-opacity": 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] },
  },
  close: {
    "--dropdown-opacity": 0,
    y: 8,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
} as Variants;

/**
 * 기준 요소 아래에 띄우는 메뉴 래퍼. 이 컴포넌트를 둔 자리의 부모 요소가 기준이 된다.
 * 배경·테두리·그림자 같은 패널 모양은 children이 가진다.
 *
 * 메뉴는 body에 그리고 화면 좌표로 고정 배치한다. 기준 요소 안에 그리면 조상의 겹침 맥락과 효과에 갇힌다.
 * 예를 들어 조상에 mix-blend-mode나 opacity가 걸려 있으면 Chromium에서 패널의 backdrop-filter가
 * 그 조상 안쪽만 흐리고, 조상의 overflow에 잘리기도 한다.
 *
 * React 이벤트는 React 트리를 따라 전달되므로, 부모에 건 onMouseEnter/onMouseLeave는 메뉴 위에서도 그대로 동작한다.
 */
const Dropdown = ({ state, close, children, align, className = "mt-2" }: DropdownProps) => {
  const markerRef = useRef<HTMLSpanElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  const classNames = className.split(/\s+/).filter(Boolean);
  const wrapperClassName = classNames.filter((name) => !POSITION_CLASSES.has(name)).join(" ");
  const preferRight = align ? align === "right" : classNames.includes("right-0");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close(false);
      }
    };
    if (state) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [state, close]);

  useLayoutEffect(() => {
    if (!state) return;

    const anchor = markerRef.current?.parentElement;
    const dropdown = dropdownRef.current;
    if (!anchor || !dropdown) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const width = dropdown.offsetWidth;
      const maxLeft = window.innerWidth - VIEWPORT_PADDING - width;
      const leftAligned = rect.left;
      const rightAligned = rect.right - width;

      let left = preferRight ? rightAligned : leftAligned;
      if (!preferRight && leftAligned > maxLeft) left = rightAligned;
      if (preferRight && rightAligned < VIEWPORT_PADDING) left = leftAligned;
      left = Math.max(VIEWPORT_PADDING, Math.min(left, maxLeft));

      const top = rect.bottom;
      setPosition((previous) => (previous?.left === left && previous.top === top ? previous : { left, top }));
    };

    place();
    // 기준 요소가 스크롤되는 영역 안에 있을 수 있으므로 모든 스크롤을 캡처 단계에서 듣는다.
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [state, preferRight, children]);

  return (
    <>
      {/* 기준 요소(부모)를 찾기 위한 표식. 열려 있을 때만 두어 부모의 :last-child 같은 선택자에 끼어들지 않게 한다. */}
      {state && <span ref={markerRef} hidden />}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {state && (
              <motion.div
                ref={dropdownRef}
                initial="close"
                animate="open"
                exit="close"
                variants={variants}
                // 전체 화면 검색(z-120)보다는 아래, 헤더와 본문보다는 위.
                className={`fixed z-[110] *:opacity-[var(--dropdown-opacity)] ${wrapperClassName}`}
                style={{
                  left: position?.left ?? 0,
                  top: position?.top ?? 0,
                  // 위치를 계산하기 전 한 프레임 동안 왼쪽 위 구석에 보이지 않게 한다.
                  visibility: position ? "visible" : "hidden",
                }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export default Dropdown;

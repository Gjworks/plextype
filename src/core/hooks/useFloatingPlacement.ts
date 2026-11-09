"use client";

import { type CSSProperties, type RefObject, useLayoutEffect, useState } from "react";

export type FloatingSide = "bottom" | "top";

export interface FloatingPlacementOptions {
  // 기본으로 열 방향. 그쪽 공간이 needHeight보다 모자라고 반대쪽이 더 넓으면 뒤집는다.
  prefer?: FloatingSide;
  // 뒤집을지 판단할 때 필요한 높이. 목록처럼 높이가 바뀌는 내용은 대표 높이를 넘긴다.
  needHeight?: number;
  // 넘기면 남은 공간에 맞춰 maxHeight를 이 값 이하로 준다. 스크롤 목록에 쓴다.
  maxHeight?: number;
  minHeight?: number;
  gap?: number;
  // true면 기준 요소와 같은 너비로 띄운다.
  matchWidth?: boolean;
  // 기준 요소의 어느 쪽에 맞출지. center는 transform으로 가운데를 맞춘다.
  align?: "start" | "center" | "end";
  // 화면 밖으로 나가지 않게 left를 조정할 때 쓰는 띄울 요소 너비.
  width?: number;
}

const VIEWPORT_MARGIN = 12;

/**
 * 기준 요소 옆에 position: fixed로 띄울 요소의 위치를 계산한다.
 * portal(document.body)과 함께 쓰면 부모의 overflow-hidden이나 쌓임 순서에 잘리지 않는다.
 * 열려 있는 동안 스크롤·창 크기 변경마다 다시 계산하고, 닫히면 null을 돌려준다.
 */
export const useFloatingPlacement = (
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  options: FloatingPlacementOptions = {},
): { style: CSSProperties | null; side: FloatingSide } => {
  const {
    prefer = "bottom",
    needHeight = 240,
    maxHeight,
    minHeight = 120,
    gap = 8,
    matchWidth = false,
    align = "start",
    width,
  } = options;
  const [state, setState] = useState<{ style: CSSProperties | null; side: FloatingSide }>({
    style: null,
    side: prefer,
  });

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const below = window.innerHeight - rect.bottom - gap - VIEWPORT_MARGIN;
      const above = rect.top - gap - VIEWPORT_MARGIN;
      const preferSpace = prefer === "bottom" ? below : above;
      const otherSpace = prefer === "bottom" ? above : below;
      const side: FloatingSide =
        preferSpace < needHeight && otherSpace > preferSpace ? (prefer === "bottom" ? "top" : "bottom") : prefer;

      const style: CSSProperties =
        side === "top" ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap };

      if (maxHeight) {
        const space = side === "top" ? above : below;
        style.maxHeight = Math.max(minHeight, Math.min(maxHeight, Math.floor(space)));
      }

      if (matchWidth) {
        style.left = rect.left;
        style.width = rect.width;
      } else if (align === "center") {
        const half = (width ?? 0) / 2;
        const center = rect.left + rect.width / 2;
        style.left = Math.min(Math.max(center, VIEWPORT_MARGIN + half), viewportWidth - VIEWPORT_MARGIN - half);
        style.transform = "translateX(-50%)";
      } else {
        const floatingWidth = width ?? 0;
        const left = align === "end" ? rect.right - floatingWidth : rect.left;
        style.left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportWidth - VIEWPORT_MARGIN - floatingWidth));
      }

      setState({ style, side });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      setState({ style: null, side: prefer });
    };
  }, [anchorRef, open, prefer, needHeight, maxHeight, minHeight, gap, matchWidth, align, width]);

  return state;
};

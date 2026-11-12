"use client";

// 테마를 바꾸는 DOM 변경(apply)을 View Transition 안에서 실행해, 새 테마 화면이 가운데에서 원형으로 번지며 드러나게 한다.
// 애니메이션 모양은 globals.css의 theme-reveal 규칙에 있고, html[data-theme-transition]이 붙은 동안에만 적용된다.
// 사용자가 테마 버튼을 눌렀을 때만 쓴다. 저장된 설정을 불러와 맞추는 경우는 apply를 바로 호출한다.
// View Transitions를 지원하지 않는 브라우저, 숨겨진 탭, 움직임 줄이기(OS 설정, data-motion="reduced")에서는 애니메이션 없이 바로 바꾼다.

let activeTransition: ViewTransition | null = null;
// 아직 실행되지 않은 마지막 apply. 전환이 겹치면 건너뛴 전환의 콜백이 나중에 실행될 수 있으므로,
// 콜백은 저장된 apply를 꺼내 한 번만 실행하고 가장 최근 클릭의 테마만 적용되게 한다.
let pendingApply: (() => void) | null = null;

// 전환 화면이 클릭을 가로채지 않게 해, 애니메이션 중에도 테마 버튼을 다시 누를 수 있게 한다.
// Next 빌드의 CSS 처리가 인자 없는 ::view-transition 규칙을 지우므로 globals.css 대신 실행 중에 넣는다.
const POINTER_STYLE_ID = "theme-transition-pointer";
const ensurePointerStyle = () => {
  if (document.getElementById(POINTER_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = POINTER_STYLE_ID;
  style.textContent = "html[data-theme-transition]::view-transition{pointer-events:none}";
  document.head.appendChild(style);
};

const flushPendingApply = () => {
  const apply = pendingApply;
  pendingApply = null;
  apply?.();
};

export const runThemeTransition = (apply: () => void) => {
  const root = document.documentElement;
  const reduceMotion = root.dataset.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  pendingApply = apply;

  // 앞선 전환이 진행 중이면 애니메이션을 겹치지 않고 끝낸 뒤 바로 바꾼다.
  if (activeTransition || typeof document.startViewTransition !== "function" || reduceMotion || document.hidden) {
    activeTransition?.skipTransition();
    flushPendingApply();
    return;
  }

  ensurePointerStyle();
  root.dataset.themeTransition = "";
  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(flushPendingApply);
  } catch {
    delete root.dataset.themeTransition;
    flushPendingApply();
    return;
  }

  activeTransition = transition;
  // 건너뛴 전환의 ready는 거부되므로 처리되지 않은 Promise 오류가 남지 않게 받는다.
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    if (activeTransition !== transition) return;
    activeTransition = null;
    delete root.dataset.themeTransition;
  });
};

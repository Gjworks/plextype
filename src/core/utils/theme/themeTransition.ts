"use client";

// 테마를 바꾸는 DOM 변경(apply)을 View Transition 안에서 실행해, 새 테마 화면이 가운데에서 원형으로 번지며 드러나게 한다.
// 애니메이션 모양은 globals.css의 theme-reveal 규칙에 있고, html[data-theme-transition]이 붙은 동안에만 적용된다.
// 사용자가 테마 버튼을 눌렀을 때만 쓴다. 저장된 설정을 불러와 맞추는 경우는 apply를 바로 호출한다.
// View Transitions를 지원하지 않는 브라우저나 움직임 줄이기(OS 설정, data-motion="reduced")에서는 애니메이션 없이 바로 바꾼다.
export const runThemeTransition = (apply: () => void) => {
  const root = document.documentElement;
  const reduceMotion = root.dataset.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof document.startViewTransition !== "function" || reduceMotion) {
    apply();
    return;
  }

  root.dataset.themeTransition = "";
  const transition = document.startViewTransition(apply);
  transition.finished.finally(() => {
    delete root.dataset.themeTransition;
  });
};

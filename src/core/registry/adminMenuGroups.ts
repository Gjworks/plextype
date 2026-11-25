import type { AdminMenuItem } from "@/core/registry/adminRegistry";

// 패키지와 프로젝트 확장이 만든 관리자 메뉴(extension)는 사이드바에 하나씩 늘어놓지 않고 "확장 기능" 메뉴 하나 아래에 모은다.
// 확장이 늘어도 사이드바가 길어지지 않게 하기 위함이다. 관리자 레이아웃이 이 파일로 메뉴를 나눠 그린다.

export const EXTENSION_MENU_LABEL = "확장 기능";

// "확장 기능" 메뉴가 놓일 자리. 쉬운 설치(order 60) 바로 아래다. 확장을 설치하는 메뉴 옆에 설치된 확장의 메뉴를 둔다.
export const EXTENSION_MENU_ORDER = 61;

// order가 없는 메뉴는 레지스트리를 합칠 때와 같이 뒤쪽으로 본다(build.ts).
const orderOf = (menu: AdminMenuItem) => menu.order ?? 999;

// 코어 메뉴를 "확장 기능" 메뉴의 앞과 뒤로 나누고, 그 아래에 들어갈 확장 메뉴를 따로 돌려준다.
export function groupAdminMenus(menus: AdminMenuItem[]) {
  const core = menus.filter((menu) => !menu.extension);
  const at = core.findIndex((menu) => orderOf(menu) > EXTENSION_MENU_ORDER);
  const index = at === -1 ? core.length : at;
  return {
    before: core.slice(0, index),
    extensions: menus.filter((menu) => menu.extension),
    after: core.slice(index),
  };
}

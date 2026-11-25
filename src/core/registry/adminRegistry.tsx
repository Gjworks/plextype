import type React from "react";

import { buildExtensionRegistry } from "@/core/registry/build";
import { coreRegistry } from "@/core/registry/coreRegistry";

export type AdminMenuChild = {
  order?: number;
  label: string;
  href: string;
};

export type AdminMenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  items?: AdminMenuChild[];
  order?: number;
  // 코어가 아닌 곳(쉬운 설치 패키지, 프로젝트 확장)이 만든 메뉴인지. 레지스트리를 합칠 때 채워지므로 등록하는 쪽은 적지 않는다.
  // 사이드바는 이 메뉴들을 "확장 기능" 메뉴 하나 아래에 모아, 확장이 늘어도 길어지지 않게 한다(adminMenuGroups.ts).
  // 코어 메뉴(예: 설정)에 하위 항목만 더하는 경우는 해당하지 않는다. 그 항목은 코어 메뉴 안에 그대로 들어간다.
  extension?: boolean;
};

export type AdminBreadcrumbRegistry = Record<string, Record<string, string>>;

const {
  adminMenus: defaultAdminMenus,
  adminBreadcrumbs: defaultAdminBreadcrumbs,
} = buildExtensionRegistry(coreRegistry);

export const getAdminMenuRegistry = (): AdminMenuItem[] => {
  return defaultAdminMenus;
};

export const getAdminBreadcrumbRegistry = (): AdminBreadcrumbRegistry => {
  return defaultAdminBreadcrumbs;
};

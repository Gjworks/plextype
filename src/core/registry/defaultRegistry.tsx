import type React from "react";

import AuthLayout from "@/layouts/auth/Layout";
import DefaultLayout from "@/layouts/default/Layout";
import HomePage from "@/core/registry/defaultHomePage";
import { buildExtensionRegistry } from "@/core/registry/build";
import { coreRegistry } from "@/core/registry/coreRegistry";

export type PostSkinMap = Record<string, React.ComponentType<any>>;
export type PostLayoutMap = Record<string, React.ComponentType<any>>;
export type AdminLayoutMap = Record<string, React.ComponentType<any>>;
export type AdminDashboardMap = Record<string, React.ComponentType<any>>;
export type UserLayoutComponents = {
  timeline: React.ComponentType<any>;
  update: React.ComponentType<any>;
  preferences: React.ComponentType<any>;
  delete: React.ComponentType<any>;
  authLayout?: React.ComponentType<any>;
  signin?: React.ComponentType<any>;
  register?: React.ComponentType<any>;
  resetPassword?: React.ComponentType<any>;
  // true면 signin·register 화면이 넘겨받은 loginProviders(다른 로그인 수단의 버튼)를 직접 원하는 자리에 놓는다.
  // 버튼 모양까지 바꾸려면 함께 넘어오는 loginProviderList(LoginProvider[])로 직접 그린다.
  // 아니면 코어가 화면 바로 아래에 놓는다. 스킨이 이 속성을 모르더라도 설치한 로그인 수단이 빠지지 않게 하기 위함이다.
  placesLoginProviders?: boolean;
  // 마이페이지의 틀(메뉴, 제목 자리). 쉬운 설치 패키지의 회원 화면이 getUserPageFrame으로 받아 자기 내용을 감싼다.
  // 없으면 패키지 화면은 틀 없이 그려진다. 받는 속성은 UserPageFrameProps다.
  pageFrame?: React.ComponentType<UserPageFrameProps>;
};
export type UserPageFrameProps = {
  // 지금 화면의 경로(예: "/user/social-login"). 틀이 자기 메뉴에서 같은 주소의 항목을 선택된 모양으로 그린다.
  path: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};
export type UserLayoutMap = Record<string, UserLayoutComponents>;
// 바꿔 끼운 패키지 화면. key는 ViewRegistration(define.ts)의 key다.
export type ViewMap = Record<string, React.ComponentType<any>>;
export type AdminLayoutOption = {
  key: string;
  label: string;
  description: string;
};
export type UserLayoutOption = {
  key: string;
  label: string;
  description: string;
};
export type PostSkinOption = {
  key: string;
  label: string;
  description: string;
};
export type PostLayoutOption = {
  key: string;
  label: string;
  description: string;
};

export const {
  postSkins,
  postReadSkins,
  postWriteSkins,
  postCommentSkins,
  postTocSkins,
  postCommentPlacingSkins,
  postLayouts,
  adminLayouts,
  adminDashboards,
  userLayouts,
  views,
  adminMenus,
  adminBreadcrumbs,
  postSkinOptions,
  postCommentSkinOptions,
  postLayoutOptions,
  adminLayoutOptions,
  userLayoutOptions,
} = buildExtensionRegistry(coreRegistry);

export const AdminLayout = adminLayouts.default;

export { AuthLayout, DefaultLayout, HomePage };

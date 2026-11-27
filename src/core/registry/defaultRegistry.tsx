import type React from "react";

import AuthLayout from "@/layouts/auth/Layout";
import DefaultLayout from "@/layouts/default/Layout";
import HomePage from "@/core/registry/defaultHomePage";
import { buildExtensionRegistry } from "@/core/registry/build";
import { coreRegistry } from "@/core/registry/coreRegistry";
import type { SocialLoginMessageViewProps, SocialLoginUserLinksViewProps } from "@/modules/user/actions/social.type";

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
  // 소셜 계정 연결·해제 화면(/user/social-login). 등록하면 메뉴와 제목까지 이 컴포넌트가 직접 그린다.
  // 생략하면 기본 화면이 이 스킨의 pageFrame 안에 그려진다.
  socialLoginLinks?: React.ComponentType<SocialLoginUserLinksViewProps>;
  // 소셜 로그인이 중간에 끝났을 때의 안내 화면(/auth/social-login). authLayout 안에 그려진다. 생략하면 기본 화면을 쓴다.
  socialLoginMessage?: React.ComponentType<SocialLoginMessageViewProps>;
  // 마이페이지의 틀(메뉴, 제목 자리). 스킨이 그리지 않는 회원 화면(소셜 로그인 연결의 기본 화면, 쉬운 설치 패키지의 화면)이 getUserPageFrame으로 받아 자기 내용을 감싼다.
  // 없으면 그 화면은 틀 없이 그려진다. 받는 속성은 UserPageFrameProps다.
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

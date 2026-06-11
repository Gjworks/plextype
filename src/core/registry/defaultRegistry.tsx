import type React from "react";

import AdminLayout from "@/layouts/admin/default/AdminLayout";
import AdminDashboard from "@/layouts/admin/default/Dashboard";
import AuthLayout from "@/layouts/auth/Layout";
import DefaultLayout from "@/layouts/default/Layout";
import HomePage from "@/core/registry/defaultHomePage";
import DefaultPostLayout from "@/modules/posts/tpl/default/layout";
import UserTimeline from "@/modules/user/tpl/default/timeline";
import UserUpdate from "@/modules/user/tpl/default/update";
import UserPreferences from "@/modules/user/tpl/default/preferences";
import UserDelete from "@/modules/user/tpl/default/delete";

export type PostSkinMap = Record<string, React.ComponentType<any>>;
export type PostLayoutMap = Record<string, React.ComponentType<any>>;
export type AdminLayoutMap = Record<string, React.ComponentType<any>>;
export type AdminDashboardMap = Record<string, React.ComponentType<any>>;
export type UserLayoutComponents = {
  timeline: React.ComponentType<any>;
  update: React.ComponentType<any>;
  preferences: React.ComponentType<any>;
  delete: React.ComponentType<any>;
};
export type UserLayoutMap = Record<string, UserLayoutComponents>;
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

export const postSkins: PostSkinMap = {};
export const postLayouts: PostLayoutMap = {
  default: DefaultPostLayout,
};
export const adminLayouts: AdminLayoutMap = {
  default: AdminLayout,
};
export const adminDashboards: AdminDashboardMap = {
  default: AdminDashboard,
};
export const userLayouts: UserLayoutMap = {
  default: {
    timeline: UserTimeline,
    update: UserUpdate,
    preferences: UserPreferences,
    delete: UserDelete,
  },
};
export const adminLayoutOptions: AdminLayoutOption[] = [
  {
    key: "default",
    label: "기본 관리자",
    description: "Plextype 배포판에 포함되는 안정적인 기본 관리자 화면입니다.",
  },
];
export const userLayoutOptions: UserLayoutOption[] = [
  {
    key: "default",
    label: "기본 사용자",
    description: "Plextype 배포판에 포함되는 기본 사용자 화면입니다.",
  },
];
export const postSkinOptions: PostSkinOption[] = [
  {
    key: "default",
    label: "기본 목록",
    description: "Plextype 기본 게시판 목록 스킨입니다.",
  },
];
export const postLayoutOptions: PostLayoutOption[] = [
  {
    key: "default",
    label: "기본 게시판",
    description: "게시판 콘텐츠를 기본 폭과 간격으로 감싸는 기본 레이아웃입니다.",
  },
];

export { AdminLayout, AuthLayout, DefaultLayout, HomePage };

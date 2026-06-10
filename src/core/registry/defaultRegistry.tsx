import type React from "react";

import AdminLayout from "@/layouts/admin/default/AdminLayout";
import AdminDashboard from "@/layouts/admin/default/Dashboard";
import AuthLayout from "@/layouts/auth/Layout";
import DefaultLayout from "@/layouts/default/Layout";
import HomePage from "@/core/registry/defaultHomePage";

export type PostSkinMap = Record<string, React.ComponentType<any>>;
export type AdminLayoutMap = Record<string, React.ComponentType<any>>;
export type AdminDashboardMap = Record<string, React.ComponentType<any>>;
export type AdminLayoutOption = {
  key: string;
  label: string;
  description: string;
};

export const postSkins: PostSkinMap = {};
export const adminLayouts: AdminLayoutMap = {
  default: AdminLayout,
};
export const adminDashboards: AdminDashboardMap = {
  default: AdminDashboard,
};
export const adminLayoutOptions: AdminLayoutOption[] = [
  {
    key: "default",
    label: "기본 관리자",
    description: "Plextype 배포판에 포함되는 안정적인 기본 관리자 화면입니다.",
  },
];

export { AdminLayout, AuthLayout, DefaultLayout, HomePage };

import type React from "react";

import ProjectAdminLayout from "./layouts/admin/AdminLayout";
import ProjectAdminDashboard from "./admin/Dashboard";
import DefaultAdminLayout from "@/layouts/admin/default/AdminLayout";
import DefaultAdminDashboard from "@/layouts/admin/default/Dashboard";
import type { AdminDashboardMap, AdminLayoutMap, AdminLayoutOption } from "@/core/registry/defaultRegistry";
import AuthLayout from "./layouts/authLayout/Layout";
import DefaultLayout from "./layouts/default/Layout";
import HomePage from "./pages/MainIntro";
import IssueTrackerListSkin from "./posts/tpl/issuetracker/list";

export type PostSkinMap = Record<string, React.ComponentType<any>>;

export const postSkins: PostSkinMap = {
  issuetracker: IssueTrackerListSkin,
};

export const adminLayouts: AdminLayoutMap = {
  project: ProjectAdminLayout,
  default: DefaultAdminLayout,
};

export const adminDashboards: AdminDashboardMap = {
  project: ProjectAdminDashboard,
  default: DefaultAdminDashboard,
};

export const adminLayoutOptions: AdminLayoutOption[] = [
  {
    key: "project",
    label: "Gjworks 관리자",
    description: "현재 gjworks 프로젝트에서 사용하는 개인 맞춤 관리자 화면입니다.",
  },
  {
    key: "default",
    label: "기본 관리자",
    description: "Plextype 배포판에 포함되는 기본 관리자 화면입니다.",
  },
];

const AdminLayout = process.env.NEXT_PUBLIC_ADMIN_LAYOUT === "default" ? DefaultAdminLayout : ProjectAdminLayout;

export { AdminLayout, AuthLayout, DefaultLayout, HomePage };

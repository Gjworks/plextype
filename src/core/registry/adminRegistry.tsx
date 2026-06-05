import type React from "react";

import { adminAdminBreadcrumbs, adminAdminMenus } from "@/modules/admin/admin.registry";
import { postsAdminBreadcrumbs, postsAdminMenus } from "@/modules/posts/admin.registry";
import { userAdminBreadcrumbs, userAdminMenus } from "@/modules/user/admin.registry";

export type AdminMenuChild = {
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
};

export type AdminBreadcrumbRegistry = Record<string, Record<string, string>>;

const defaultAdminMenus: AdminMenuItem[] = [
  ...adminAdminMenus,
  ...userAdminMenus,
  ...postsAdminMenus,
];

const defaultAdminBreadcrumbs: AdminBreadcrumbRegistry = {
  ...adminAdminBreadcrumbs,
  ...userAdminBreadcrumbs,
  ...postsAdminBreadcrumbs,
};

export const getAdminMenuRegistry = (): AdminMenuItem[] => {
  return [...defaultAdminMenus].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
};

export const getAdminBreadcrumbRegistry = (): AdminBreadcrumbRegistry => {
  return defaultAdminBreadcrumbs;
};

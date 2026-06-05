import { Users } from "lucide-react";

import type { AdminBreadcrumbRegistry, AdminMenuItem } from "@/core/registry/adminRegistry";

export const userAdminMenus: AdminMenuItem[] = [
  {
    id: "users",
    icon: <Users size={18} />,
    label: "회원 설정",
    order: 20,
    items: [
      { label: "회원 목록", href: "/admin/user/list" },
      { label: "가입 대기 회원", href: "/admin/user/pending" },
      { label: "로그인 잠금", href: "/admin/user/login-locks" },
      { label: "회원 추가", href: "/admin/user/create" },
      { label: "회원 그룹 관리", href: "/admin/user/groupList" },
    ],
  },
];

export const userAdminBreadcrumbs: AdminBreadcrumbRegistry = {
  user: {
    list: "LIST",
    create: "CREATE",
    groupList: "GROUPS",
    pending: "PENDING",
    "login-locks": "LOGIN LOCKS",
    update: "UPDATE",
    active: "ACTIVE",
  },
};

import { MessageSquareText } from "lucide-react";

import type { AdminBreadcrumbRegistry, AdminMenuItem } from "@/core/registry/adminRegistry";

export const postsAdminMenus: AdminMenuItem[] = [
  {
    id: "posts",
    icon: <MessageSquareText size={18} />,
    label: "게시판 설정",
    order: 30,
    items: [
      { label: "게시판 목록", href: "/admin/posts/list" },
      { label: "게시판 생성", href: "/admin/posts/create" },
    ],
  },
];

export const postsAdminBreadcrumbs: AdminBreadcrumbRegistry = {
  posts: {
    list: "LIST",
    create: "CREATE",
    update: "INFO",
    categories: "CATEGORIES",
    extraField: "EXTRA FIELD",
  },
};

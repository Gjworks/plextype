import { MessageSquareText } from "lucide-react";

import { defineModule, definePostLayout, definePostSkin } from "@/core/registry/define";
import DefaultPostLayout from "@/modules/posts/tpl/default/layout";

export const postsModule = defineModule({
  key: "posts",
  label: "게시판",
  description: "게시판 목록, 본문, 댓글, 쓰기 화면과 관리자 게시판 설정을 제공합니다.",
  admin: {
    menu: {
      id: "posts",
      icon: <MessageSquareText size={18} />,
      label: "게시판 설정",
      order: 30,
      items: [
        { label: "게시판 목록", href: "/admin/posts/list" },
        { label: "게시판 생성", href: "/admin/posts/create" },
      ],
    },
    breadcrumbs: {
      posts: {
        list: "LIST",
        create: "CREATE",
        update: "INFO",
        categories: "CATEGORIES",
        extraField: "EXTRA FIELD",
      },
    },
  },
  postSkins: [
    definePostSkin({
      key: "default",
      label: "기본",
      description: "번호·제목·글쓴이·날짜·조회 열을 가진 표 형태의 Plextype 기본 게시판 스킨입니다.",
    }),
  ],
  postLayouts: [
    definePostLayout({
      key: "default",
      label: "기본 게시판",
      description: "게시판 콘텐츠를 기본 폭과 간격으로 감싸는 기본 레이아웃입니다.",
      component: DefaultPostLayout,
    }),
  ],
});

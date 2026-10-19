import { FileText, Settings } from "lucide-react";
import { defineModule } from "@/core/registry/define";

export const commentModule = defineModule({
  key: "comment",
  label: "댓글 관리",
  description: "댓글 관리 관리자 기능",
  admin: {
    menu: [
      {
        id: "content",
        icon: <FileText size={18} />,
        label: "콘텐츠 관리",
        order: 40,
        items: [
          { label: "댓글 관리", href: "/admin/content/comments", order: 20 },
        ],
      },
    ],
    breadcrumbs: { content: { comments: "COMMENTS" } },
  },
});

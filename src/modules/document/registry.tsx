import { FileText, Settings } from "lucide-react";
import { defineModule } from "@/core/registry/define";

export const documentModule = defineModule({
  key: "document",
  label: "전체 게시글",
  description: "전체 게시글 관리자 기능",
  admin: {
    menu: [
      {
        id: "content",
        icon: <FileText size={18} />,
        label: "콘텐츠 관리",
        order: 40,
        items: [
          { label: "전체 게시글", href: "/admin/content/documents", order: 10 },
        ],
      },
    ],
    breadcrumbs: { content: { documents: "DOCUMENTS" } },
  },
});

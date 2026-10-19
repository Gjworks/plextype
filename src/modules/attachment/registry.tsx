import { FileText, Settings } from "lucide-react";
import { defineModule } from "@/core/registry/define";

export const attachmentModule = defineModule({
  key: "attachment",
  label: "첨부파일 관리",
  description: "첨부파일 관리 관리자 기능",
  admin: {
    menu: [
      {
        id: "content",
        icon: <FileText size={18} />,
        label: "콘텐츠 관리",
        order: 40,
        items: [
          {
            label: "첨부파일 관리",
            href: "/admin/content/attachments",
            order: 30,
          },
        ],
      },
      {
        id: "settings",
        icon: <Settings size={18} />,
        label: "Settings",
        order: 9999,
        items: [
          { label: "업로드 설정", href: "/admin/settings/upload", order: 50 },
        ],
      },
    ],
    breadcrumbs: {
      content: { attachments: "ATTACHMENTS" },
      settings: { upload: "UPLOAD" },
    },
  },
});

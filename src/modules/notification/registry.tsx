import { Bell, Settings } from "lucide-react";
import { defineModule } from "@/core/registry/define";

export const notificationModule = defineModule({
  key: "notification",
  label: "알림 관리",
  description: "회원과 그룹 대상 알림 발송 및 이력 관리",
  admin: {
    menu: [
      {
        id: "notification",
        label: "알림 관리",
        icon: <Bell size={18} />,
        order: 45,
        items: [
          { label: "메시지 발송", href: "/admin/notification" },
          { label: "발송 내역", href: "/admin/notification/history" },
        ],
      },
      {
        id: "settings",
        icon: <Settings size={18} />,
        label: "Settings",
        order: 9999,
        items: [
          {
            label: "알림 설정",
            href: "/admin/settings/notification",
            order: 60,
          },
        ],
      },
    ],
    breadcrumbs: {
      notification: { index: "알림 관리", history: "발송 내역" },
      settings: { notification: "NOTIFICATION" },
    },
  },
});

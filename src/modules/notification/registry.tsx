import { Bell } from "lucide-react";
import { defineModule } from "@/core/registry/define";

export const notificationModule = defineModule({
  key: "notification",
  label: "알림 관리",
  description: "회원과 그룹 대상 알림 발송 및 이력 관리",
  admin: {
    menu: { id: "notification", label: "알림 관리", icon: <Bell size={18} />, order: 45, items: [
      { label: "메시지 발송", href: "/admin/notification" },
      { label: "발송 내역", href: "/admin/notification/history" },
    ] },
    breadcrumbs: { notification: { index: "알림 관리", history: "발송 내역" } },
  },
});

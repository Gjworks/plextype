import { PackageOpen } from "lucide-react";
import { defineModule } from "@/core/registry/define";

export const installerModule = defineModule({
  key: "installer",
  label: "쉬운 설치",
  description: "Store 연결 및 확장 패키지 설치 관리를 제공합니다.",
  admin: {
    menu: {
      id: "installer",
      label: "쉬운 설치",
      icon: <PackageOpen size={18} />,
      order: 60,
      items: [
        { label: "Store 자료", href: "/admin/installer" },
        { label: "구매한 자료", href: "/admin/installer/purchases" },
        { label: "설치된 패키지", href: "/admin/installer/installed" },
        { label: "연결 관리", href: "/admin/installer/connection" },
      ],
    },
    breadcrumbs: { installer: { index: "쉬운 설치", purchases: "구매한 자료", installed: "설치된 패키지", connection: "연결 관리" } },
  },
});

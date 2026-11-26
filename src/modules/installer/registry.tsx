import { PackageOpen } from "lucide-react";
import { defineModule } from "@/core/registry/define";

export const installerModule = defineModule({
  key: "installer",
  label: "쉬운 설치",
  description: "Store 연결, 확장 패키지 설치, 코어 업데이트를 제공합니다.",
  admin: {
    menu: {
      id: "installer",
      label: "쉬운 설치",
      icon: <PackageOpen size={18} />,
      order: 60,
      items: [
        { label: "Store 자료", href: "/admin/installer" },
        { label: "설치된 패키지", href: "/admin/installer/installed" },
        { label: "코어 업데이트", href: "/admin/installer/core" },
        { label: "연결 관리", href: "/admin/installer/connection" },
      ],
    },
    breadcrumbs: { installer: { index: "쉬운 설치", installed: "설치된 패키지", core: "코어 업데이트", connection: "연결 관리" } },
  },
});

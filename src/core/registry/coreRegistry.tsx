import { documentModule } from "@/modules/document/registry";
import { commentModule } from "@/modules/comment/registry";
import { attachmentModule } from "@/modules/attachment/registry";
import { defineExtensionRegistry } from "@/core/registry/define";
import { adminModule } from "@/modules/admin/registry";
import { postsModule } from "@/modules/posts/registry";
import { userModule } from "@/modules/user/registry";
import { installerModule } from "@/modules/installer/registry";
import { notificationModule } from "@/modules/notification/registry";
import { installedPackages } from "@/packages";

// 코어 모듈 뒤에 쉬운 설치로 넣은 패키지(src/packages)의 등록을 이어 붙인다.
// 이 값을 쓰는 곳은 모두 패키지의 관리자 메뉴와 스킨을 함께 받으므로, 설치한 뒤 따로 등록할 것이 없다.
// 프로젝트의 확장(src/extensions/registry.tsx)은 이 뒤에 합쳐져 같은 key를 덮어쓴다.
export const coreRegistry = defineExtensionRegistry({
  modules: [
    adminModule,
    userModule,
    postsModule,
    documentModule,
    commentModule,
    attachmentModule,
    installerModule,
    notificationModule,
    ...installedPackages.flatMap((item) => item.modules ?? []),
  ],
  postSkins: installedPackages.flatMap((item) => item.postSkins ?? []),
  postLayouts: installedPackages.flatMap((item) => item.postLayouts ?? []),
  adminLayouts: installedPackages.flatMap((item) => item.adminLayouts ?? []),
  userSkins: installedPackages.flatMap((item) => item.userSkins ?? []),
});

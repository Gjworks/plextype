import { defineExtensionRegistry } from "@/core/registry/define";
import { adminModule } from "@/modules/admin/registry";
import { postsModule } from "@/modules/posts/registry";
import { userModule } from "@/modules/user/registry";
import { installerModule } from "@/modules/installer/registry";

export const coreRegistry = defineExtensionRegistry({
  modules: [
    adminModule,
    userModule,
    postsModule,
    installerModule,
  ],
});

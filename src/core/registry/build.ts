import type {
  AdminDashboardMap,
  AdminLayoutMap,
  AdminLayoutOption,
  PostLayoutMap,
  PostLayoutOption,
  PostSkinMap,
  PostSkinOption,
  UserLayoutMap,
  UserLayoutOption,
} from "@/core/registry/defaultRegistry";
import type {
  ExtensionRegistryConfig,
  RegistryOption,
} from "@/core/registry/define";

const toOption = <T extends RegistryOption>({ key, label, description }: T) => ({
  key,
  label,
  description,
});

export const buildExtensionRegistry = (registry: ExtensionRegistryConfig) => {
  const postSkins: PostSkinMap = {};
  const postLayouts: PostLayoutMap = {};
  const adminLayouts: AdminLayoutMap = {};
  const adminDashboards: AdminDashboardMap = {};
  const userLayouts: UserLayoutMap = {};

  registry.postSkins?.forEach((item) => {
    if (item.list) postSkins[item.key] = item.list;
  });

  registry.postLayouts?.forEach((item) => {
    postLayouts[item.key] = item.component;
  });

  registry.adminLayouts?.forEach((item) => {
    adminLayouts[item.key] = item.component;
    if (item.dashboard) adminDashboards[item.key] = item.dashboard;
  });

  registry.userSkins?.forEach((item) => {
    userLayouts[item.key] = {
      timeline: item.timeline,
      update: item.update,
      preferences: item.preferences,
      delete: item.delete,
    };
  });

  return {
    postSkins,
    postLayouts,
    adminLayouts,
    adminDashboards,
    userLayouts,
    postSkinOptions: (registry.postSkins || []).map(toOption) as PostSkinOption[],
    postLayoutOptions: (registry.postLayouts || []).map(toOption) as PostLayoutOption[],
    adminLayoutOptions: (registry.adminLayouts || []).map(toOption) as AdminLayoutOption[],
    userLayoutOptions: (registry.userSkins || []).map(toOption) as UserLayoutOption[],
  };
};

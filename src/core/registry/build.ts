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
import type {
  AdminBreadcrumbRegistry,
  AdminMenuItem,
} from "@/core/registry/adminRegistry";

const toOption = <T extends RegistryOption>({
  key,
  label,
  description,
}: T) => ({
  key,
  label,
  description,
});

export const buildExtensionRegistry = (
  ...registries: ExtensionRegistryConfig[]
) => {
  const postSkins: PostSkinMap = {};
  const postReadSkins: PostSkinMap = {};
  const postWriteSkins: PostSkinMap = {};
  const postCommentSkins: PostSkinMap = {};
  // 댓글 화면을 가진 스킨의 선택 항목. 같은 댓글 화면을 여러 스킨이 함께 쓰면 먼저 등록한 것만 보여준다.
  const postCommentSkinOptions: PostSkinOption[] = [];
  const listedCommentSkins = new Set<unknown>();
  const postTocSkins: string[] = [];
  const postCommentPlacingSkins: string[] = [];
  const postLayouts: PostLayoutMap = {};
  const adminLayouts: AdminLayoutMap = {};
  const adminDashboards: AdminDashboardMap = {};
  const userLayouts: UserLayoutMap = {};
  const adminMenus: AdminMenuItem[] = [];
  const adminBreadcrumbs: AdminBreadcrumbRegistry = {};
  const postSkinOptions = new Map<string, PostSkinOption>();
  const postLayoutOptions = new Map<string, PostLayoutOption>();
  const adminLayoutOptions = new Map<string, AdminLayoutOption>();
  const userLayoutOptions = new Map<string, UserLayoutOption>();

  const appendBreadcrumbs = (breadcrumbs?: AdminBreadcrumbRegistry) => {
    if (!breadcrumbs) return;

    Object.entries(breadcrumbs).forEach(([section, labels]) => {
      adminBreadcrumbs[section] = {
        ...(adminBreadcrumbs[section] || {}),
        ...labels,
      };
    });
  };

  // extension: 이 메뉴를 등록한 곳이 코어가 아닌지. 같은 id가 이미 있으면 먼저 등록한 쪽의 값을 따른다.
  const appendMenus = (menu: AdminMenuItem | AdminMenuItem[] | undefined, extension: boolean) => {
    if (!menu) return;
    for (const item of Array.isArray(menu) ? menu : [menu]) {
      const existing = adminMenus.find((entry) => entry.id === item.id);
      if (!existing) {
        adminMenus.push({
          ...item,
          extension: item.extension ?? extension,
          items: item.items
            ? item.items.map((child) => ({ ...child }))
            : undefined,
        });
        continue;
      }
      // Multiple domain modules may contribute to one navigation group.
      const children = new Map(
        (existing.items || []).map((child) => [child.href, child]),
      );
      for (const child of item.items || [])
        children.set(child.href, { ...child });
      existing.items = [...children.values()];
    }
  };

  const appendPostSkin = (
    item: NonNullable<ExtensionRegistryConfig["postSkins"]>[number],
  ) => {
    if (item.list) postSkins[item.key] = item.list;
    if (item.read) postReadSkins[item.key] = item.read;
    if (item.write) postWriteSkins[item.key] = item.write;
    if (item.comments) {
      postCommentSkins[item.key] = item.comments;
      if (!listedCommentSkins.has(item.comments)) {
        listedCommentSkins.add(item.comments);
        postCommentSkinOptions.push(toOption(item) as PostSkinOption);
      }
    }
    if (item.toc && !postTocSkins.includes(item.key)) postTocSkins.push(item.key);
    if (item.placesComments && !postCommentPlacingSkins.includes(item.key)) postCommentPlacingSkins.push(item.key);
    postSkinOptions.set(item.key, toOption(item) as PostSkinOption);
  };

  const appendPostLayout = (
    item: NonNullable<ExtensionRegistryConfig["postLayouts"]>[number],
  ) => {
    postLayouts[item.key] = item.component;
    postLayoutOptions.set(item.key, toOption(item) as PostLayoutOption);
  };

  const appendAdminLayout = (
    item: NonNullable<ExtensionRegistryConfig["adminLayouts"]>[number],
  ) => {
    adminLayouts[item.key] = item.component;
    if (item.dashboard) adminDashboards[item.key] = item.dashboard;
    adminLayoutOptions.set(item.key, toOption(item) as AdminLayoutOption);
  };

  const appendUserSkin = (
    item: NonNullable<ExtensionRegistryConfig["userSkins"]>[number],
  ) => {
    userLayouts[item.key] = {
      timeline: item.timeline,
      update: item.update,
      preferences: item.preferences,
      delete: item.delete,
      authLayout: item.authLayout,
      signin: item.signin,
      register: item.register,
      resetPassword: item.resetPassword,
      placesLoginProviders: item.placesLoginProviders,
    };
    userLayoutOptions.set(item.key, toOption(item) as UserLayoutOption);
  };

  // 첫 번째 레지스트리가 코어다. 그 뒤에 합쳐지는 것은 프로젝트 확장이다.
  // 코어 레지스트리에 함께 들어 있는 쉬운 설치 패키지의 메뉴는 coreRegistry.tsx가 미리 표시해 둔다.
  registries.forEach((source, index) => {
    source.modules?.forEach((module) => {
      appendMenus(module.admin?.menu, index > 0);
      appendBreadcrumbs(module.admin?.breadcrumbs);
      module.postSkins?.forEach(appendPostSkin);
      module.postLayouts?.forEach(appendPostLayout);
      module.adminLayouts?.forEach(appendAdminLayout);
      module.userSkins?.forEach(appendUserSkin);
    });

    source.postSkins?.forEach(appendPostSkin);
    source.postLayouts?.forEach(appendPostLayout);
    source.adminLayouts?.forEach(appendAdminLayout);
    source.userSkins?.forEach(appendUserSkin);
  });

  return {
    postSkins,
    postReadSkins,
    postWriteSkins,
    postCommentSkins,
    postTocSkins,
    postCommentPlacingSkins,
    postLayouts,
    adminLayouts,
    adminDashboards,
    userLayouts,
    adminMenus: adminMenus
      .map((menu) => ({
        ...menu,
        items: menu.items
          ?.slice()
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
      }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    adminBreadcrumbs,
    postSkinOptions: Array.from(postSkinOptions.values()),
    postCommentSkinOptions,
    postLayoutOptions: Array.from(postLayoutOptions.values()),
    adminLayoutOptions: Array.from(adminLayoutOptions.values()),
    userLayoutOptions: Array.from(userLayoutOptions.values()),
  };
};

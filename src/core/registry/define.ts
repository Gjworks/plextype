import type React from "react";
import type { UserLayoutComponents } from "@/core/registry/defaultRegistry";
import type { AdminBreadcrumbRegistry, AdminMenuItem } from "@/core/registry/adminRegistry";

export type RegistryOption = {
  key: string;
  label: string;
  description: string;
};

export type PostSkinRegistration = RegistryOption & {
  list?: React.ComponentType<any>;
  read?: React.ComponentType<any>;
  // 생략하면 코어의 기본 글쓰기 화면을 쓴다.
  write?: React.ComponentType<any>;
  // 댓글 목록과 댓글 쓰기 화면. 생략하면 코어의 기본 댓글 화면을 쓴다.
  comments?: React.ComponentType<any>;
  // true면 본문 화면(read)이 넘겨받은 comments를 직접 원하는 자리에 놓는다. 아니면 코어가 본문 바로 아래에 놓는다.
  placesComments?: boolean;
  // 본문 옆에 제목 목차를 붙일지. 긴 글을 읽는 스킨에서만 켠다.
  toc?: boolean;
};

export type PostLayoutRegistration = RegistryOption & {
  component: React.ComponentType<any>;
};

export type AdminLayoutRegistration = RegistryOption & {
  component: React.ComponentType<any>;
  dashboard?: React.ComponentType<any>;
};

export type UserSkinRegistration = RegistryOption & UserLayoutComponents;

// 쉬운 설치 패키지가 그리는 화면(뷰)을 프로젝트의 것으로 바꿔 끼우는 등록.
// 패키지는 데이터를 준비해 resolveView(@/core/registry/resolveView)로 뷰를 고르고, 등록된 것이 없으면 자기 기본 뷰를 쓴다.
// 화면만 바꾸려고 패키지를 src/extensions로 옮기면 패키지의 업데이트를 받지 못하므로 이 등록을 쓴다.
export type ViewRegistration = {
  // 패키지가 정한 이름. "<모듈 ID>.<화면 이름>" 형식이다(예: "social-login.userLinks").
  key: string;
  // 그 패키지의 문서가 밝힌 속성을 받는 컴포넌트.
  component: React.ComponentType<any>;
};

export type ModuleRegistration = RegistryOption & {
  admin?: {
    menu?: AdminMenuItem | AdminMenuItem[];
    breadcrumbs?: AdminBreadcrumbRegistry;
  };
  postSkins?: PostSkinRegistration[];
  postLayouts?: PostLayoutRegistration[];
  adminLayouts?: AdminLayoutRegistration[];
  userSkins?: UserSkinRegistration[];
  views?: ViewRegistration[];
};

export type ExtensionRegistryConfig = {
  modules?: ModuleRegistration[];
  postSkins?: PostSkinRegistration[];
  postLayouts?: PostLayoutRegistration[];
  adminLayouts?: AdminLayoutRegistration[];
  userSkins?: UserSkinRegistration[];
  views?: ViewRegistration[];
};

export const defineModule = (config: ModuleRegistration) => config;
export const definePostSkin = (config: PostSkinRegistration) => config;
export const definePostLayout = (config: PostLayoutRegistration) => config;
export const defineAdminLayout = (config: AdminLayoutRegistration) => config;
export const defineUserSkin = (config: UserSkinRegistration) => config;
export const defineView = (config: ViewRegistration) => config;
export const defineExtensionRegistry = (config: ExtensionRegistryConfig) => config;

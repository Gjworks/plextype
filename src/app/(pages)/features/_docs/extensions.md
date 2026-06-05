---
title: Extensions
description: 개인 프로젝트에서 코어를 수정하지 않고 화면과 기능을 바꾸는 방법입니다.
---

## 기본 진입점

`src/extensions/index.tsx`는 프로젝트별 화면 확장의 중심 파일입니다. `@project/extensions` alias는 이 파일을 먼저 찾고, 파일이 없으면 `src/core/registry/defaultRegistry.tsx`로 fallback합니다.

```tsx
import type React from "react";

import DefaultLayout from "./layouts/default/Layout";
import AuthLayout from "./layouts/auth/Layout";
import HomePage from "./pages/home";
import IssueTrackerListSkin from "./posts/tpl/issuetracker/list";

export const postSkins: Record<string, React.ComponentType<any>> = {
  issuetracker: IssueTrackerListSkin,
};

export { DefaultLayout, AuthLayout, HomePage };
```

여기서 export한 이름은 코어 라우트가 직접 사용합니다. 예를 들어 `DefaultLayout`을 export하면 `src/app/page.tsx`, `src/app/(pages)/layout.tsx`, `src/app/(modules)/posts/layout.tsx` 같은 코어 라우트가 자동으로 프로젝트별 레이아웃을 사용합니다.

## 확장 디렉토리

- `src/extensions/index.tsx`: 프로젝트 확장 진입점입니다.
- `src/extensions/styles/style.css`: 프로젝트별 전역 스타일입니다.
- `src/extensions/triggerRegistry.ts`: 프로젝트별 트리거 핸들러와 trigger.json을 코어에 연결합니다.
- `src/extensions/postCapabilities.ts`: 게시판 스킨별 기능을 선언합니다.
- `src/extensions/admin.registry.tsx`: 프로젝트별 관리자 메뉴와 breadcrumb를 등록합니다.
- `src/extensions/posts/tpl/*`: 게시판 스킨 컴포넌트를 보관합니다.
- `src/extensions/layouts/*`: 프로젝트별 레이아웃을 보관합니다.

## 관리자 Registry

관리자 화면은 코어 레이아웃을 유지하면서 메뉴와 breadcrumb를 registry에서 가져옵니다. 코어 모듈은 `src/modules/[module]/admin.registry.tsx`에 자기 메뉴를 등록하고, 프로젝트별 기능은 같은 형태를 `src/extensions/admin.registry.tsx`에 두는 방향을 권장합니다.

기본 코어 registry는 `src/core/registry/adminRegistry.tsx`입니다. 이 파일은 코어 모듈의 관리자 메뉴를 모아서 SideNav와 breadcrumb에 전달합니다. 사용자가 새 기능을 만들 때 목표는 `src/app/(modules)/admin`이나 `src/layouts/admin`을 직접 수정하지 않고, registry에 메뉴를 추가하는 것입니다.

```tsx
// src/extensions/admin.registry.tsx
import { PackageSearch } from "lucide-react";

import type {
  AdminBreadcrumbRegistry,
  AdminMenuItem,
} from "@/core/registry/adminRegistry";

export const extensionAdminMenus: AdminMenuItem[] = [
  {
    id: "orders",
    icon: <PackageSearch size={18} />,
    label: "주문 관리",
    order: 80,
    items: [
      { label: "주문 목록", href: "/admin/extensions/orders" },
      { label: "주문 설정", href: "/admin/extensions/orders/settings" },
    ],
  },
];

export const extensionAdminBreadcrumbs: AdminBreadcrumbRegistry = {
  extensions: {
    orders: "ORDERS",
    settings: "SETTINGS",
  },
};
```

관리자 메뉴 항목은 `id`, `label`, `icon`, `order`를 기준으로 SideNav에 표시됩니다. `href`만 있으면 단일 메뉴가 되고, `items`가 있으면 접히는 메뉴가 됩니다. `items`의 `href`는 실제 Next.js 라우트와 일치해야 합니다.

```txt
src/extensions/modules/orders/
  actions/order.action.ts
  actions/order.query.ts
  admin/OrdersAdminPage.tsx

src/app/(extensions)/admin/extensions/orders/page.tsx
src/app/(extensions)/admin/extensions/orders/settings/page.tsx
src/extensions/admin.registry.tsx
```

데이터 로직은 extension 내부 action/query에 둡니다. 화면 컴포넌트나 page에서 Prisma query를 직접 호출하지 않고, `Page 또는 Component → Action → Query` 흐름을 지킵니다. 관리자 전용 서버 액션은 이름 중간에 `Admin`을 넣고 `Action`으로 끝내는 규칙을 유지합니다.

아직 registry가 자동으로 모든 extension 파일을 스캔하는 구조는 아닙니다. 배포판은 코어 registry가 기본 메뉴를 제공하고, 프로젝트는 `src/extensions/admin.registry.tsx`를 코어 registry에 연결하는 방식으로 확장합니다. 이렇게 하면 코어 업데이트를 받을 때 관리자 레이아웃 충돌을 줄일 수 있습니다.

## Tailwind 스캔

`src/extensions`는 gitignore 대상이지만 Tailwind 클래스는 생성되어야 합니다. 그래서 `src/app/globals.css`에서 source를 명시합니다.

```css
@import "tailwindcss";
@source "../extensions";
@source "./(extensions)";
```

## 확장 우선순위

대부분의 확장은 “프로젝트 파일이 있으면 프로젝트 파일을 쓰고, 없으면 코어 fallback을 쓴다”는 규칙을 따릅니다.

```txt
@project/extensions
  1. src/extensions/index.tsx
  2. src/core/registry/defaultRegistry.tsx

@project/proxy
  1. src/extensions/proxy.ts
  2. src/core/proxy/defaultProxy.ts

@project/post-capabilities
  1. src/extensions/postCapabilities.ts
  2. src/core/registry/defaultPostCapabilities.ts
```

---
title: Extensions
description: 개인 프로젝트에서 코어를 수정하지 않고 화면과 기능을 바꾸는 방법입니다.
---

## 기본 진입점

`src/extensions/index.tsx`는 프로젝트별 화면 확장의 진입점입니다. `@project/extensions` alias는 이 파일을 먼저 찾고, 파일이 없으면 `src/core/registry/defaultRegistry.tsx`로 fallback합니다.

실제 모듈, 스킨, 레이아웃 등록은 `src/extensions/registry.tsx`에서 조립합니다. 각 모듈이나 스킨은 자기 폴더 안에 `registry.tsx`를 두고, 최상위 registry는 그것들을 import해서 배열에 넣는 방식이 좋습니다. 이렇게 해야 스킨이나 모듈 폴더를 다른 프로젝트에 그대로 옮겨도 다시 연결하기 쉽습니다.

```tsx
import DefaultLayout from "./layouts/default/Layout";
import AuthLayout from "./layouts/auth/Layout";
import HomePage from "./pages/home";

export { DefaultLayout, AuthLayout, HomePage };
```

여기서 export한 이름은 코어 라우트가 직접 사용합니다. 예를 들어 `DefaultLayout`을 export하면 `src/app/page.tsx`, `src/app/(pages)/layout.tsx`, `src/app/(modules)/posts/layout.tsx` 같은 코어 라우트가 자동으로 프로젝트별 레이아웃을 사용합니다.

## 확장 디렉토리

- `src/extensions/index.tsx`: 프로젝트 확장 진입점입니다.
- `src/extensions/registry.tsx`: 모듈, 스킨, 관리자 레이아웃, user 스킨을 조립합니다.
- `src/extensions/styles/style.css`: 프로젝트별 전역 스타일입니다.
- `src/extensions/triggerRegistry.ts`: 프로젝트별 트리거 핸들러와 trigger.json을 코어에 연결합니다.
- `src/extensions/postCapabilities.ts`: 게시판 스킨별 기능을 선언합니다.
- `src/extensions/posts/tpl/*/registry.tsx`: 게시판 스킨 등록 정보를 보관합니다.
- `src/extensions/modules/*/registry.tsx`: 프로젝트별 모듈 등록 정보를 보관합니다.
- `src/extensions/layouts/*`: 프로젝트별 레이아웃을 보관합니다.

## 통합 Registry

코어 모듈과 extensions 모듈은 같은 registry 모양을 사용합니다. 코어의 기본 등록은 `src/core/registry/coreRegistry.tsx`에 모이고, 프로젝트 확장은 `src/extensions/registry.tsx`에 모입니다. 최종적으로 `@project/extensions`가 core registry와 extension registry를 합쳐서 관리자 메뉴, breadcrumb, 게시판 스킨, 게시판 레이아웃, 관리자 레이아웃, user 스킨을 내보냅니다.

최상위 registry는 조립만 담당합니다.

```tsx
// src/extensions/registry.tsx
import { defineExtensionRegistry } from "@/core/registry/define";
import { shopModule } from "./modules/shop/registry";
import { galleryPostSkin } from "./posts/tpl/gallery/registry";
import { customAdminLayout } from "./layouts/admin/registry";

export const registry = defineExtensionRegistry({
  modules: [shopModule],
  postSkins: [galleryPostSkin],
  adminLayouts: [customAdminLayout],
});
```

모듈은 자기 관리자 메뉴와 breadcrumb를 함께 들고 다닙니다.

```tsx
// src/extensions/modules/shop/registry.tsx
import { PackageSearch } from "lucide-react";
import { defineModule } from "@/core/registry/define";

export const shopModule = defineModule({
  key: "shop",
  label: "쇼핑몰",
  description: "상품과 주문을 관리하는 프로젝트 확장 모듈입니다.",
  admin: {
    menu: {
      id: "shop",
      icon: <PackageSearch size={18} />,
      label: "쇼핑몰 관리",
      order: 80,
      items: [
        { label: "상품 목록", href: "/admin/shop/products" },
        { label: "주문 목록", href: "/admin/shop/orders" },
      ],
    },
    breadcrumbs: {
      shop: {
        products: "PRODUCTS",
        orders: "ORDERS",
      },
    },
  },
});
```

관리자 메뉴 항목은 `id`, `label`, `icon`, `order`를 기준으로 SideNav에 표시됩니다. `href`만 있으면 단일 메뉴가 되고, `items`가 있으면 접히는 메뉴가 됩니다. `items`의 `href`는 실제 Next.js 라우트와 일치해야 합니다.

```txt
src/extensions/modules/orders/
  actions/order.action.ts
  actions/order.query.ts
  admin/OrdersAdminPage.tsx

src/app/(extensions)/admin/extensions/orders/page.tsx
src/app/(extensions)/admin/extensions/orders/settings/page.tsx
src/extensions/modules/orders/registry.tsx
```

데이터 로직은 extension 내부 action/query에 둡니다. 화면 컴포넌트나 page에서 Prisma query를 직접 호출하지 않고, `Page 또는 Component → Action → Query` 흐름을 지킵니다. 관리자 전용 서버 액션은 이름 중간에 `Admin`을 넣고 `Action`으로 끝내는 규칙을 유지합니다.

registry가 자동으로 모든 extension 파일을 스캔하지는 않습니다. 대신 각 모듈이나 스킨 폴더의 `registry.tsx`를 `src/extensions/registry.tsx`에 import해서 등록합니다. 이 방식은 자동 스캔보다 명시적이고, 유료 모듈이나 스킨을 폴더 단위로 전달하기 쉽습니다.

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

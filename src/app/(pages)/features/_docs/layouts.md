---
title: Layouts & Page
description: 기본 레이아웃과 홈 페이지를 extensions에서 교체하는 방법입니다.
---

## 기본 원칙

코어 라우트는 직접 레이아웃 파일을 고정해서 import하지 않고 `@project/extensions`를 먼저 바라봅니다. 이 alias는 프로젝트 확장이 있으면 확장을 사용하고, 없으면 코어 fallback을 사용합니다.

```tsx
import { DefaultLayout } from "@project/extensions";
import { AuthLayout } from "@project/extensions";
```

## 레이아웃 교체

`src/extensions/index.tsx`에서 같은 이름으로 export하면 기존 app 라우트가 자동으로 커스텀 레이아웃을 사용합니다.

```txt
src/extensions/layouts/default/Layout.tsx
src/extensions/layouts/auth/Layout.tsx
src/extensions/pages/home.tsx
src/extensions/index.tsx
```

## 추가 페이지

새 페이지가 필요하면 `src/app/(extensions)` 아래에 새 route를 추가하는 편이 유지보수에 좋습니다. route group 이름은 URL에 노출되지 않습니다.

```txt
src/app/(extensions)/dashboard/page.tsx
→ /dashboard
```

## 주의점

코어의 `src/app/(modules)`를 직접 바꾸면 upstream 업데이트 때 충돌이 생기기 쉽습니다. 화면 교체는 먼저 extension export, 새 route group, registry fallback으로 해결할 수 있는지 확인합니다.

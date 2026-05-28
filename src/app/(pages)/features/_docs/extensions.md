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
- `src/extensions/posts/tpl/*`: 게시판 스킨 컴포넌트를 보관합니다.
- `src/extensions/layouts/*`: 프로젝트별 레이아웃을 보관합니다.

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

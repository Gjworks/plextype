---
title: Posts
description: 게시판 스킨과 스킨별 기능을 extensions에서 등록하는 방법입니다.
---

## 스킨 선택 흐름

관리자 게시판 설정의 `skin` 값이 `default`면 코어 기본 목록 스킨을 사용합니다. 다른 값이면 `postSkins[skin]`에서 등록된 컴포넌트를 찾고, 없으면 기본 스킨으로 fallback합니다.

```txt
게시판 설정 skin = "issuetracker"
→ @project/extensions 의 postSkins.issuetracker 확인
→ 등록되어 있으면 issuetracker 목록 스킨 사용
→ 없으면 코어 default 목록 스킨 사용
```

중요한 점은 `mid === "bin"`처럼 라우터나 목록 페이지에 특정 게시판 ID를 하드코딩하지 않는 것입니다.

## 목록 스킨 등록

게시판 스킨은 `src/extensions/posts/tpl/[skin-name]` 아래에 두는 것을 권장합니다.

```tsx
// src/extensions/index.tsx
import type React from "react";
import IssueTrackerListSkin from "./posts/tpl/issuetracker/list";

export const postSkins: Record<string, React.ComponentType<any>> = {
  issuetracker: IssueTrackerListSkin,
};
```

## 스킨별 capability

open/close 같은 기능은 `Document.status`를 코어에 하드코딩하지 않고 capability로 선언합니다.

```ts
// src/extensions/postCapabilities.ts
import type { PostSkinCapability } from "@/core/registry/defaultPostCapabilities";

export const postSkinCapabilities: Record<string, PostSkinCapability> = {
  issuetracker: {
    documentStatus: {
      defaultStatus: "open",
      useStatusCounts: true,
    },
  },
};
```

## 새 게시판 스킨 만들기

```txt
src/extensions/posts/tpl/roadmap/list.tsx
src/extensions/posts/actions/roadmap.action.ts
src/extensions/posts/actions/roadmap.query.ts
src/extensions/postCapabilities.ts
```

스킨 전용 action/query가 필요할 때는 `src/extensions/posts/actions`에 둡니다. 기존 코어 action으로 충분한 조회나 삭제까지 새로 만들 필요는 없습니다.

## 본문과 댓글 SEO

게시글 목록과 본문은 가능한 서버 컴포넌트에서 HTML을 먼저 만들어 내려주는 구조가 좋습니다. 에디터, 댓글 작성창, 첨부파일 업로드처럼 상호작용이 필요한 부분만 클라이언트 컴포넌트로 분리하면 검색 엔진이 제목, 본문 요약, 댓글 텍스트를 더 안정적으로 읽을 수 있습니다.

---
title: 프로젝트 구조
description: Gjworks는 코어 업데이트와 개인 커스텀을 분리하기 위해 라우트, 모듈, registry, extensions를 역할별로 나눕니다.
---

## 큰 원칙

코어는 업데이트 가능한 영역이고 extensions는 프로젝트별 자유 영역입니다. 사용자가 코어 파일을 직접 수정하지 않아도 레이아웃, 홈, 스킨, 추가 라우트를 바꿀 수 있어야 합니다.

이 구조의 목표는 “코어 업데이트를 받을 수 있는 프로젝트”입니다. 일반적인 커스터마이징은 `src/extensions`와 `src/app/(extensions)`에 두고, 코어의 `src/modules`, `src/app/(modules)`, `src/core`는 프레임워크가 제공하는 기본 동작으로 유지합니다.

## 주요 디렉토리

- `src/app`: Next.js App Router 라우트입니다. 코어 라우트는 직접 수정하지 않는 것을 권장합니다.
- `src/app/(modules)`: 게시판, 회원, 인증, 관리자 등 코어 모듈 라우트입니다.
- `src/app/(pages)`: 일반 문서/소개/정적 페이지 라우트입니다.
- `src/app/(extensions)`: 개인 프로젝트가 추가 라우트를 만들 때 사용하는 영역입니다. git 제외 대상입니다.
- `src/modules`: 비즈니스 모듈입니다. UI는 action을 통해 데이터에 접근하고 query를 직접 호출하지 않습니다.
- `src/layouts`: 코어가 제공하는 기본 레이아웃입니다.
- `src/page`: 코어가 제공하는 기본 페이지 템플릿입니다.
- `src/core/registry`: extensions가 없을 때 사용하는 fallback registry입니다.
- `src/extensions`: 프로젝트별 커스텀 영역입니다.

## Action Layer 규칙

`.tsx` 페이지와 컴포넌트는 Prisma query를 직접 호출하지 않습니다. 데이터 흐름은 `Component/Page → Action → Query` 순서를 따릅니다. 관리자 전용 action은 이름 중간에 `Admin`을 포함하고, 서버 action 함수명은 `Action`으로 끝냅니다.

```txt
권장 흐름
src/modules/posts/tpl/default/list.tsx
  -> getDocumentListAction()
  -> getDocumentListQuery()
  -> prisma.document.findMany()

피해야 할 흐름
tsx 컴포넌트 -> prisma.document.findMany()
```

## 코어와 확장의 경계

새 페이지가 필요하면 `src/app/(extensions)`에 라우트를 추가합니다. 새 게시판 스킨이 필요하면 `src/extensions/posts/tpl/[skin]`에 컴포넌트를 두고 `src/extensions/index.tsx`에서 등록합니다. 새 DB 모델이 필요하면 `src/extensions/prisma/schema/*.prisma`에 모델 조각을 추가합니다.

반대로 코어의 인증, 게시판, 댓글, 첨부파일 같은 공통 기능을 수정해야 할 때는 먼저 trigger, capability, extension 라우트로 해결 가능한지 확인합니다.

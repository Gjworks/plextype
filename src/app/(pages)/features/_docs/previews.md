---
title: Previews
description: 코어가 기본으로 제공하는 화면을 현재 사이트 레이아웃과 겹치지 않게 확인하는 방법입니다.
---

## 미리보기 주소

`/previews`는 코어가 제공하는 기본 화면을 빠르게 확인하기 위한 개발용 문서 화면입니다.

- `/previews`: 미리보기 목차입니다.
- `/previews/page/home`: `src/page/home.tsx` 기본 홈 페이지입니다.
- `/previews/layouts/default`: `src/layouts/default/Layout.tsx`를 단독으로 확인합니다.
- `/previews/layouts/auth`: `src/layouts/auth/Layout.tsx`를 단독으로 확인합니다.

## 왜 route group을 분리했나

`/previews`는 `src/app/(previews)` 아래에 있어서 `src/app/(pages)/layout.tsx`를 타지 않습니다. 그래서 기본 레이아웃 자체를 볼 때 현재 사이트 레이아웃과 중첩되지 않습니다.

## 언제 사용하나

코어 레이아웃을 수정했거나 `src/layouts` 기본 파일을 새로 추가했을 때 먼저 `/previews`에서 확인합니다. 프로젝트 확장 레이아웃을 만들기 전에 기본 형태를 확인하는 용도로도 좋습니다.

`/previews`는 실제 사용자에게 보여주기 위한 운영 페이지가 아닙니다.

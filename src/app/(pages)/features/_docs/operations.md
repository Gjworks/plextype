---
title: 운영 규칙
description: 자기 사이트를 별도 Git으로 관리하면서도 Plextype 코어 패치를 계속 받아오는 운영 방식입니다.
---

## 권장 Git 구조

Plextype를 받아서 새 사이트를 만들 때는 프로젝트 저장소를 완전히 새로 만들되, 원본 Plextype 저장소는 `upstream` remote로 남겨두는 방식을 권장합니다.

```txt
origin   = 사용자 개인/회사 사이트 저장소
upstream = Gjworks/plextype 원본 저장소
```

## 처음 프로젝트 만들기

```bash
git clone git@github.com:Gjworks/plextype.git my-site
cd my-site

git remote rename origin upstream
git remote add origin git@github.com:USER/my-site.git

git push -u origin main
```

## 패치 받아오기

```bash
git fetch upstream
git merge upstream/main

npm run prisma:sync
npm run prisma:generate
npm run build
```

이력을 더 깔끔하게 유지하고 싶은 팀은 `merge` 대신 `rebase`를 사용할 수 있습니다.

```bash
git fetch upstream
git rebase upstream/main
```

## 코어 파일 수정 최소화

`src/app/(modules)`, `src/modules`, `src/core`는 코어 업데이트 대상입니다. 레이아웃이나 스킨 변경 때문에 이 파일들을 수정하기 시작하면 업데이트 충돌 가능성이 커집니다.

## 커스텀 위치

```txt
src/extensions/index.tsx
src/extensions/layouts/*
src/extensions/pages/*
src/extensions/posts/tpl/*
src/extensions/proxy.ts
src/extensions/prisma/schema/*.prisma
src/extensions/prisma/seed.js
src/app/(extensions)/*
```

업데이트 충돌이 난다면 “코어 파일을 내 사이트용으로 더 고친다”보다 “내 사이트 로직을 extension으로 옮긴다”가 장기적으로 훨씬 안정적입니다.

## AGENTS.md 권장 규칙

```md
# Project Custom Rules

- Plextype 코어 파일(src/core, src/modules, src/app/(modules))은 가능한 한 수정하지 않는다.
- 사이트별 기능은 src/extensions 또는 src/app/(extensions)에 구현한다.
- DB 모델 추가는 src/extensions/prisma/schema/*.prisma에 작성한다.
- 원본 패치 반영 전후로 npm run prisma:sync, npm run prisma:generate, npm run build를 실행한다.
- 코어 수정이 필요하면 먼저 extension hook, registry, action wrapper로 해결 가능한지 검토한다.
```

## 배포 전 확인

```bash
npm run build
```

빌드가 통과하면 TypeScript와 Next 번들 단계는 통과한 것입니다.

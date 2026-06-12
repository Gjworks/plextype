---
title: 시작하기
description: Plextype를 처음 받은 사람이 clone부터 setup, 개발 서버 실행까지 따라 할 수 있는 설치 가이드입니다.
---

## 설치 방식

Plextype는 로컬 Node 방식과 Docker Compose 방식으로 실행할 수 있습니다. 처음 설치한다면 로컬 Node 방식이 가장 이해하기 쉽고, 팀원이 같은 실행 환경을 맞춰야 한다면 Docker Compose 방식을 사용합니다.

## 로컬 Node로 설치

Node.js 22, PostgreSQL, Redis가 이미 준비되어 있다면 아래 명령만 순서대로 실행합니다. SSH key가 등록되어 있지 않다면 GitHub에서 HTTPS clone 주소를 사용해도 됩니다.

```bash
git clone git@github.com:Gjworks/plextype.git
cd plextype
npm run setup
npm run dev
```

로컬 Node 방식으로 setup을 실행한다면 DB 호스트는 `localhost`, Redis 호스트도 `localhost`로 입력합니다. PostgreSQL 사용자명, 비밀번호, 데이터베이스 이름은 본인이 로컬에 만들어 둔 값과 같아야 합니다.

## Docker Compose로 설치

Docker Desktop이 실행 중이면 아래 명령만 순서대로 실행합니다. 배포판에는 `docker-compose.yml`이 포함되어 있으므로 별도로 compose 파일을 만들 필요가 없습니다.

```bash
git clone git@github.com:Gjworks/plextype.git
cd plextype
docker compose up -d postgres redis
docker compose run --rm --no-deps node npm run setup
docker compose up -d
docker compose logs -f node
```

setup에서 DB 호스트는 `postgres`, Redis 호스트는 `redis`로 입력합니다. 설치가 끝나면 브라우저에서 `http://localhost:3000`으로 접속합니다.

## docker-compose.yml 예시

```yaml
services:
  node:
    image: node:22
    container_name: node22
    working_dir: /app
    volumes:
      - .:/app
      - node_modules:/app/node_modules
      - ./storage:/app/storage
      - ./storage:/app/public/storage
    ports:
      - "3000:3000"
    networks:
      - web-network
    command: sh -lc "npm run dev"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    stdin_open: true
    tty: true
    environment:
      CHOKIDAR_USEPOLLING: "true"
      WATCHPACK_POLLING: "true"

  postgres:
    image: postgres:18.4
    container_name: postgres
    environment:
      POSTGRES_USER: plextype
      POSTGRES_PASSWORD: change-this-to-a-long-random-password
      POSTGRES_DB: plextype
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql
    networks:
      - web-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U plextype -d plextype"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - web-network
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
  redis_data:
  node_modules:

networks:
  web-network:
    driver: bridge
```

## setup 입력값

`setup.mjs`는 프로젝트 초기 환경값을 입력받아 `.env`를 생성합니다. 사이트 이름은 영문 `APP_NAME`, 한글 `APP_TITLE`로 입력받고, 실제 사이트 표시명 fallback을 위해 `PROJECT_TITLE`도 같이 생성합니다. 아무 값도 입력하지 않으면 `plextype`가 기본값으로 들어갑니다.

```txt
사이트 이름 - 영문 APP_NAME: plextype
사이트 이름 - 한글 APP_TITLE: plextype
관리자 ID: admin
관리자 비밀번호: password1234
관리자 이메일: admin@example.com
관리자 닉네임: 관리자
```

Docker Compose 방식이면 DB 호스트는 `postgres`, Redis 호스트는 `redis`를 사용합니다. 로컬 Node 방식이면 둘 다 `localhost`를 사용합니다.

## AGENTS.md 작성

Plextype를 받아간 프로젝트에서 AI 도구나 코딩 에이전트를 함께 쓴다면, 프로젝트 루트에 `AGENTS.md`를 두는 것을 권장합니다. 가장 중요한 원칙은 코어 파일을 직접 고치지 않고 `src/extensions`와 `src/app/(extensions)`에서 커스텀하는 것입니다.

```md
# Plextype Project Rules

- 프로젝트별 기능 추가와 화면 커스텀은 기본적으로 `src/extensions`에서 처리합니다.
- 프로젝트별 라우트 추가는 `src/app/(extensions)`에서 처리합니다.
- `src/app/(modules)`, `src/modules`, `src/core`는 Plextype 코어 영역입니다.
- 코어 파일을 수정해야 할 것 같다면 먼저 extensions, trigger, registry, capability로 해결 가능한지 확인합니다.
- 새 페이지는 `src/app/(extensions)/[route]/page.tsx`에 둡니다.
- 새 레이아웃은 `src/extensions/layouts/[name]/Layout.tsx`에 둡니다.
- 새 모듈은 자기 폴더 안에 `registry.tsx`를 두고 `defineModule()`로 관리자 메뉴, breadcrumb, 관련 스킨을 함께 등록합니다.
- 게시판 스킨은 `src/extensions/posts/tpl/[skin]/list.tsx`와 `src/extensions/posts/tpl/[skin]/registry.tsx`를 함께 둡니다.
- user 스킨, 관리자 레이아웃, 게시판 레이아웃도 각 폴더에 `registry.tsx`를 두고 `defineUserSkin()`, `defineAdminLayout()`, `definePostLayout()`로 등록합니다.
- `src/extensions/registry.tsx`는 각 모듈/스킨의 registry를 import해서 조립만 합니다.
- 다른 프로젝트로 넘길 모듈이나 스킨은 컴포넌트, action/query, prisma 조각, registry를 같은 폴더 단위로 유지합니다.
```

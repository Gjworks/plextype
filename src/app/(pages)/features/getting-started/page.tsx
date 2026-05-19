"use client";

import { useState } from "react";
import { FileCode2, X } from "lucide-react";

import Button from "@components/button/Button";
import Modal from "@components/modal/Modal";

import { CodeBlock, DocSection, DocsShell, FeatureDocPanel } from "../_components";

const DOCKER_COMPOSE_YML = `services:
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
    driver: bridge`;

const GettingStartedPage = () => {
  const [installMode, setInstallMode] = useState<"local" | "docker">("local");
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  return (
    <FeatureDocPanel>
      <DocsShell
        title="시작하기"
        description="Plextype를 처음 받은 사람이 clone부터 setup, 개발 서버 실행까지 따라 할 수 있는 설치 가이드입니다."
      >
        <div className="grid gap-5 py-9 lg:grid-cols-[210px_1fr]">
          <div>
            <h2 className="text-[13px] font-semibold tracking-normal text-gray-800 dark:text-dark-100">설치 방식</h2>
          </div>
          <div className="max-w-3xl">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  key: "local" as const,
                  title: "로컬 Node",
                  desc: "Node.js, PostgreSQL, Redis를 직접 준비해서 실행합니다.",
                  meta: "처음 설치 권장",
                },
                {
                  key: "docker" as const,
                  title: "Docker Compose",
                  desc: "compose로 node, postgres, redis를 함께 실행합니다.",
                  meta: "Docker 사용자용",
                },
              ].map((item) => {
                const selected = installMode === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setInstallMode(item.key)}
                    aria-pressed={selected}
                    className={`group rounded-md border p-4 text-left transition-colors ${
                      selected
                        ? "border-gray-950 bg-gray-950 text-white dark:border-white dark:bg-white dark:text-gray-950"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50 dark:border-dark-800 dark:bg-dark-900 dark:text-white dark:hover:border-dark-600 dark:hover:bg-dark-800"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest ${
                        selected ? "text-white/60 dark:text-gray-950/50" : "text-gray-400"
                      }`}
                    >
                      {item.meta}
                    </span>
                    <span className="mt-3 block text-base font-semibold tracking-normal">{item.title}</span>
                    <span
                      className={`mt-2 block text-sm leading-6 ${
                        selected ? "text-white/70 dark:text-gray-700" : "text-gray-500 dark:text-dark-300"
                      }`}
                    >
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {installMode === "docker" && (
          <DocSection title="Docker Compose로 설치">
            <p>
              Docker Desktop이 실행 중이면 아래 명령만 순서대로 실행합니다. 배포판에는 `docker-compose.yml`이 포함되어
              있으므로 별도로 compose 파일을 만들 필요가 없습니다.
            </p>
            <CodeBlock>{`git clone git@github.com:Gjworks/plextype.git
cd plextype
docker compose up -d postgres redis
docker compose run --rm --no-deps node npm run setup
docker compose up -d
docker compose logs -f node`}</CodeBlock>
            <p>
              setup에서 DB 호스트는 `postgres`, Redis 호스트는 `redis`로 입력합니다. 설치가 끝나면 브라우저에서
              `http://localhost:3000`으로 접속합니다.
            </p>
            <div>
              <Button
                type="button"
                onClick={() => setComposeModalOpen(true)}
                icon={<FileCode2 size={15} />}
                className="bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-dark-900 dark:text-dark-100 dark:ring-dark-700 dark:hover:bg-dark-800"
              >
                docker-compose.yml 보기
              </Button>
            </div>
          </DocSection>
        )}

        {installMode === "local" && (
          <DocSection title="로컬 Node로 설치">
            <p>
              Node.js 22, PostgreSQL, Redis가 이미 준비되어 있다면 아래 명령만 순서대로 실행합니다. SSH key가 등록되어
              있지 않다면 GitHub에서 HTTPS clone 주소를 사용해도 됩니다.
            </p>
            <CodeBlock>{`git clone git@github.com:Gjworks/plextype.git
cd plextype
npm run setup
npm run dev`}</CodeBlock>
            <p>
              로컬 Node 방식으로 setup을 실행한다면 DB 호스트는 `localhost`, Redis 호스트도 `localhost`로 입력합니다.
              PostgreSQL 사용자명, 비밀번호, 데이터베이스 이름은 본인이 로컬에 만들어 둔 값과 같아야 합니다.
            </p>
          </DocSection>
        )}

        <DocSection title="setup 입력값">
          <p>
            `setup.mjs`는 프로젝트 초기 환경값을 입력받아 `.env`를 생성합니다. 사이트 이름은 영문 `APP_NAME`,
            한글 `APP_TITLE`로 입력받고, 실제 사이트 표시명 fallback을 위해 `PROJECT_TITLE`도 같이 생성합니다.
            아무 값도 입력하지 않으면 `plextype`가 기본값으로 들어갑니다.
          </p>
          <CodeBlock>{`사이트 이름 - 영문 APP_NAME: plextype
사이트 이름 - 한글 APP_TITLE: plextype
관리자 ID: admin
관리자 비밀번호: password1234
관리자 이메일: admin@example.com
관리자 닉네임: 관리자`}</CodeBlock>
          <p>
            DB와 Redis 입력값은 선택한 실행 방식에 따라 달라집니다. Docker Compose 방식이면 컨테이너 서비스 이름인
            `postgres`, `redis`를 사용하고, 로컬 Node 방식이면 `localhost`를 사용합니다.
          </p>
          <CodeBlock>{installMode === "docker" ? `DB 사용자명: plextype
DB 비밀번호: docker-compose.yml의 POSTGRES_PASSWORD 값
DB 호스트 주소: postgres
DB 포트 번호: 5432
데이터베이스 이름: plextype
Redis 호스트 주소: redis
Redis 포트 번호: 6379` : `DB 사용자명: plextype
DB 비밀번호: 로컬 PostgreSQL 비밀번호
DB 호스트 주소: localhost
DB 포트 번호: 5432
데이터베이스 이름: plextype
Redis 호스트 주소: localhost
Redis 포트 번호: 6379`}</CodeBlock>
          <p>
            관리자 계정 정보는 seed 단계에서 사용됩니다. JWT secret, secret key, public secret은 setup이 랜덤 문자열로
            생성합니다. `.env`가 이미 존재하면 덮어쓰지 않으므로, 값을 다시 만들고 싶다면 기존 `.env`를 백업하거나
            삭제한 뒤 setup을 다시 실행해야 합니다.
          </p>
        </DocSection>

        <DocSection title="AGENTS.md 작성">
          <p>
            Plextype를 받아간 프로젝트에서 AI 도구나 코딩 에이전트를 함께 쓴다면, 프로젝트 루트에 `AGENTS.md`를 두는 것을
            권장합니다. 이 파일은 에이전트에게 “어디를 수정해야 하고, 어디는 건드리면 안 되는지” 알려주는 작업 규칙입니다.
          </p>
          <p>
            가장 중요한 원칙은 코어 파일을 직접 고치지 않고 `src/extensions`와 `src/app/(extensions)`에서 커스텀하는 것입니다.
            그래야 나중에 Plextype 코어 패치본을 받아도 프로젝트별 기능과 충돌할 가능성이 줄어듭니다.
          </p>
          <CodeBlock>{`# AGENTS.md

# Plextype Project Rules

이 프로젝트는 Plextype 기반 프로젝트입니다.
AI 에이전트는 코어 업데이트를 계속 받을 수 있도록 아래 규칙을 반드시 지켜야 합니다.

## 핵심 원칙

- 프로젝트별 기능 추가와 화면 커스텀은 기본적으로 \`src/extensions\`에서 처리합니다.
- 프로젝트별 라우트 추가는 \`src/app/(extensions)\`에서 처리합니다.
- \`src/app/(modules)\`, \`src/modules\`, \`src/core\`는 Plextype 코어 영역입니다.
- 코어 영역은 모든 프로젝트에 공통으로 필요한 버그 수정이나 확장 포인트 추가가 아니라면 직접 수정하지 않습니다.
- 코어 파일을 수정해야 할 것 같다면 먼저 \`extensions\`, trigger, registry, capability로 해결 가능한지 확인합니다.

## 기능 추가 위치

- 새 페이지: \`src/app/(extensions)/[route]/page.tsx\`
- 새 레이아웃: \`src/extensions/layouts/[name]/Layout.tsx\`
- 홈 페이지 교체: \`src/extensions/pages/home.tsx\`
- 게시판 스킨: \`src/extensions/posts/tpl/[skin]/list.tsx\`
- 게시판 스킨 등록: \`src/extensions/index.tsx\`
- 스킨별 기능 선언: \`src/extensions/postCapabilities.ts\`
- 프로젝트별 proxy 확장: \`src/extensions/proxy.ts\`
- Prisma 모델 확장: \`src/extensions/prisma/schema/*.prisma\`
- Prisma seed 확장: \`src/extensions/prisma/seed.js\`

## Action Layer 규칙

- React 페이지와 컴포넌트에서 Prisma query를 직접 호출하지 않습니다.
- 데이터 흐름은 \`Component/Page -> Action -> Query\` 순서를 따릅니다.
- 서버 액션 함수 이름은 \`Action\`으로 끝냅니다.
- 관리자 전용 액션은 이름 중간에 \`Admin\`을 포함합니다.
- \`*.tsx\` 파일에서 \`*.query.ts\`를 직접 import하지 않습니다.

## Prisma 규칙

- \`prisma/schema.prisma\`는 sync 결과물이므로 직접 수정하지 않습니다.
- 코어 모델은 \`src/core/prisma/schema.prisma\`에 있습니다.
- 프로젝트별 모델은 \`src/extensions/prisma/schema/*.prisma\`에 조각 파일로 추가합니다.
- 모델을 추가하거나 수정한 뒤에는 \`npm run prisma:sync\`를 실행합니다.
- migration이 필요하면 \`npm run migrate:dev\`를 사용합니다.

## UI 규칙

- 기존 컴포넌트와 디자인 규칙을 우선 사용합니다.
- 버튼, 입력 필드, 모달, Alert는 코어 공통 컴포넌트를 먼저 확인합니다.
- 기존 화면의 Tailwind 클래스와 레이아웃은 요청 없이 크게 바꾸지 않습니다.
- 임의의 마케팅 페이지보다 실제 사용 가능한 화면을 우선 구현합니다.

## 보안과 설정

- \`.env\`, \`.env.production\`, \`.env.development\`는 요청 없이 읽거나 수정하지 않습니다.
- JWT secret, DB password, API key 같은 민감값을 코드에 하드코딩하지 않습니다.
- Docker, Caddy, 배포 설정은 수정 전에 변경 이유를 먼저 설명합니다.
- 상태 변경 요청을 추가할 때는 기존 인증, 권한, CSRF/Origin 검증 흐름을 확인합니다.

## 금지 또는 주의

- \`node_modules\`, \`.next\`, \`dist\`, \`.git\`, \`public\`, \`storage\`는 분석하거나 수정하지 않습니다.
- 사용자의 기존 변경사항을 임의로 되돌리지 않습니다.
- \`git commit\`, \`git push\`, \`git reset --hard\`는 사용자가 명시적으로 요청하지 않으면 실행하지 않습니다.
- 새 npm 패키지는 꼭 필요한 경우에만 추가하고, 먼저 기존 라이브러리로 가능한지 확인합니다.

## 작업 후 확인

- TypeScript 오류가 없는지 확인합니다.
- 변경 범위가 작아도 가능한 경우 \`npm run build\`로 검증합니다.
- Prisma schema를 바꿨다면 \`npm run prisma:sync\`와 필요한 migration 상태를 확인합니다.
- 최종 보고에는 수정한 파일과 검증 결과를 간단히 남깁니다.`}</CodeBlock>
          <p>
            이 템플릿은 프로젝트 루트의 `AGENTS.md`에 넣어두면 됩니다. 프로젝트마다 더 엄격한 규칙이 필요하면 아래쪽에
            추가해도 되지만, “커스텀은 extensions에서 한다”는 원칙은 유지하는 편이 좋습니다.
          </p>
        </DocSection>

        <DocSection title="빌드 확인">
          <p>
            배포 전에는 반드시 빌드를 확인합니다. 이 단계는 TypeScript 타입, Next.js 라우트 구성, 서버 컴포넌트 import,
            generated Prisma client import가 함께 검증되는 가장 기본적인 안전장치입니다.
          </p>
          <CodeBlock>{`npm run build`}</CodeBlock>
          <p>
            빌드 단계에서는 Redis 연결을 실제로 열지 않도록 처리되어 있습니다. 배포 후 런타임에서 알림, 세션, 캐시 기능을
            사용하려면 운영 환경의 `REDIS_URL`이 실제 Redis 주소를 가리키는지 별도로 확인합니다.
          </p>
        </DocSection>
      </DocsShell>

      <Modal state={composeModalOpen} close={setComposeModalOpen} size="md" position="center">
        <div className="max-h-[78vh] overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-gray-900 dark:text-white">docker-compose.yml</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-300">
                배포판에 포함되는 기본 Docker Compose 예시입니다. `POSTGRES_PASSWORD`는 프로젝트에 맞게 바꿔서 사용합니다.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setComposeModalOpen(false)}
              icon={<X size={14} />}
              className="shrink-0 bg-white px-3 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-dark-900 dark:text-dark-200 dark:ring-dark-700 dark:hover:bg-dark-800"
            >
              닫기
            </Button>
          </div>
          <CodeBlock>{DOCKER_COMPOSE_YML}</CodeBlock>
        </div>
      </Modal>
    </FeatureDocPanel>
  );
};

export default GettingStartedPage;

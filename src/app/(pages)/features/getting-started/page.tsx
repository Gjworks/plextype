import { CodeBlock, DocSection, DocsShell, FeatureDocPanel, PathTable } from "../_components";

const requirementItems = [
  { path: "Git", desc: "GitHub 저장소를 내려받을 때 사용합니다. SSH clone을 쓰려면 GitHub SSH key가 등록되어 있어야 합니다." },
  { path: "Docker Desktop", desc: "Node.js, PostgreSQL, Redis를 모두 Docker Compose로 실행하기 위해 필요합니다." },
  { path: "Node.js 22", desc: "Docker를 쓰지 않고 로컬에서 직접 실행할 때만 필요합니다. 기본 설치 흐름은 Docker Compose 기준입니다." },
  { path: "PostgreSQL", desc: "게시글, 회원, 설정, 알림 같은 영구 데이터를 저장합니다. 기본 설치에서는 compose의 postgres 서비스가 담당합니다." },
  { path: "Redis", desc: "세션, 알림, 캐시성 데이터에 사용합니다. 기본 설치에서는 compose의 redis 서비스가 담당합니다." },
];

const composeItems = [
  { path: "postgres", desc: "예시 비밀번호는 반드시 프로젝트에 맞게 바꿔 사용합니다. 운영 환경에서는 더 긴 비밀번호를 권장합니다." },
  { path: "redis", desc: "컨테이너 내부에서는 `redis://redis:6379`, 호스트 컴퓨터에서는 `redis://localhost:6379`로 접근합니다." },
  { path: "node", desc: "Node 22 컨테이너에서 setup과 개발 서버를 실행합니다. 기본 설치 흐름의 실제 앱 서비스입니다." },
];

const GettingStartedPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="시작하기"
        description="Plextype를 처음 받은 사람이 clone부터 Docker Compose, setup, 개발 서버 실행까지 따라 할 수 있는 설치 가이드입니다."
      >
        <DocSection title="설치 흐름">
          <p>
            기본 설치 방식은 `node`, `postgres`, `redis`를 모두 Docker Compose로 실행하는 방식입니다.
            사용자는 로컬에 Node.js, PostgreSQL, Redis를 따로 설치하지 않아도 되고, compose 파일 하나로 개발 서버와
            의존 서비스를 함께 관리할 수 있습니다.
          </p>
          <p>
            처음 설치하는 사람은 아래 순서만 따라오면 됩니다. setup도 node 컨테이너 안에서 실행하므로 `npm install`을
            호스트 컴퓨터에서 먼저 실행하지 않습니다.
          </p>
          <CodeBlock>{`git clone git@github.com:Gjworks/plextype.git
cd plextype
docker compose run --rm node npm run setup
docker compose up -d
docker compose logs -f node`}</CodeBlock>
        </DocSection>

        <DocSection title="준비물">
          <p>
            설치 전에 아래 항목이 준비되어 있어야 합니다. 기본 설치 흐름은 Docker Compose 기준이므로 Docker Desktop만
            정상적으로 실행되고 있으면 Node.js, PostgreSQL, Redis를 로컬에 따로 설치하지 않아도 됩니다.
          </p>
          <PathTable items={requirementItems} />
        </DocSection>

        <DocSection title="1. 프로젝트 받기">
          <p>
            GitHub에서 Plextype 배포판을 내려받습니다. SSH clone을 사용하는 경우 아래 명령을 그대로 사용합니다.
            SSH key가 등록되어 있지 않은 환경이라면 GitHub에서 HTTPS 주소를 복사해 clone해도 됩니다.
          </p>
          <CodeBlock>{`git clone git@github.com:Gjworks/plextype.git
cd plextype`}</CodeBlock>
          <p>
            프로젝트 루트에는 `package.json`, `setup.mjs`, `docker-compose.yml`, `src` 폴더가 있어야 합니다.
            이후 모든 명령은 이 프로젝트 루트에서 실행합니다.
          </p>
        </DocSection>

        <DocSection title="2. Docker Compose 준비">
          <p>
            Plextype는 `node`, `postgres`, `redis` 세 서비스를 compose로 실행합니다. `node`는 Next.js 개발 서버와 setup을
            실행하고, `postgres`는 데이터베이스, `redis`는 세션과 알림 관련 저장소를 담당합니다.
          </p>
          <p>
            프로젝트 루트에 `docker-compose.yml`이 없다면 아래 내용을 그대로 만들어 사용할 수 있습니다. Plextype 배포판에는
            이 구성이 기본으로 포함되어 있으며, PostgreSQL, Redis, Node 22 개발 서버를 함께 정의합니다.
          </p>
          <p>
            아래 예시는 한 파일만 복사해서 바로 실행할 수 있도록 compose 안에 PostgreSQL 계정 정보를 함께 적습니다.
            대신 `POSTGRES_PASSWORD`는 그대로 쓰지 말고 프로젝트에 맞는 긴 비밀번호로 반드시 바꿉니다.
          </p>
          <CodeBlock>{`services:
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
    image: postgres:latest
    container_name: postgres
    environment:
      POSTGRES_USER: plextype
      POSTGRES_PASSWORD: change-this-to-a-long-random-password
      POSTGRES_DB: plextype
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
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
    driver: bridge`}</CodeBlock>
          <p>
            compose 파일을 준비했다면 setup을 먼저 실행합니다. 이 명령은 `node` 컨테이너를 임시로 띄워 `npm run setup`을
            실행하고, setup이 끝나면 해당 임시 컨테이너를 제거합니다. `postgres`와 `redis`는 의존 서비스로 함께 준비됩니다.
          </p>
          <CodeBlock>{`docker compose run --rm node npm run setup`}</CodeBlock>
          <PathTable items={composeItems} />
          <p>
            `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`는 PostgreSQL 컨테이너가 처음 초기화될 때 기본 계정과
            기본 데이터베이스를 만드는 값입니다. 위 예시라면 `plextype`라는 사용자와 `plextype`라는 데이터베이스가 만들어지고,
            비밀번호는 `POSTGRES_PASSWORD`에 적은 값이 됩니다.
          </p>
          <p>
            `POSTGRES_USER`나 `POSTGRES_DB`를 `plextype`가 아닌 다른 값으로 바꾼다면, compose 파일 안의 PostgreSQL
            `healthcheck`에 있는 `pg_isready -U plextype -d plextype` 값도 같이 바꿔야 합니다.
          </p>
          <p>
            중요한 점은 이 값들이 매번 다시 적용되는 설정이 아니라는 것입니다. `postgres_data` Docker volume이 이미 만들어진
            뒤에는 compose 파일의 `POSTGRES_PASSWORD`나 `POSTGRES_DB`를 바꿔도 기존 DB 계정과 데이터베이스가 자동으로
            바뀌지 않습니다. PostgreSQL 공식 이미지가 빈 데이터 디렉토리를 처음 발견했을 때만 이 초기화 값을 사용하기 때문입니다.
          </p>
          <p>
            setup에서 DB 정보를 물어볼 때는 compose 네트워크 안에서 접근하는 기준으로 입력합니다. 즉 DB 호스트는
            `localhost`가 아니라 compose 서비스 이름인 `postgres`입니다. Redis도 `redis`를 사용합니다.
          </p>
          <CodeBlock>{`DB 사용자명: plextype
DB 비밀번호: compose 파일의 POSTGRES_PASSWORD 값
DB 호스트 주소: postgres
DB 포트 번호: 5432
데이터베이스 이름: plextype
Redis 호스트 주소: redis
Redis 포트 번호: 6379`}</CodeBlock>
          <p>
            설치 직후 비밀번호를 잘못 적었다면 volume을 유지한 채 compose 파일만 수정해도 해결되지 않을 수 있습니다.
            데이터를 아직 만들지 않은 초기 설치 단계라면 아래 명령으로 컨테이너와 volume을 지운 뒤 다시 올릴 수 있습니다.
            이 명령은 PostgreSQL 데이터도 함께 삭제하므로, 이미 운영 데이터가 들어간 환경에서는 사용하면 안 됩니다.
          </p>
          <CodeBlock>{`docker compose down -v
docker compose run --rm node npm run setup
docker compose up -d`}</CodeBlock>
          <p>
            이미 데이터가 들어간 뒤 비밀번호를 바꾸고 싶다면 volume을 삭제하지 말고 PostgreSQL 안에서 `ALTER USER` 같은
            DB 명령으로 계정 비밀번호를 변경해야 합니다. 설치 문서의 초기화 명령은 “처음 설치를 다시 시작할 때”만 사용합니다.
          </p>
        </DocSection>

        <DocSection title="3. setup 실행">
          <p>
            배포판을 처음 받은 사람은 프로젝트 루트에서 setup을 한 번 실행합니다. Docker Compose 기준에서는 호스트에서
            `npm run setup`을 직접 실행하지 않고, 아래처럼 node 컨테이너 안에서 실행합니다.
          </p>
          <CodeBlock>{`docker compose run --rm node npm run setup`}</CodeBlock>
          <p>
            이 명령은 단순히 `.env`만 만드는 스크립트가 아니라 사이트 기본정보, 관리자 계정, DB 연결 정보, storage 폴더,
            패키지 설치, Prisma migration, Prisma generate, seed까지 이어서 처리합니다. setup은 내부에서 `npm install`을
            실행하므로 별도로 `npm install`을 먼저 실행하지 않습니다.
          </p>
        </DocSection>

        <DocSection title="4. setup 입력값">
          <p>
            `setup.mjs`는 프로젝트 초기 환경값을 입력받아 `.env`를 생성합니다. 사이트 이름은 영문 `APP_NAME`,
            한글 `APP_TITLE`로 입력받고, 실제 사이트 표시명 fallback을 위해 `PROJECT_TITLE`도 같이 생성합니다.
            아무 값도 입력하지 않으면 `plextype`가 기본값으로 들어갑니다.
          </p>
          <CodeBlock>{`사이트 이름 - 영문 APP_NAME: plextype
사이트 이름 - 한글 APP_TITLE: plextype
관리자 ID: admin
관리자 비밀번호: password123
관리자 이메일: admin@example.com
관리자 닉네임: 관리자`}</CodeBlock>
          <p>
            Docker Compose의 PostgreSQL을 그대로 쓴다면 DB 입력값은 compose 파일에 적은 `POSTGRES_USER`,
            `POSTGRES_PASSWORD`, `POSTGRES_DB`를 기준으로 입력합니다. Docker Compose 전체 실행 기준에서는 DB 호스트를
            `postgres`, Redis 호스트를 `redis`로 입력합니다.
          </p>
          <CodeBlock>{`APP_NAME=plextype
APP_TITLE=plextype
PROJECT_TITLE=plextype
NEXT_PUBLIC_DEFAULT_URL=http://localhost:3000
DATABASE_URL=postgresql://plextype:your-password@postgres:5432/plextype?schema=public
REDIS_URL=redis://redis:6379`}</CodeBlock>
          <p>
            관리자 계정 정보는 seed 단계에서 사용됩니다. JWT secret, secret key, public secret은 setup이 랜덤 문자열로
            생성합니다. `.env`가 이미 존재하면 덮어쓰지 않으므로, 값을 다시 만들고 싶다면 기존 `.env`를 백업하거나
            삭제한 뒤 setup을 다시 실행해야 합니다.
          </p>
        </DocSection>

        <DocSection title="5. setup이 처리하는 일">
          <p>
            setup 후반부는 아래 명령을 순서대로 실행합니다. `prisma:sync`는 코어 Prisma schema와 extension schema 조각을
            합쳐 `prisma/schema.prisma`를 다시 만드는 단계입니다. 배포판 사용자는 이 과정을 직접 외울 필요는 없지만,
            실패했을 때 어느 단계에서 멈췄는지 알면 문제를 찾기 쉽습니다.
          </p>
          <CodeBlock>{`npm install
npm run prisma:sync
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed`}</CodeBlock>
          <p>
            `migrate dev`에서 실패하면 대부분 DB 접속 정보가 틀렸거나 PostgreSQL 컨테이너가 아직 준비되지 않은 경우입니다.
            `seed`에서 실패하면 관리자 계정 중복값, 필수 컬럼, extension seed SQL을 확인합니다.
          </p>
        </DocSection>

        <DocSection title="6. 개발 서버 실행">
          <p>
            setup이 끝나면 전체 서비스를 백그라운드로 실행합니다. 이때 `node`, `postgres`, `redis`가 모두 compose로
            실행됩니다. 기본 포트는 3000입니다.
          </p>
          <CodeBlock>{`docker compose up -d
docker compose logs -f node`}</CodeBlock>
          <p>
            실행 후 브라우저에서 `http://localhost:3000`으로 접속합니다. 3000 포트가 이미 사용 중이면 Next.js가 다른
            포트를 자동으로 열지 못할 수 있으니 compose의 포트 매핑을 바꿔야 합니다.
          </p>
        </DocSection>

        <DocSection title="7. 로컬 Node로 실행할 때">
          <p>
            특별한 이유로 로컬 Node.js에서 직접 실행하고 싶다면 그때만 DB와 Redis를 compose로 올리고, setup과 dev를
            호스트에서 실행할 수 있습니다. 이 경우 DB/Redis host는 compose 내부 이름이 아니라 `localhost`입니다.
          </p>
          <CodeBlock>{`docker compose up -d postgres redis
npm run setup
npm run dev`}</CodeBlock>
          <p>
            로컬 Node 방식으로 setup을 실행한다면 DB 호스트는 `localhost`, Redis 호스트도 `localhost`로 입력합니다.
            기본 설치 문서는 Docker Compose 전체 실행을 기준으로 작성되어 있으므로, 이 방식은 선택 사항입니다.
          </p>
        </DocSection>

        <DocSection title="8. 자주 막히는 지점">
          <PathTable
            items={[
              {
                path: "Permission denied (publickey)",
                desc: "SSH clone 권한 문제입니다. GitHub SSH key를 등록하거나 HTTPS clone 주소를 사용합니다.",
              },
              {
                path: "Can't reach database server",
                desc: "PostgreSQL이 실행 중인지, DB host/port/user/password/name이 맞는지 확인합니다.",
              },
              {
                path: "getaddrinfo ENOTFOUND redis",
                desc: "Redis host가 현재 실행 방식과 맞지 않는 경우입니다. 로컬 Node는 `localhost`, Docker Node는 `redis`를 사용합니다.",
              },
              {
                path: ".env already exists",
                desc: "setup은 기존 `.env`를 덮어쓰지 않습니다. 다시 만들려면 기존 파일을 백업하거나 삭제한 뒤 실행합니다.",
              },
            ]}
          />
        </DocSection>

        <DocSection title="9. AGENTS.md 작성">
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

        <DocSection title="10. 빌드 확인">
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
    </FeatureDocPanel>
  );
};

export default GettingStartedPage;

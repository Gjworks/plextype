import { CodeBlock, DocSection, DocsShell, FeatureDocPanel } from "../_components";

const GettingStartedPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="시작하기"
        description="Gjworks 프로젝트를 처음 받은 뒤 실행 가능한 상태로 만드는 과정입니다."
      >
        <DocSection title="1. setup 실행">
          <p>
            배포판을 처음 받은 사람은 프로젝트 루트에서 `npm run setup`만 실행하면 됩니다. 이 명령은 단순히 `.env`만
            만드는 스크립트가 아니라, 사이트 기본정보 입력, 관리자 계정 입력, PostgreSQL 연결 정보 입력, storage 폴더
            준비, 패키지 설치, Prisma schema sync, migration, generate, seed까지 이어서 처리합니다.
          </p>
          <CodeBlock>{`npm run setup`}</CodeBlock>
          <p>
            setup은 이미 `npm install`을 내부에서 실행합니다. 따라서 설치 직후에 `npm install`을 먼저 실행할 필요는
            없습니다. DB가 아직 준비되지 않았다면 PostgreSQL 데이터베이스를 먼저 만든 뒤 setup을 실행해야 합니다.
          </p>
        </DocSection>

        <DocSection title="2. setup에서 입력하는 값">
          <p>
            `setup.mjs`는 프로젝트 초기 환경값을 입력받아 `.env`를 생성합니다. 사이트 이름은 영문 `APP_NAME`,
            한글 `APP_TITLE`로 입력받고, 실제 사이트 표시명 fallback을 위해 `PROJECT_TITLE`도 같이 생성합니다. 아무 값도
            입력하지 않으면 `plextype`가 기본값으로 들어갑니다.
          </p>
          <CodeBlock>{`APP_NAME=plextype
APP_TITLE=plextype
PROJECT_TITLE=plextype
NEXT_PUBLIC_DEFAULT_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/plextype?schema=public
REDIS_URL=redis://localhost:6379`}</CodeBlock>
          <p>
            관리자 계정 정보는 seed 단계에서 사용됩니다. JWT secret, secret key, public secret은 setup이 매번 안전한
            랜덤 문자열로 생성합니다. `.env`가 이미 존재하면 덮어쓰지 않으므로, 값을 다시 만들고 싶다면 기존 `.env`를
            백업하거나 삭제한 뒤 setup을 다시 실행해야 합니다.
          </p>
        </DocSection>

        <DocSection title="3. setup이 자동으로 처리하는 일">
          <p>
            setup 후반부는 아래 명령을 순서대로 실행합니다. `prisma:sync`는 코어 Prisma schema와 extension schema 조각을
            합쳐 `prisma/schema.prisma`를 다시 만드는 단계입니다.
          </p>
          <CodeBlock>{`npm install
npm run prisma:sync
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed`}</CodeBlock>
          <p>
            DB 접속 정보가 틀리거나 데이터베이스가 없으면 `migrate dev` 단계에서 실패합니다. 이 경우 PostgreSQL 실행
            상태, DB 이름 존재 여부, `.env`의 `DATABASE_URL`을 먼저 확인합니다. seed 단계에서 실패하면 관리자 계정
            중복값, `User.slug` 같은 필수 컬럼, extension seed의 SQL을 확인해야 합니다.
          </p>
        </DocSection>

        <DocSection title="4. 개발 서버 실행">
          <p>
            개발 서버는 기본적으로 3000 포트를 사용합니다. 현재 `dev` 스크립트는 `.env`와 `.env.development`를 함께
            읽습니다. 배포판 사용자는 setup으로 생성된 `.env`만 있어도 바로 실행할 수 있고, 개발 전용 값을 분리하고 싶으면
            `.env.development`를 추가하면 됩니다.
          </p>
          <CodeBlock>{`npm run dev`}</CodeBlock>
          <p>실행 후 `http://localhost:3000`으로 접속합니다. 포트가 이미 사용 중이면 터미널에 표시되는 주소를 따릅니다.</p>
        </DocSection>

        <DocSection title="5. 빌드 확인">
          <p>
            배포 전에는 반드시 빌드를 확인합니다. 이 단계는 TypeScript 타입, Next.js 라우트 구성, 서버 컴포넌트 import,
            generated Prisma client import가 함께 검증되는 가장 기본적인 안전장치입니다.
          </p>
          <CodeBlock>{`npm run build`}</CodeBlock>
          <p>
            로컬에서 Redis 컨테이너가 떠 있지 않으면 `getaddrinfo ENOTFOUND redis` 경고가 나올 수 있습니다. 빌드 자체가
            성공한다면 코드 타입/번들 단계는 통과한 것입니다. 운영 환경에서는 `REDIS_URL`이 실제 Redis 주소를 가리키는지
            별도로 확인해야 합니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default GettingStartedPage;

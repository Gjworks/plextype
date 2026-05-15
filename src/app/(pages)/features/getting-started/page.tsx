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
            프로젝트 루트에서 setup을 먼저 실행합니다. `setup.mjs`는 환경값 입력, `.env` 생성, storage 폴더 준비,
            패키지 설치, Prisma 초기화까지 이어서 처리합니다.
          </p>
          <CodeBlock>{`npm run setup`}</CodeBlock>
        </DocSection>

        <DocSection title="2. setup에서 입력하는 값">
          <p>
            `setup.mjs`는 프로젝트 초기 환경값을 입력받아 `.env`를 생성합니다. 사이트 이름은 영문 `APP_NAME`,
            한글 `APP_TITLE`로 관리하고 값이 없으면 plextype 기본값을 사용합니다.
          </p>
          <CodeBlock>{`APP_NAME=plextype
APP_TITLE=plextype
NEXT_PUBLIC_DEFAULT_URL=http://localhost:3000
DATABASE_URL=postgresql://...`}</CodeBlock>
          <p>
            관리자 계정 정보와 PostgreSQL 연결 정보도 setup에서 입력합니다. JWT secret, secret key 같은 보안 토큰은
            setup이 자동 생성합니다.
          </p>
        </DocSection>

        <DocSection title="3. setup이 자동으로 처리하는 일">
          <p>현재 setup은 아래 작업을 자동으로 실행합니다. 따라서 별도로 `npm install`을 먼저 실행할 필요가 없습니다.</p>
          <CodeBlock>{`npm install
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed`}</CodeBlock>
          <p>
            DB가 준비되어 있지 않거나 접속 정보가 틀리면 Prisma 단계에서 실패합니다. 이 경우 PostgreSQL 실행 상태와
            `.env`의 `DATABASE_URL`을 먼저 확인합니다.
          </p>
        </DocSection>

        <DocSection title="4. 개발 서버 실행">
          <p>개발 서버는 기본적으로 3000 포트를 사용합니다.</p>
          <CodeBlock>{`npm run dev`}</CodeBlock>
          <p>실행 후 `http://localhost:3000`으로 접속합니다. 포트가 이미 사용 중이면 터미널에 표시되는 주소를 따릅니다.</p>
        </DocSection>

        <DocSection title="5. 빌드 확인">
          <p>배포 전에는 반드시 빌드를 확인합니다.</p>
          <CodeBlock>{`npm run build`}</CodeBlock>
          <p>
            로컬에서 Redis 컨테이너가 떠 있지 않으면 `getaddrinfo ENOTFOUND redis` 경고가 나올 수 있습니다. 빌드 자체가
            성공한다면 코드 타입/번들 단계는 통과한 것입니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default GettingStartedPage;

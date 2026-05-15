import { CodeBlock, DocSection, DocsShell, FeatureDocPanel, PathTable } from "../_components";

const proxyPaths = [
  { path: "src/proxy.ts", desc: "Next.js가 읽는 고정 진입점입니다. 직접 로직을 넣지 않고 @project/proxy만 export합니다." },
  { path: "src/core/proxy/defaultProxy.ts", desc: "Plextype가 제공하는 기본 proxy 구현입니다. 인증, 관리자 접근, CSRF origin 검증을 포함합니다." },
  { path: "src/extensions/proxy.ts", desc: "프로젝트별 proxy 커스텀 파일입니다. 이 파일이 있으면 기본 proxy보다 우선 사용됩니다." },
];

const prismaPaths = [
  { path: "src/core/prisma/schema.prisma", desc: "Plextype 코어 기본 스키마입니다. 코어 개발자가 관리하는 기준 파일입니다." },
  { path: "src/extensions/prisma/schema.prisma", desc: "프로젝트별 Prisma 모델을 한 파일로 추가할 때 사용합니다." },
  { path: "src/extensions/prisma/schema/*.prisma", desc: "프로젝트별 모델을 여러 조각으로 나눠 관리할 때 사용합니다." },
  { path: "prisma/schema.prisma", desc: "sync 결과물입니다. 직접 수정하지 않고 npm run prisma:sync로 생성합니다." },
];

const ProjectApiPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="Project API"
        description="코어 업데이트를 유지하면서 proxy, Prisma, 배포판 동기화를 프로젝트별로 확장하는 방법입니다."
      >
        <DocSection title="Proxy 확장">
          <p>
            `src/proxy.ts`는 Next.js가 찾는 고정 파일이라 삭제하거나 gitignore 처리하지 않습니다. 대신 내부 구현은
            `@project/proxy` alias로 위임합니다. 이 방식은 배포판 코어의 proxy 진입점을 유지하면서도, 프로젝트마다 인증
            예외 경로, 접근 차단, 리다이렉트, 헤더 보정 로직을 자유롭게 바꿀 수 있게 해줍니다.
          </p>
          <PathTable items={proxyPaths} />
          <CodeBlock>{`// src/extensions/proxy.ts
import type { NextRequest } from "next/server";
import { proxy as defaultProxy } from "@/core/proxy/defaultProxy";

export async function proxy(request: NextRequest) {
  // 프로젝트별 차단, 리다이렉트, 헤더 처리 등을 먼저 수행할 수 있습니다.
  return defaultProxy(request);
}`}</CodeBlock>
          <p>
            새 proxy를 작성할 때 기본 보안 로직을 완전히 버릴 필요가 없다면 `defaultProxy(request)`를 마지막에 호출하는
            형태를 권장합니다. 기본 proxy에는 관리자 접근 제어, 로그인 사용자 접근 제어, Redis active session 확인,
            CSRF origin 검증이 포함되어 있습니다.
          </p>
        </DocSection>

        <DocSection title="Prisma 확장">
          <p>
            DB 모델을 추가할 때 코어 `prisma/schema.prisma`를 직접 수정하지 않습니다. extension schema fragment를 만들고
            `npm run prisma:sync`로 루트 스키마를 생성합니다. 루트 `prisma/schema.prisma`는 결과물이므로 직접 수정하지
            않습니다. 코어 업데이트를 받아도 프로젝트별 모델은 `src/extensions/prisma`에 남아 있고, sync를 다시 돌리면
            코어 스키마와 합쳐집니다.
          </p>
          <PathTable items={prismaPaths} />
          <CodeBlock>{`// src/extensions/prisma/schema/issue.prisma
model IssueMeta {
  id         Int      @id @default(autoincrement())
  documentId Int
  priority   String?
  createdAt  DateTime @default(now())

  @@index([documentId])
}`}</CodeBlock>
          <p>
            코어 모델과 관계를 맺고 싶을 때는 우선 scalar 컬럼을 사용하세요. 예를 들어 `documentId Int`, `userId Int`를
            두고 query에서 조합하면 코어의 `Document`, `User` 모델에 back relation을 추가하지 않아도 됩니다. Prisma의
            양방향 relation을 강제하면 코어 schema 수정이 필요해져 업데이트 안정성이 떨어집니다.
          </p>
        </DocSection>

        <DocSection title="Prisma 명령">
          <p>
            `migrate:*`와 `dbpush:push`는 실행 전에 자동으로 `prisma:sync`를 먼저 실행합니다. 사용자가 직접 기억해야 할
            것은 “모델 조각을 extension에 추가한 뒤 migrate 명령을 실행한다” 정도입니다.
          </p>
          <CodeBlock>{`npm run prisma:sync
npm run prisma:generate
npm run migrate:dev
npm run dbpush:push`}</CodeBlock>
          <p>
            `prisma:sync`는 schema 파일만 생성합니다. DB에 실제 테이블을 만들려면 `npm run migrate:dev`를 실행해야
            합니다. 타입만 다시 만들고 싶다면 `npm run prisma:generate`를 사용합니다. 빠른 실험용으로는 `dbpush:push`도
            가능하지만, 운영 배포를 생각한다면 migration 파일을 남기는 `migrate:dev` 흐름이 더 안전합니다.
          </p>
        </DocSection>

        <DocSection title="Extension seed">
          <p>
            기본 seed는 관리자 계정, 정회원 그룹, notice 게시판, 사이트 기본정보를 생성합니다. 프로젝트별 초기 데이터가
            필요하면 `src/extensions/prisma/seed.js`를 추가합니다. 이 파일은 기본 seed 트랜잭션 안에서 실행되며 `pg`
            client와 `bcrypt`를 전달받습니다.
          </p>
          <CodeBlock>{`// src/extensions/prisma/seed.js
module.exports = async ({ client }) => {
  await client.query(\`
    INSERT INTO "IssueMeta" ("documentId", "priority", "createdAt")
    VALUES ($1, $2, NOW())
    ON CONFLICT DO NOTHING
  \`, [1, "normal"]);
};`}</CodeBlock>
          <p>
            extension seed는 반드시 idempotent하게 작성해야 합니다. 같은 seed를 여러 번 실행해도 중복 데이터가 쌓이지 않게
            `ON CONFLICT`, unique key, 사전 조회를 사용하세요.
          </p>
        </DocSection>

        <DocSection title="배포판 sync">
          <p>
            `sync-to-plextype` workflow는 개인 extension을 제거한 뒤 코어 Prisma 기준으로 schema와 generated client를
            재생성하고 plextype 저장소로 푸시합니다. 즉 gjworks 프로젝트에서 사용하던 개인 DB 모델, 개인 proxy, 개인
            레이아웃은 plextype 배포판에 섞이지 않습니다.
          </p>
          <CodeBlock>{`src/extensions/
src/app/(extensions)/
AGENTS.md
.opencode/`}</CodeBlock>
          <p>
            위 항목은 배포판에서 제외됩니다. 반대로 `src/core/prisma`, `src/core/proxy`, `src/proxy.ts`는 배포판의 기본
            동작을 보장하기 위해 유지됩니다. 배포판을 받아간 사람은 다시 자기 프로젝트의 `src/extensions`에 필요한 확장을
            추가하면 됩니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default ProjectApiPage;

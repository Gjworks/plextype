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
            `@project/proxy` alias로 위임합니다.
          </p>
          <PathTable items={proxyPaths} />
          <CodeBlock>{`// src/extensions/proxy.ts
import type { NextRequest } from "next/server";
import { proxy as defaultProxy } from "@/core/proxy/defaultProxy";

export async function proxy(request: NextRequest) {
  // 프로젝트별 차단, 리다이렉트, 헤더 처리 등을 먼저 수행할 수 있습니다.
  return defaultProxy(request);
}`}</CodeBlock>
        </DocSection>

        <DocSection title="Prisma 확장">
          <p>
            DB 모델을 추가할 때 코어 `prisma/schema.prisma`를 직접 수정하지 않습니다. extension schema fragment를 만들고
            `npm run prisma:sync`로 루트 스키마를 생성합니다.
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
        </DocSection>

        <DocSection title="Prisma 명령">
          <p>`migrate:*`와 `dbpush:push`는 실행 전에 자동으로 `prisma:sync`를 먼저 실행합니다.</p>
          <CodeBlock>{`npm run prisma:sync
npm run prisma:generate
npm run migrate:dev
npm run dbpush:push`}</CodeBlock>
          <p>
            extension 모델에서 코어 모델과 관계를 맺어야 한다면, 우선 `documentId`, `userId` 같은 scalar 컬럼으로 연결하는
            방식을 권장합니다. Prisma relation backref는 코어 모델 수정이 필요할 수 있습니다.
          </p>
        </DocSection>

        <DocSection title="배포판 sync">
          <p>
            `sync-to-plextype` workflow는 개인 extension을 제거한 뒤 코어 Prisma 기준으로 schema와 generated client를
            재생성하고 plextype 저장소로 푸시합니다.
          </p>
          <CodeBlock>{`src/extensions/
src/app/(extensions)/
AGENTS.md
.opencode/`}</CodeBlock>
          <p>
            위 항목은 배포판에서 제외됩니다. 반대로 `src/core/prisma`, `src/core/proxy`, `src/proxy.ts`는 배포판의 기본
            동작을 보장하기 위해 유지됩니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default ProjectApiPage;

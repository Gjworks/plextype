import { CodeBlock, DocSection, DocsShell, FeatureDocPanel } from "../_components";

const OperationsPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="운영 규칙"
        description="코어 업데이트를 계속 받으면서 프로젝트별 커스텀을 안전하게 유지하는 규칙입니다."
      >
        <DocSection title="코어 파일 수정 최소화">
          <p>
            `src/app/(modules)`, `src/modules`, `src/core`는 코어 업데이트 대상입니다. 레이아웃이나 스킨 변경 때문에
            이 파일들을 수정하기 시작하면 업데이트 충돌 가능성이 커집니다.
          </p>
          <p>
            코어 파일은 프레임워크가 계속 개선되는 영역이고, 프로젝트별 기능은 `src/extensions`와
            `src/app/(extensions)`가 담당합니다. 코어 수정이 필요한 상황은 버그 수정, 공통 API 추가,
            fallback 구조 개선처럼 모든 프로젝트에 이득이 있는 경우로 제한하는 것이 좋습니다.
          </p>
        </DocSection>

        <DocSection title="새 라우트는 app/(extensions)">
          <p>
            프로젝트별 URL이 필요하면 코어 라우트에 끼워 넣지 않고 `src/app/(extensions)`를 사용합니다.
            예를 들어 별도 대시보드, 이벤트 페이지, 특정 고객용 화면은 코어의 `posts` 라우터를 수정하지
            않아도 독립 route group으로 만들 수 있습니다.
          </p>
          <CodeBlock>{`src/app/(extensions)/dashboard/page.tsx
src/app/(extensions)/posts/bin/roadmap/page.tsx`}</CodeBlock>
          <p>
            route group 이름은 URL에 노출되지 않습니다. 따라서 `src/app/(extensions)/dashboard/page.tsx`는
            실제로 `/dashboard`로 접근됩니다.
          </p>
        </DocSection>

        <DocSection title="커스텀은 extensions">
          <p>
            레이아웃, 홈 페이지, 게시판 스킨, 스킨별 capability, 트리거는 `src/extensions`에서 관리합니다.
            이 폴더는 git 제외 대상이므로 프로젝트별로 다르게 유지할 수 있습니다.
          </p>
          <p>
            단, `src/extensions/index.tsx` 같은 진입 파일은 배포판에서도 fallback이 깨지지 않도록 기본 파일이
            있어야 합니다. 실제 프로젝트에서는 이 파일을 기준으로 필요한 export를 늘려가면 됩니다.
          </p>
          <CodeBlock>{`src/extensions/index.tsx
src/extensions/proxy.ts
src/extensions/postCapabilities.ts
src/extensions/prisma/schema/*.prisma
src/extensions/prisma/seed.js`}</CodeBlock>
        </DocSection>

        <DocSection title="업데이트 받을 때">
          <p>
            배포판 코어를 업데이트할 때는 먼저 코어 변경을 받은 뒤, 프로젝트의 `src/extensions`와
            `src/app/(extensions)`가 여전히 정상적으로 import되는지 확인합니다. Prisma 확장 스키마가 있다면
            `npm run prisma:sync`를 먼저 실행해서 generated schema가 최신인지 확인합니다.
          </p>
          <CodeBlock>{`npm run prisma:sync
npm run prisma:generate
npm run build`}</CodeBlock>
          <p>
            충돌이 난다면 코어 파일을 프로젝트용으로 고치는 방향보다, 코어가 extension hook이나 registry를
            더 잘 제공하도록 개선하는 방향이 장기적으로 안정적입니다.
          </p>
        </DocSection>

        <DocSection title="배포 전 확인">
          <CodeBlock>{`npm run build`}</CodeBlock>
          <p>
            빌드가 통과하면 TypeScript와 Next 번들 단계는 통과한 것입니다. Redis 같은 외부 서비스 경고는 로컬 실행 환경에
            따라 별도로 확인합니다.
          </p>
          <p>
            보안 설정을 바꾼 뒤에는 CSP 때문에 외부 폰트나 이미지가 막히지 않는지도 브라우저 콘솔에서 확인합니다.
            특히 Pretendard CDN, 업로드 이미지, Next Image remote pattern은 배포 도메인 기준으로 다시 확인해야 합니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default OperationsPage;

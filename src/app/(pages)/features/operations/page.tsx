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
        </DocSection>

        <DocSection title="새 라우트는 app/(extensions)">
          <p>프로젝트별 URL이 필요하면 코어 라우트에 끼워 넣지 않고 `src/app/(extensions)`를 사용합니다.</p>
          <CodeBlock>{`src/app/(extensions)/dashboard/page.tsx
src/app/(extensions)/posts/bin/roadmap/page.tsx`}</CodeBlock>
        </DocSection>

        <DocSection title="커스텀은 extensions">
          <p>
            레이아웃, 홈 페이지, 게시판 스킨, 스킨별 capability, 트리거는 `src/extensions`에서 관리합니다.
            이 폴더는 git 제외 대상이므로 프로젝트별로 다르게 유지할 수 있습니다.
          </p>
        </DocSection>

        <DocSection title="배포 전 확인">
          <CodeBlock>{`npm run build`}</CodeBlock>
          <p>
            빌드가 통과하면 TypeScript와 Next 번들 단계는 통과한 것입니다. Redis 같은 외부 서비스 경고는 로컬 실행 환경에
            따라 별도로 확인합니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default OperationsPage;

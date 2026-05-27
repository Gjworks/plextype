import { CodeBlock, DocSection, DocsShell, FeatureDocPanel } from "../_components";

const OperationsPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="운영 규칙"
        description="자기 사이트를 별도 Git으로 관리하면서도 Plextype 코어 패치를 계속 받아오는 운영 방식입니다."
      >
        <DocSection title="권장 Git 구조">
          <p>
            Plextype를 받아서 새 사이트를 만들 때는 프로젝트 저장소를 완전히 새로 만들되, 원본 Plextype 저장소는
            `upstream` remote로 남겨두는 방식을 권장합니다. 이렇게 하면 사용자는 자기 사이트 코드를 `origin`에 관리하고,
            Gjworks/Plextype에서 나온 패치는 `upstream`에서 계속 받아올 수 있습니다.
          </p>
          <CodeBlock>{`origin   = 사용자 개인/회사 사이트 저장소
upstream = Gjworks/plextype 원본 저장소`}</CodeBlock>
          <p>
            이 구조의 핵심은 “사용자 프로젝트는 독립 저장소이지만, 코어는 원본 저장소의 변경을 계속 따라갈 수 있다”는
            점입니다. 단, 코어 파일을 직접 많이 고칠수록 업데이트 때 충돌이 늘어나므로 커스텀 코드는 가능한 한
            extension 영역에 둡니다.
          </p>
        </DocSection>

        <DocSection title="처음 프로젝트 만들기">
          <p>
            원본 저장소를 clone한 뒤, 기존 `origin` 이름을 `upstream`으로 바꾸고 사용자의 새 저장소를 `origin`으로
            등록합니다. 이후부터 사용자는 자기 저장소에 push하고, Plextype 패치는 upstream에서 가져옵니다.
          </p>
          <CodeBlock>{`git clone git@github.com:Gjworks/plextype.git my-site
cd my-site

git remote rename origin upstream
git remote add origin git@github.com:USER/my-site.git

git push -u origin main`}</CodeBlock>
          <p>
            이미 GitHub에서 빈 저장소를 만들어 둔 상태라면 `USER/my-site.git` 부분만 자신의 저장소 주소로 바꾸면 됩니다.
            팀 프로젝트라면 이 `origin` 저장소가 실제 운영 사이트의 기준 저장소가 됩니다.
          </p>
        </DocSection>

        <DocSection title="패치 받아오기">
          <p>
            Gjworks/Plextype 쪽에 보안 패치, 버그 수정, 새 기능이 올라오면 `upstream`에서 변경분을 가져와 현재 사이트
            브랜치에 합칩니다. 이때 충돌이 거의 나지 않게 하려면 코어 파일보다 extension 영역을 우선 사용해야 합니다.
          </p>
          <CodeBlock>{`git fetch upstream
git merge upstream/main

npm run prisma:sync
npm run prisma:generate
npm run build`}</CodeBlock>
          <p>
            이력을 더 깔끔하게 유지하고 싶은 팀은 `merge` 대신 `rebase`를 사용할 수 있습니다. 다만 rebase는 공유 브랜치에서
            조심해야 하므로, 익숙하지 않다면 merge 흐름이 더 안전합니다.
          </p>
          <CodeBlock>{`git fetch upstream
git rebase upstream/main`}</CodeBlock>
        </DocSection>

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

        <DocSection title="커스텀 위치">
          <p>
            사용자가 만든 사이트 고유 기능은 코어 패치와 섞이지 않도록 별도 영역에 둡니다. 레이아웃 교체, 홈 화면,
            게시판 스킨, proxy 확장, trigger, 프로젝트별 Prisma 모델은 extension 구조를 우선 사용합니다.
          </p>
          <CodeBlock>{`src/extensions/index.tsx
src/extensions/layouts/*
src/extensions/pages/*
src/extensions/posts/tpl/*
src/extensions/proxy.ts
src/extensions/prisma/schema/*.prisma
src/extensions/prisma/seed.js
src/app/(extensions)/*`}</CodeBlock>
          <p>
            업데이트 충돌이 난다면 “코어 파일을 내 사이트용으로 더 고친다”보다 “내 사이트 로직을 extension으로 옮긴다”가
            장기적으로 훨씬 안정적입니다. 코어에 hook이나 registry가 부족해서 어쩔 수 없이 코어를 고쳐야 한다면, 그 변경은
            모든 프로젝트가 함께 쓸 수 있는 형태로 정리하는 편이 좋습니다.
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

        <DocSection title="AGENTS.md 권장 규칙">
          <p>
            AI 도구나 팀원이 프로젝트를 수정할 때도 같은 원칙을 지키도록, 사용자 사이트 저장소의 `AGENTS.md`에는
            “코어보다 extension을 우선 사용한다”는 규칙을 명확히 적어두는 것이 좋습니다. 원본 Plextype의 `AGENTS.md`를
            그대로 고치기보다, 사용자 프로젝트 저장소에서 자기 운영 규칙을 관리하세요.
          </p>
          <CodeBlock>{`# Project Custom Rules

- Plextype 코어 파일(src/core, src/modules, src/app/(modules))은 가능한 한 수정하지 않는다.
- 사이트별 기능은 src/extensions 또는 src/app/(extensions)에 구현한다.
- DB 모델 추가는 src/extensions/prisma/schema/*.prisma에 작성한다.
- 원본 패치 반영 전후로 npm run prisma:sync, npm run prisma:generate, npm run build를 실행한다.
- 코어 수정이 필요하면 먼저 extension hook, registry, action wrapper로 해결 가능한지 검토한다.`}</CodeBlock>
          <p>
            이 규칙은 업데이트 받을 때 충돌을 줄이는 데 꽤 효과적입니다. 특히 “스킨 바꾸려고 `src/app/(modules)/posts`를
            직접 수정하는” 식의 작업을 막아주는 안전장치가 됩니다.
          </p>
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

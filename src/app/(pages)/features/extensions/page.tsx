import { CodeBlock, DocSection, DocsShell, FeatureDocPanel, PathTable } from "../_components";

const extensionPaths = [
  { path: "src/extensions/index.tsx", desc: "프로젝트 확장 진입점입니다. 레이아웃, 홈, 스킨을 export합니다." },
  { path: "src/extensions/styles/style.css", desc: "프로젝트별 전역 스타일입니다. Tailwind @source로 스캔 대상에 포함됩니다." },
  { path: "src/extensions/triggerRegistry.ts", desc: "프로젝트별 트리거 핸들러와 trigger.json을 코어에 연결합니다." },
  { path: "src/extensions/postCapabilities.ts", desc: "게시판 스킨별 defaultStatus, statusCounts 같은 동작을 선언합니다." },
  { path: "src/extensions/posts/tpl/*", desc: "게시판 스킨 컴포넌트를 보관합니다." },
  { path: "src/extensions/layouts/*", desc: "프로젝트별 레이아웃을 보관합니다." },
];

const ExtensionsPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="Extensions"
        description="개인 프로젝트에서 코어를 수정하지 않고 화면과 기능을 바꾸는 방법입니다."
      >
        <DocSection title="기본 진입점">
          <p>
            `src/extensions/index.tsx`는 프로젝트별 화면 확장의 중심 파일입니다. `@project/extensions` alias는 이 파일을
            먼저 찾고, 파일이 없으면 `src/core/registry/defaultRegistry.tsx`로 fallback합니다. 배포판에는 기본 registry가
            포함되므로 clean clone 상태에서도 앱이 깨지지 않습니다.
          </p>
          <CodeBlock>{`import type React from "react";

import DefaultLayout from "./layouts/default/Layout";
import AuthLayout from "./layouts/auth/Layout";
import HomePage from "./pages/home";
import IssueTrackerListSkin from "./posts/tpl/issuetracker/list";

export const postSkins: Record<string, React.ComponentType<any>> = {
  issuetracker: IssueTrackerListSkin,
};

export { DefaultLayout, AuthLayout, HomePage };`}</CodeBlock>
          <p>
            여기서 export한 이름은 코어 라우트가 직접 사용합니다. 예를 들어 `DefaultLayout`을 export하면 `src/app/page.tsx`,
            `src/app/(pages)/layout.tsx`, `src/app/(modules)/posts/layout.tsx` 같은 코어 라우트가 자동으로 프로젝트별
            레이아웃을 사용합니다.
          </p>
        </DocSection>

        <DocSection title="확장 디렉토리">
          <p>
            `src/extensions`는 gitignore 대상입니다. 코어 저장소 업데이트와 개인 프로젝트 커스텀을 분리하기 위한 의도적인
            구조입니다. 배포판을 받아간 사람은 이 폴더를 자기 프로젝트 안에서 자유롭게 만들고 관리하면 됩니다.
          </p>
          <PathTable items={extensionPaths} />
        </DocSection>

        <DocSection title="Tailwind 스캔">
          <p>
            `src/extensions`는 gitignore 대상이지만 Tailwind 클래스는 생성되어야 합니다. 그래서 `src/app/globals.css`에서
            `@source "../extensions";`와 `@source "./(extensions)";`를 명시합니다.
          </p>
          <CodeBlock>{`@import "tailwindcss";
@source "../extensions";
@source "./(extensions)";`}</CodeBlock>
          <p>
            extension 컴포넌트에 Tailwind class를 추가했는데 스타일이 안 먹는다면, 먼저 해당 파일이 `src/extensions` 또는
            `src/app/(extensions)` 아래에 있는지 확인하세요. 동적으로 조합한 클래스명은 Tailwind가 감지하지 못할 수 있으니
            가능한 한 완성된 클래스명을 코드에 직접 두는 것이 안전합니다.
          </p>
        </DocSection>

        <DocSection title="확장 우선순위">
          <p>
            대부분의 확장은 “프로젝트 파일이 있으면 프로젝트 파일을 쓰고, 없으면 코어 fallback을 쓴다”는 규칙을 따릅니다.
            이 규칙 덕분에 처음 설치한 사람은 아무것도 만들지 않아도 기본 화면이 나오고, 커스텀을 원하는 사람만 필요한
            파일을 추가하면 됩니다.
          </p>
          <CodeBlock>{`@project/extensions
  1. src/extensions/index.tsx
  2. src/core/registry/defaultRegistry.tsx

@project/proxy
  1. src/extensions/proxy.ts
  2. src/core/proxy/defaultProxy.ts

@project/post-capabilities
  1. src/extensions/postCapabilities.ts
  2. src/core/registry/defaultPostCapabilities.ts`}</CodeBlock>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default ExtensionsPage;

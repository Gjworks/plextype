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
          <p>`src/extensions/index.tsx`가 있으면 `@project/extensions`는 이 파일을 우선 사용합니다.</p>
          <CodeBlock>{`import type React from "react";

import DefaultLayout from "./layouts/default/Layout";
import AuthLayout from "./layouts/auth/Layout";
import HomePage from "./pages/home";
import IssueTrackerListSkin from "./posts/tpl/issuetracker/list";

export const postSkins: Record<string, React.ComponentType<any>> = {
  issuetracker: IssueTrackerListSkin,
};

export { DefaultLayout, AuthLayout, HomePage };`}</CodeBlock>
        </DocSection>

        <DocSection title="확장 디렉토리">
          <PathTable items={extensionPaths} />
        </DocSection>

        <DocSection title="Tailwind 스캔">
          <p>
            `src/extensions`는 gitignore 대상이지만 Tailwind 클래스는 생성되어야 합니다. 그래서 `src/app/globals.css`에서
            `@source "../extensions";`와 `@source "./(extensions)";`를 명시합니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default ExtensionsPage;

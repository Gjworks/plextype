import { CodeBlock, DocSection, DocsShell, FeatureDocPanel, PathTable } from "../_components";

const layoutPaths = [
  { path: "src/layouts/default/Layout.tsx", desc: "코어 기본 사이트 레이아웃입니다. 헤더, 네비게이션, 본문, 푸터를 포함합니다." },
  { path: "src/layouts/auth/Layout.tsx", desc: "코어 기본 인증 레이아웃입니다. 로그인/회원가입 화면에 사용합니다." },
  { path: "src/page/home.tsx", desc: "코어 기본 홈 페이지 템플릿입니다." },
  { path: "src/core/registry/defaultRegistry.tsx", desc: "extensions가 없을 때 위 파일들을 export합니다." },
];

const LayoutsPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="Layouts & Page"
        description="기본 레이아웃을 확인하고, 프로젝트별 레이아웃으로 교체하는 방법입니다."
      >
        <DocSection title="코어 기본값">
          <PathTable items={layoutPaths} />
        </DocSection>

        <DocSection title="app 라우트의 연결 방식">
          <p>코어 라우트는 실제 레이아웃 파일을 직접 import하지 않고 `@project/extensions`를 봅니다.</p>
          <CodeBlock>{`import { DefaultLayout } from "@project/extensions";
import { AuthLayout } from "@project/extensions";`}</CodeBlock>
        </DocSection>

        <DocSection title="프로젝트별 레이아웃 교체">
          <p>`src/extensions/index.tsx`에서 같은 이름으로 export하면 기존 app 라우트가 자동으로 커스텀 레이아웃을 사용합니다.</p>
          <CodeBlock>{`import DefaultLayout from "./layouts/default/Layout";
import AuthLayout from "./layouts/auth/Layout";
import HomePage from "./pages/home";

export const postSkins = {};
export { DefaultLayout, AuthLayout, HomePage };`}</CodeBlock>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default LayoutsPage;

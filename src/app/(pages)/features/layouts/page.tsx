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
          <p>
            `src/layouts`와 `src/page`는 배포판이 처음 제공하는 기본 화면입니다. 이 파일들은 사용자가
            확장 파일을 아직 만들지 않았을 때만 사용됩니다. 즉, 새 프로젝트를 설치한 직후에도 사이트가
            비어 보이지 않도록 제공되는 기준 레이아웃이라고 보면 됩니다.
          </p>
          <PathTable items={layoutPaths} />
        </DocSection>

        <DocSection title="app 라우트의 연결 방식">
          <p>
            코어 라우트는 `src/layouts/default/Layout.tsx` 같은 실제 파일을 직접 import하지 않습니다.
            대신 `@project/extensions`를 먼저 바라봅니다. 이 alias는 프로젝트 확장이 있으면 확장을
            사용하고, 없으면 코어의 기본 registry로 fallback합니다.
          </p>
          <p>
            이 구조 덕분에 `src/app/(modules)`나 `src/app/(pages)`의 라우터 파일을 직접 수정하지 않아도
            사이트 전체 레이아웃, 인증 레이아웃, 홈 화면을 프로젝트별로 교체할 수 있습니다.
          </p>
          <CodeBlock>{`import { DefaultLayout } from "@project/extensions";
import { AuthLayout } from "@project/extensions";`}</CodeBlock>
        </DocSection>

        <DocSection title="프로젝트별 레이아웃 교체">
          <p>
            `src/extensions/index.tsx`에서 같은 이름으로 export하면 기존 app 라우트가 자동으로 커스텀
            레이아웃을 사용합니다. 코어 레이아웃을 복사해서 수정하는 방식보다 이 방식이 안전합니다.
            코어 업데이트를 받아도 프로젝트 레이아웃은 `src/extensions` 안에 남아 있기 때문입니다.
          </p>
          <CodeBlock>{`import DefaultLayout from "./layouts/default/Layout";
import AuthLayout from "./layouts/auth/Layout";
import HomePage from "./pages/home";

export const postSkins = {};
export { DefaultLayout, AuthLayout, HomePage };`}</CodeBlock>
          <p>
            `DefaultLayout`은 일반 페이지와 게시판 화면의 바깥 구조를 담당하고, `AuthLayout`은 로그인과
            회원가입처럼 인증 화면에 최적화된 구조를 담당합니다. 홈 화면만 바꾸고 싶다면
            `HomePage`만 export해도 됩니다.
          </p>
        </DocSection>

        <DocSection title="권장 작업 순서">
          <p>
            먼저 `/previews/layouts/default`와 `/previews/layouts/auth`에서 코어 기본 형태를 확인합니다.
            그 다음 필요한 레이아웃만 `src/extensions/layouts`로 복사하거나 새로 작성하고,
            마지막으로 `src/extensions/index.tsx`에서 export합니다.
          </p>
          <CodeBlock>{`src/extensions/layouts/default/Layout.tsx
src/extensions/layouts/auth/Layout.tsx
src/extensions/pages/home.tsx
src/extensions/index.tsx`}</CodeBlock>
          <p>
            라우팅을 추가해야 하는 경우에는 레이아웃 파일 안에서 억지로 분기하지 말고
            `src/app/(extensions)` 아래에 새 route를 추가하는 편이 유지보수에 좋습니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default LayoutsPage;

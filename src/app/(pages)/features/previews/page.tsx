import { DocLinkList, DocSection, DocsShell, FeatureDocPanel } from "../_components";

const previewItems = [
  { href: "/previews", label: "Preview Index", desc: "미리보기 목차입니다." },
  { href: "/previews/page/home", label: "Home Page", desc: "src/page/home.tsx 기본 홈 페이지입니다." },
  { href: "/previews/layouts/default", label: "Default Layout", desc: "src/layouts/default/Layout.tsx를 단독으로 확인합니다." },
  { href: "/previews/layouts/auth", label: "Auth Layout", desc: "src/layouts/auth/Layout.tsx를 단독으로 확인합니다." },
];

const PreviewsDocsPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="Previews"
        description="코어가 기본으로 제공하는 화면을 현재 사이트 레이아웃과 겹치지 않게 확인하는 방법입니다."
      >
        <DocSection title="미리보기 주소">
          <p>
            `/previews`는 코어가 제공하는 기본 화면을 빠르게 확인하기 위한 개발용 문서 화면입니다.
            실제 사이트의 홈, 로그인, 기본 레이아웃이 어떤 형태로 제공되는지 확인한 뒤 프로젝트별 확장으로
            교체할지 판단할 수 있습니다.
          </p>
          <DocLinkList items={previewItems.map((item) => ({ ...item, meta: item.href }))} />
        </DocSection>

        <DocSection title="왜 route group을 분리했나">
          <p>
            `/previews`는 `src/app/(previews)` 아래에 있어서 `src/app/(pages)/layout.tsx`를 타지 않습니다. 그래서
            기본 레이아웃 자체를 볼 때 현재 사이트 레이아웃과 중첩되지 않습니다.
          </p>
          <p>
            예를 들어 기본 `DefaultLayout`을 현재 사이트 레이아웃 안에서 다시 렌더링하면 헤더와 푸터가 두 번 보일
            수 있습니다. route group을 분리하면 미리보기 화면이 독립적으로 렌더링되어 “이 파일 자체가 어떻게
            생겼는지”만 확인할 수 있습니다.
          </p>
        </DocSection>

        <DocSection title="언제 사용하나">
          <p>
            코어 레이아웃을 수정했거나 `src/layouts` 기본 파일을 새로 추가했을 때 먼저 `/previews`에서 확인합니다.
            프로젝트 확장 레이아웃을 만들기 전에 기본 형태를 확인하는 용도로도 좋습니다.
          </p>
          <p>
            단, `/previews`는 실제 사용자에게 보여주기 위한 운영 페이지가 아닙니다. 배포판 문서와 개발 확인용
            성격이 강하므로 검색 노출이나 실제 서비스 내비게이션의 핵심 경로로 두지 않는 편이 좋습니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default PreviewsDocsPage;

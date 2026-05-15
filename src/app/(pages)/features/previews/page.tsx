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
          <DocLinkList items={previewItems.map((item) => ({ ...item, meta: item.href }))} />
        </DocSection>

        <DocSection title="왜 route group을 분리했나">
          <p>
            `/previews`는 `src/app/(previews)` 아래에 있어서 `src/app/(pages)/layout.tsx`를 타지 않습니다. 그래서
            기본 레이아웃 자체를 볼 때 현재 사이트 레이아웃과 중첩되지 않습니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default PreviewsDocsPage;

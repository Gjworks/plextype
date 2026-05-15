import { DocLinkList, DocSection, DocsShell, FeatureDocPanel } from "../_components";

const componentItems = [
  {
    href: "/features/components/modal",
    label: "Modal",
    desc: "기본 모달 컴포넌트의 위치, 사용 예시, props를 확인합니다.",
    meta: "/features/components/modal",
  },
];

const ComponentsPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="Components"
        description="Gjworks에서 제공하는 기본 UI 컴포넌트 문서입니다."
      >
        <DocSection title="컴포넌트 목록">
          <DocLinkList items={componentItems} />
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default ComponentsPage;

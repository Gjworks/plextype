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
          <p>
            이 영역은 코어가 제공하는 공통 UI 컴포넌트를 문서화합니다. 프로젝트에서 같은 버튼, 모달,
            입력 필드, 패널 스타일을 재사용해야 화면 톤이 흔들리지 않습니다.
          </p>
          <DocLinkList items={componentItems} />
          <p>
            컴포넌트를 사용할 때는 페이지 안에서 임의의 버튼 스타일을 새로 만들기보다 기존 컴포넌트의 props와
            조합을 먼저 확인하는 것을 권장합니다. 특히 관리자 화면, 게시판 작성/수정, 댓글, 설정 페이지는
            같은 입력 규칙과 오류 표시 방식을 공유해야 합니다.
          </p>
        </DocSection>

        <DocSection title="문서 작성 기준">
          <p>
            각 컴포넌트 문서는 위치, 기본 사용법, props 의미, 실제 적용할 때의 주의점을 함께 설명해야 합니다.
            단순히 예제 코드만 두면 나중에 왜 그 컴포넌트를 써야 하는지 알기 어렵습니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default ComponentsPage;

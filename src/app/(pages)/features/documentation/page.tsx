import { CodeBlock, DocSection, DocsShell, FeatureDocPanel } from "../_components";

const DocumentationPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="Documentation"
        description="features 문서를 어떤 기준으로 유지해야 하는지 정리한 문서 작성 가이드입니다."
      >
        <DocSection title="문서의 목적">
          <p>
            `/features` 문서는 단순한 소개 페이지가 아니라 배포판을 받아간 사람이 프로젝트를 이해하고
            커스텀할 때 보는 작업 매뉴얼입니다. 그래서 기능 이름만 나열하는 것보다, 어떤 파일을 수정해야
            하고 어떤 파일은 건드리지 않는 편이 좋은지까지 설명해야 합니다.
          </p>
          <p>
            특히 Gjworks 구조는 코어와 extensions의 경계가 중요합니다. 문서는 이 경계를 반복해서 설명해야
            사용자가 코어 업데이트를 받으면서도 자기 프로젝트의 변경사항을 안전하게 유지할 수 있습니다.
          </p>
        </DocSection>

        <DocSection title="권장 구성">
          <p>
            각 문서는 “개념 설명”, “파일 위치”, “사용 예시”, “주의점”을 기본 단위로 작성합니다.
            짧은 설명만 있으면 처음 보는 사람이 어디서 시작해야 하는지 알기 어렵고, 코드만 있으면 왜 그
            구조를 쓰는지 놓치기 쉽습니다.
          </p>
          <CodeBlock>{`1. 이 기능이 왜 필요한지 설명
2. 관련 파일과 alias 안내
3. 실제 추가 또는 교체 예시
4. 코어 업데이트 시 주의할 점
5. 빌드나 실행으로 확인하는 방법`}</CodeBlock>
        </DocSection>

        <DocSection title="문서 폭">
          <p>
            문서는 넓은 대시보드가 아니라 읽기 화면입니다. 그래서 본문은 너무 넓게 펼치지 않고, 코드와
            테이블도 `max-w`를 제한합니다. 한 줄 길이가 지나치게 길면 설명이 많아질수록 읽는 속도가 떨어집니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default DocumentationPage;

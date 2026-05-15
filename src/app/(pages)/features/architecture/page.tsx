import { CodeBlock, DocSection, DocsShell, FeatureDocPanel, PathTable } from "../_components";

const paths = [
  { path: "src/app", desc: "Next.js App Router 라우트입니다. 코어 라우트는 직접 수정하지 않는 것을 권장합니다." },
  { path: "src/app/(modules)", desc: "게시판, 회원, 인증, 관리자 등 코어 모듈 라우트입니다." },
  { path: "src/app/(pages)", desc: "일반 문서/소개/정적 페이지 라우트입니다." },
  { path: "src/app/(extensions)", desc: "개인 프로젝트가 추가 라우트를 만들 때 사용하는 영역입니다. git 제외 대상입니다." },
  { path: "src/modules", desc: "비즈니스 모듈입니다. UI는 action을 통해 데이터에 접근하고 query를 직접 호출하지 않습니다." },
  { path: "src/layouts", desc: "코어가 제공하는 기본 레이아웃입니다. default/auth 레이아웃이 있습니다." },
  { path: "src/page", desc: "코어가 제공하는 기본 페이지 템플릿입니다. 현재 home.tsx가 기본 홈입니다." },
  { path: "src/core/registry", desc: "extensions가 없을 때 사용하는 fallback registry입니다." },
  { path: "src/extensions", desc: "프로젝트별 커스텀 영역입니다. 레이아웃, 페이지, 게시판 스킨, 트리거를 등록합니다." },
];

const ArchitecturePage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="프로젝트 구조"
        description="Gjworks는 코어 업데이트와 개인 커스텀을 분리하기 위해 라우트, 모듈, registry, extensions를 역할별로 나눕니다."
      >
        <DocSection title="큰 원칙">
          <p>
            코어는 업데이트 가능한 영역이고 extensions는 프로젝트별 자유 영역입니다. 사용자가 코어 파일을 직접 수정하지 않아도
            레이아웃, 홈, 스킨, 추가 라우트를 바꿀 수 있어야 합니다.
          </p>
          <p>
            이 구조의 목표는 “코어 업데이트를 받을 수 있는 프로젝트”입니다. 일반적인 커스터마이징은 `src/extensions`와
            `src/app/(extensions)`에 두고, 코어의 `src/modules`, `src/app/(modules)`, `src/core`는 프레임워크가 제공하는
            기본 동작으로 유지합니다.
          </p>
        </DocSection>

        <DocSection title="주요 디렉토리">
          <PathTable items={paths} />
        </DocSection>

        <DocSection title="Action Layer 규칙">
          <p>
            `.tsx` 페이지와 컴포넌트는 Prisma query를 직접 호출하지 않습니다. 데이터 흐름은 `Component/Page → Action → Query`
            순서를 따릅니다. 관리자 전용 action은 이름 중간에 `Admin`을 포함하고, 서버 action 함수명은 `Action`으로 끝냅니다.
          </p>
          <CodeBlock>{`// 권장 흐름
src/modules/posts/tpl/default/list.tsx
  -> getDocumentListAction()
  -> getDocumentListQuery()
  -> prisma.document.findMany()

// 피해야 할 흐름
tsx 컴포넌트 -> prisma.document.findMany()`}</CodeBlock>
          <p>
            이 규칙을 지키면 UI, 비즈니스 검증, DB 접근 책임이 분리됩니다. 나중에 권한 체크, 캐시, 트리거, 알림 같은 로직이
            추가되어도 action layer에서 통제할 수 있습니다.
          </p>
        </DocSection>

        <DocSection title="코어와 확장의 경계">
          <p>
            새 페이지가 필요하면 `src/app/(extensions)`에 라우트를 추가합니다. 새 게시판 스킨이 필요하면
            `src/extensions/posts/tpl/[skin]`에 컴포넌트를 두고 `src/extensions/index.tsx`에서 등록합니다. 새 DB 모델이
            필요하면 `src/extensions/prisma/schema/*.prisma`에 모델 조각을 추가합니다.
          </p>
          <p>
            반대로 코어의 인증, 게시판, 댓글, 첨부파일 같은 공통 기능을 수정해야 할 때는 먼저 trigger, capability, extension
            라우트로 해결 가능한지 확인합니다. 정말 코어 기능 자체가 부족하다면 그때 코어 모듈을 수정하는 것이 좋습니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default ArchitecturePage;

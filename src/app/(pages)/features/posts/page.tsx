import { CodeBlock, DocSection, DocsShell, FeatureDocPanel } from "../_components";

const PostsDocsPage = () => {
  return (
    <FeatureDocPanel>
      <DocsShell
        title="Posts"
        description="게시판 스킨과 스킨별 기능을 extensions에서 등록하는 방법입니다."
      >
        <DocSection title="스킨 선택 흐름">
          <p>
            관리자 게시판 설정의 `skin` 값이 `default`면 코어 기본 목록 스킨을 사용합니다. 다른 값이면
            `postSkins[skin]`에서 등록된 컴포넌트를 찾고, 없으면 기본 스킨으로 fallback합니다.
          </p>
          <p>
            중요한 점은 `mid === "bin"`처럼 라우터나 목록 페이지에 특정 게시판 ID를 하드코딩하지 않는
            것입니다. 게시판별 스킨은 관리자 설정의 `skin` 값으로 결정되어야 배포판을 받아간 프로젝트마다
            자유롭게 다른 이름의 게시판과 스킨을 조합할 수 있습니다.
          </p>
          <CodeBlock>{`게시판 설정 skin = "issuetracker"
→ @project/extensions 의 postSkins.issuetracker 확인
→ 등록되어 있으면 issuetracker 목록 스킨 사용
→ 없으면 코어 default 목록 스킨 사용`}</CodeBlock>
        </DocSection>

        <DocSection title="목록 스킨 등록">
          <p>
            게시판 스킨은 `src/extensions/posts/tpl/[skin-name]` 아래에 두는 것을 권장합니다.
            현재 배포판의 코어 목록 화면을 유지하면서 특정 게시판만 전혀 다른 UI로 바꿀 수 있습니다.
            예를 들어 `issuetracker`는 이슈 목록처럼 open/close 버튼과 상태 카운트를 가진 목록 스킨입니다.
          </p>
          <CodeBlock>{`// src/extensions/index.tsx
import type React from "react";
import IssueTrackerListSkin from "./posts/tpl/issuetracker/list";

export const postSkins: Record<string, React.ComponentType<any>> = {
  issuetracker: IssueTrackerListSkin,
};`}</CodeBlock>
          <p>
            스킨 컴포넌트는 기존 게시판 목록 컴포넌트가 받는 props 흐름을 최대한 유지해야 합니다.
            그래야 검색, 페이지네이션, 권한, 나의 글만 보기 같은 공통 기능을 스킨이 깨뜨리지 않습니다.
          </p>
        </DocSection>

        <DocSection title="스킨별 capability">
          <p>
            open/close 같은 기능은 `Document.status`를 코어에 하드코딩하지 않고 capability로 선언합니다.
            기본 게시판에서는 `status`가 공개/비공개 같은 의미로 쓰일 수 있고, 이슈 트래커에서는
            open/close 같은 업무 상태로 쓰일 수 있습니다. 그래서 코어는 의미를 고정하지 않고,
            스킨이 자신에게 필요한 해석을 선언합니다.
          </p>
          <CodeBlock>{`// src/extensions/postCapabilities.ts
import type { PostSkinCapability } from "@/core/registry/defaultPostCapabilities";

export const postSkinCapabilities: Record<string, PostSkinCapability> = {
  issuetracker: {
    documentStatus: {
      defaultStatus: "open",
      useStatusCounts: true,
    },
  },
};`}</CodeBlock>
          <p>
            `defaultStatus`는 새 글을 만들 때 상태를 자동으로 채우는 기준입니다. `useStatusCounts`는 목록에서
            open/close 개수를 함께 보여줄 때 사용합니다. 스킨이 이 기능을 쓰지 않으면 선언하지 않아도 됩니다.
          </p>
        </DocSection>

        <DocSection title="새 게시판 스킨 만들기">
          <p>
            예를 들어 `roadmap` 스킨을 만들려면 `src/extensions/posts/tpl/roadmap/list.tsx`를 만들고
            `src/extensions/index.tsx`의 `postSkins`에 `roadmap` 키로 등록합니다. 관리자 게시판 설정에서 스킨 값을
            `roadmap`으로 입력하면 적용됩니다.
          </p>
          <CodeBlock>{`src/extensions/posts/tpl/roadmap/list.tsx
src/extensions/posts/actions/roadmap.action.ts
src/extensions/posts/actions/roadmap.query.ts
src/extensions/postCapabilities.ts`}</CodeBlock>
          <p>
            스킨 전용 action/query가 필요할 때는 `src/extensions/posts/actions`에 둡니다. 다만 기존 코어
            action으로 충분한 조회나 삭제까지 새로 만들 필요는 없습니다. 코어 기능을 재사용하고, 스킨 고유
            기능만 확장 쪽에 두는 것이 업데이트 충돌을 가장 적게 만듭니다.
          </p>
        </DocSection>

        <DocSection title="본문과 댓글 SEO">
          <p>
            게시글 목록과 본문은 가능한 서버 컴포넌트에서 HTML을 먼저 만들어 내려주는 구조가 좋습니다.
            에디터, 댓글 작성창, 첨부파일 업로드처럼 상호작용이 필요한 부분만 클라이언트 컴포넌트로 분리하면
            검색 엔진이 제목, 본문 요약, 댓글 텍스트를 더 안정적으로 읽을 수 있습니다.
          </p>
          <p>
            댓글은 Tiptap JSON을 그대로 출력하면 검색 결과와 알림, 최근 댓글 위젯에서 품질이 크게 떨어집니다.
            화면에 노출되는 영역에서는 JSON이 아니라 텍스트 추출 결과나 안전하게 렌더링된 HTML을 사용해야 합니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default PostsDocsPage;

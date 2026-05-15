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
        </DocSection>

        <DocSection title="목록 스킨 등록">
          <CodeBlock>{`// src/extensions/index.tsx
import type React from "react";
import IssueTrackerListSkin from "./posts/tpl/issuetracker/list";

export const postSkins: Record<string, React.ComponentType<any>> = {
  issuetracker: IssueTrackerListSkin,
};`}</CodeBlock>
        </DocSection>

        <DocSection title="스킨별 capability">
          <p>open/close 같은 기능은 Document.status를 직접 코어에 하드코딩하지 않고 capability로 선언합니다.</p>
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
        </DocSection>

        <DocSection title="새 게시판 스킨 만들기">
          <p>
            예를 들어 `roadmap` 스킨을 만들려면 `src/extensions/posts/tpl/roadmap/list.tsx`를 만들고
            `src/extensions/index.tsx`의 `postSkins`에 `roadmap` 키로 등록합니다. 관리자 게시판 설정에서 스킨 값을
            `roadmap`으로 입력하면 적용됩니다.
          </p>
        </DocSection>
      </DocsShell>
    </FeatureDocPanel>
  );
};

export default PostsDocsPage;

import type React from "react";

import { views } from "@extensions";

// 패키지의 화면에 쓸 뷰를 고른다. 프로젝트나 다른 패키지가 같은 key로 등록한 뷰(ViewRegistration)가 있으면 그것을, 없으면 fallback을 돌려준다.
// 패키지는 자기 기본 뷰를 등록하지 않고 fallback으로 넘긴다. 서버 컴포넌트(페이지)에서 부른다.
export const resolveView = <Props,>(key: string, fallback: React.ComponentType<Props>): React.ComponentType<Props> => (
  views[key] ?? fallback
);

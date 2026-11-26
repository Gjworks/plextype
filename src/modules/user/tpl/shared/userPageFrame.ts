import type React from "react";

import type { UserPageFrameProps } from "@/core/registry/defaultRegistry";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";
import { userLayouts } from "@extensions";

// 지금 적용된 회원 스킨이 등록한 마이페이지 틀(pageFrame)을 돌려준다. 스킨이 틀을 등록하지 않았으면 null이다.
// 쉬운 설치 패키지의 회원 화면(/user/<패키지>)이 서버에서 불러, 틀이 있으면 내용을 감싸 다른 회원 화면과 같은 메뉴 안에 놓는다.
export async function getUserPageFrame(): Promise<React.ComponentType<UserPageFrameProps> | null> {
  const settings = await getPublicSiteSettingsAction();
  return userLayouts[settings.data?.userLayout || "default"]?.pageFrame ?? null;
}

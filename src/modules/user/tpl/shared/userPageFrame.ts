import type React from "react";

import type { UserLayoutComponents, UserPageFrameProps } from "@/core/registry/defaultRegistry";
import { getSettingsByKeysQuery } from "@/core/utils/settings/settings.query";
import { userLayouts } from "@extensions";

// 관리자의 사이트 설정에서 고른 회원 스킨. 설정이 없으면 환경 변수, 그것도 없으면 기본 스킨이다.
// 관리자 모듈의 설정 액션을 거치지 않고 설정 테이블을 직접 읽는다: 기능 모듈은 관리자 모듈을 import하지 않는다.
const USER_LAYOUT_KEY = "site.userLayout";

async function readUserLayout() {
  try {
    const [record] = await getSettingsByKeysQuery([USER_LAYOUT_KEY]);
    return record?.value || process.env.USER_LAYOUT || "default";
  } catch {
    // 설정을 읽지 못해도 화면은 기본 스킨으로 그린다.
    return process.env.USER_LAYOUT || "default";
  }
}

// 지금 적용된 회원 스킨. 등록되지 않은 key가 설정에 남아 있으면 null이다.
export async function getUserSkin(): Promise<UserLayoutComponents | null> {
  return userLayouts[await readUserLayout()] ?? null;
}

// 지금 적용된 회원 스킨이 등록한 마이페이지 틀(pageFrame)을 돌려준다. 스킨이 틀을 등록하지 않았으면 null이다.
// 스킨이 그리지 않는 회원 화면(소셜 로그인 연결의 기본 화면, 쉬운 설치 패키지의 /user/<패키지>)이 서버에서 불러, 틀이 있으면 내용을 감싸 다른 회원 화면과 같은 메뉴 안에 놓는다.
export async function getUserPageFrame(): Promise<React.ComponentType<UserPageFrameProps> | null> {
  return (await getUserSkin())?.pageFrame ?? null;
}

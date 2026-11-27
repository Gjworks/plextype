import { redirect } from "next/navigation";

import { getMySocialLinksAction, unlinkSocialAccountAction } from "@/modules/user/actions/social.action";
import { SOCIAL_LOGIN_LINKS_PATH, socialLoginLinkStartPath } from "@/modules/user/social/paths";
import DefaultLinks from "@/modules/user/tpl/default/socialLoginLinks";
import { getUserSkin } from "@/modules/user/tpl/shared/userPageFrame";

export const dynamic = "force-dynamic";

const TITLE = "소셜 로그인 연결";
const DESCRIPTION = "연결한 계정으로 비밀번호 없이 로그인할 수 있습니다.";

// 로그인한 회원이 자기 계정에 소셜 계정을 연결하거나 해제하는 화면. 데이터와 동작을 준비해 넘기고, 그리는 일은 회원 스킨이 한다.
// 적용된 스킨이 socialLoginLinks를 등록했으면 그 컴포넌트가 메뉴와 제목까지 직접 그린다.
// 등록하지 않았으면 기본 화면을 그 스킨의 마이페이지 틀(pageFrame) 안에 놓고, 틀도 없으면 기본 화면이 제목을 직접 그린다.
const Page = async () => {
  const [links, skin] = await Promise.all([getMySocialLinksAction(), getUserSkin()]);
  if (!links) redirect(`/auth/signin?redirect=${SOCIAL_LOGIN_LINKS_PATH}`);

  const props = {
    title: TITLE,
    description: DESCRIPTION,
    links: links.map((link) => ({ ...link, linkHref: socialLoginLinkStartPath(link.key) })),
    unlinkAction: unlinkSocialAccountAction,
  };
  if (skin?.socialLoginLinks) {
    const Links = skin.socialLoginLinks;
    return <Links {...props} framed={false} />;
  }

  const Frame = skin?.pageFrame;
  const content = <DefaultLinks {...props} framed={Boolean(Frame)} />;
  return Frame ? <Frame path={SOCIAL_LOGIN_LINKS_PATH} title={TITLE} description={DESCRIPTION}>{content}</Frame> : content;
};

export default Page;

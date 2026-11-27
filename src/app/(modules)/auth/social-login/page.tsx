import { SOCIAL_LOGIN_MESSAGES, socialLoginMessage } from "@/modules/user/social/messages";
import DefaultMessage from "@/modules/user/tpl/default/socialLoginMessage";
import { getUserSkin } from "@/modules/user/tpl/shared/userPageFrame";

// 소셜 로그인이 중간에 끝났을 때의 안내 화면. 주소의 code에 해당하는 문구만 보여 준다.
// 적용된 회원 스킨이 socialLoginMessage를 등록했으면 그것이, 아니면 기본 화면이 그린다.
const Page = async ({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) => {
  const [{ code }, skin] = await Promise.all([searchParams, getUserSkin()]);
  const known = typeof code === "string" && code in SOCIAL_LOGIN_MESSAGES ? code : null;
  const Message = skin?.socialLoginMessage ?? DefaultMessage;

  return <Message message={socialLoginMessage(known ?? undefined)} code={known} signinHref="/auth/signin" />;
};

export default Page;

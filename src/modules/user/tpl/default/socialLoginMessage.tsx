import Link from "next/link";

import type { SocialLoginMessageViewProps } from "@/modules/user/actions/social.type";

// 안내 화면의 기본 모양. 적용된 회원 스킨이 socialLoginMessage를 등록하지 않았을 때 쓰인다.
const MessageView = ({ message, signinHref }: SocialLoginMessageViewProps) => (
  <div>
    <h2 className="!mb-0 text-2xl font-semibold text-gray-900 dark:text-white">소셜 로그인</h2>
    <p role="alert" className="mt-4 text-sm leading-6 text-gray-600 dark:text-white/70">
      {message}
    </p>
    <Link href={signinHref} className="mt-8 inline-block text-sm font-semibold text-gray-900 underline underline-offset-4 dark:text-white">
      로그인 화면으로
    </Link>
  </div>
);

export default MessageView;

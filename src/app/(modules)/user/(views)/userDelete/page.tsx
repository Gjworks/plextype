// src/app/(extentions)/user/(views)/userDelete/page.tsx
import UserDelete from "@modules/user/_tpl/default/delete";
import { getUserSession } from "@modules/user/_actions/user.action";
import { redirect } from "next/navigation";

const Page = async () => {
  // 💡 1. 서버에서 내 세션(로그인 정보)을 확인합니다.
  const userRes = await getUserSession();

  // 💡 2. 로그인 안 했으면 얄짤없이 쫓아냅니다!
  if (!userRes.success || !userRes.data) {
    redirect("/auth/signin");
  }

  return (
    <>
      {/* 💡 3. 내 정보를 클라이언트 컴포넌트로 전달! */}
      <UserDelete initialUser={userRes.data} />
    </>
  );
};

export default Page;
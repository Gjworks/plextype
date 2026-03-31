// src/app/(extentions)/user/(views)/userUpdate/page.tsx
import UpdateUser from "@modules/user/_tpl/default/update";
import { getUserSession } from "@modules/user/_actions/user.action";
import { redirect } from "next/navigation";

const Page = async () => {
  // 💡 1. 화면을 그리기 전에 서버에서 현재 로그인한 내 정보를 직통으로 가져옵니다.
  const userRes = await getUserSession();

  // 💡 2. 만약 로그인 정보가 없다면? (세션 만료 등) -> 가차 없이 로그인 창으로 쫓아냅니다!
  if (!userRes.success || !userRes.data) {
    redirect("/auth/signin");
  }

  return (
    <>
      {/* 💡 3. 클라이언트 컴포넌트에는 '완성된 내 정보'를 쏙 던져줍니다. (로딩 스피너 멸망!) */}
      <UpdateUser initialUser={userRes.data} />
    </>
  );
};

export default Page;
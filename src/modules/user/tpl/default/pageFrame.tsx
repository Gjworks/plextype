import type { UserPageFrameProps } from "@/core/registry/defaultRegistry";
import HeaderUser from "@/modules/user/tpl/default/header";

// 기본 회원 스킨의 마이페이지 틀. 스킨에 없는 회원 화면(소셜 로그인 연결, 쉬운 설치 패키지의 화면)을 회원 메뉴 아래에 놓는다.
// 메뉴의 선택 표시는 HeaderUser가 지금 주소로 정하므로 path는 쓰지 않는다.
const UserPageFrame = ({ title, description, children }: UserPageFrameProps) => (
  <>
    <HeaderUser />
    <main className="min-h-screen bg-white dark:bg-dark-950">
      <div className="mx-auto max-w-screen-lg px-4 py-10 md:py-14">
        <h1 className="text-3xl font-medium tracking-[-0.045em] text-gray-950 dark:text-dark-100">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-dark-400">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  </>
);

export default UserPageFrame;

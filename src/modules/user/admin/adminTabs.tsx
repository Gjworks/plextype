import Link from "next/link";

export const userAdminTabs = [
  { label: "회원 목록", href: "/admin/user/list" },
  { label: "로그인 된 회원", href: "/admin/user/active" },
  { label: "가입 대기 회원", href: "/admin/user/pending" },
  { label: "로그인 잠금", href: "/admin/user/login-locks" },
  { label: "회원 추가", href: "/admin/user/create" },
  { label: "회원 그룹 관리", href: "/admin/user/groupList" },
];

export const UserAdminTabs = ({ activePath }: { activePath: string }) => {
  return (
    <div className="shrink-0 border-b border-gray-100 px-5 dark:border-dark-800 md:px-8">
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide md:gap-8">
        {userAdminTabs.map((tab) => {
          const isActive = tab.href === activePath;

          return (
            <Link key={tab.href} href={tab.href} className="relative shrink-0 py-4">
              <span className={`text-[13px] font-bold transition-colors ${isActive ? "text-primary-600 dark:text-primary-300" : "text-gray-400 hover:text-gray-900 dark:text-dark-500 dark:hover:text-dark-100"}`}>
                {tab.label}
              </span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-primary-600 dark:bg-primary-300" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

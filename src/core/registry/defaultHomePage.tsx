import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, CreditCard, FileText, LayoutGrid, UsersRound } from "lucide-react";

const overviewCards = [
  { title: "콘텐츠", value: "Ready", caption: "게시판과 문서 모듈", icon: <FileText size={17} /> },
  { title: "회원", value: "Auth", caption: "쿠키 기반 인증", icon: <UsersRound size={17} /> },
  { title: "확장", value: "Open", caption: "extensions 우선 구조", icon: <LayoutGrid size={17} /> },
];

const statCards = [
  { title: "Notice", value: "공지사항", caption: "운영 공지를 게시판으로 관리합니다.", icon: <Bell size={16} /> },
  { title: "Members", value: "회원 정보", caption: "회원 가입과 프로필 흐름을 제공합니다.", icon: <UsersRound size={16} /> },
  { title: "Schedule", value: "운영 일정", caption: "프로젝트별 위젯으로 교체할 수 있습니다.", icon: <CalendarDays size={16} /> },
  { title: "Billing", value: "확장 준비", caption: "결제나 정산은 extension에서 구현합니다.", icon: <CreditCard size={16} /> },
];

const DefaultHomePage = () => {
  return (
    <section className="mx-auto max-w-screen-xl px-4 py-10 sm:py-14">
      <div className="rounded-[28px] bg-black px-7 py-9 text-white sm:px-10 sm:py-12">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/55">Plextype Overview</div>
            <h1 className="mt-5 max-w-2xl text-[34px] font-semibold leading-tight tracking-[-0.045em] sm:text-[44px]">
              프로젝트 운영을 위한 기본 대시보드
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 tracking-[-0.02em] text-white/60">
              콘텐츠, 회원, 관리자, 확장 구조를 한 곳에서 시작할 수 있도록 준비된 기본 화면입니다.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="text-[11px] text-white/50">Default account</div>
            <div className="mt-2 text-lg font-semibold">Administrator</div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {overviewCards.map((item) => (
          <div key={item.title} className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13px] font-medium text-gray-500 dark:text-dark-300">{item.title}</div>
                <div className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">{item.value}</div>
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-300">{item.caption}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-dark-200">
                {item.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <Link
            key={item.title}
            href={item.title === "Notice" ? "/posts/notice" : item.title === "Members" ? "/user" : "/admin"}
            className="group rounded-3xl border border-black/10 bg-white p-5 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-dark-200">
                {item.icon}
              </span>
              <div>
                <div className="text-sm font-semibold tracking-[-0.02em] text-gray-950 dark:text-white">{item.value}</div>
                <div className="mt-1 text-[12px] text-gray-400">{item.title}</div>
              </div>
              <ArrowRight size={15} className="ml-auto text-gray-300 transition-transform group-hover:translate-x-1 dark:text-dark-500" />
            </div>
            <p className="mt-4 text-[13px] leading-6 text-gray-500 dark:text-dark-300">{item.caption}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default DefaultHomePage;

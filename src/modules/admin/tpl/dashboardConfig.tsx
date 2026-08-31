import { BarChart3, LayoutPanelTop, ListChecks, ToggleLeft } from "lucide-react";

import {
  AdminExtensionPage,
  AdminPanel,
} from "@/extensions/admin/AdminExtensionTemplate";

const siteAdminTabs = [
  { label: "사이트맵", href: "/admin/site/sitemap" },
  { label: "대시보드 구성", href: "/admin/site/dashboard" },
];

const configItems = [
  {
    icon: <LayoutPanelTop size={17} />,
    title: "위젯 배치",
    description: "관리자 첫 화면에 노출할 위젯 순서와 위치를 정리합니다.",
  },
  {
    icon: <ToggleLeft size={17} />,
    title: "노출 상태",
    description: "사용하지 않는 요약 카드와 운영 패널을 숨길 수 있도록 준비합니다.",
  },
  {
    icon: <BarChart3 size={17} />,
    title: "통계 기준",
    description: "회원, 게시글, 알림, 서비스 같은 운영 지표의 집계 기준을 관리합니다.",
  },
  {
    icon: <ListChecks size={17} />,
    title: "관리 흐름",
    description: "프로젝트별 관리자 대시보드 구성을 확장할 수 있는 영역입니다.",
  },
];

const DashboardConfigAdmin = () => {
  return (
    <AdminExtensionPage
      icon={<LayoutPanelTop size={13} />}
      eyebrow="Site"
      title="대시보드 구성"
      description="관리자 메인 화면에 표시할 위젯과 운영 지표를 구성합니다."
      tabs={siteAdminTabs}
      activeHref="/admin/site/dashboard"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {configItems.map((item) => (
          <section
            key={item.title}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-dark-800 dark:bg-dark-950"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300">
              {item.icon}
            </div>
            <h2 className="mt-5 text-sm font-semibold text-gray-900 dark:text-dark-100">{item.title}</h2>
            <p className="mt-2 text-xs leading-5 text-gray-400 dark:text-dark-400">{item.description}</p>
          </section>
        ))}
      </div>

      <AdminPanel title="구성 준비 중" description="대시보드 위젯 설정 흐름">
        <div className="p-6">
          <p className="text-sm leading-6 text-gray-400 dark:text-dark-400">
            실제 위젯 저장, 정렬, 활성화 옵션은 이후 대시보드 설정 테이블과 연결해서 확장하면 됩니다.
          </p>
        </div>
      </AdminPanel>
    </AdminExtensionPage>
  );
};

export default DashboardConfigAdmin;

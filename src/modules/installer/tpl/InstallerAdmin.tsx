"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpRight, ChevronDown, CirclePause, Link2, Monitor, Package, PackageOpen, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { AdminPage, AdminPanel, adminGhostButtonClass, adminPrimaryButtonClass } from "@/modules/admin/components/AdminPageTemplate";
import type { InstallerState } from "../actions/_type";

const tabs = [
  { id: "catalog", label: "Store 자료", href: "/admin/installer" },
  { id: "purchases", label: "구매한 자료", href: "/admin/installer/purchases" },
  { id: "installed", label: "설치된 패키지", href: "/admin/installer/installed" },
  { id: "connection", label: "연결 관리", href: "/admin/installer/connection" },
];

const buttonClass = `${adminGhostButtonClass} shrink-0 whitespace-nowrap`;
const mutedClass = "text-sm text-gray-500 dark:text-dark-400";

export default function InstallerAdmin({ state, view }: { state: InstallerState; view: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const active = tabs.find(tab => tab.id === view)?.id || "catalog";
  const data = state.data;
  const packages = (data?.packages || []).filter(item => `${item.packageId} ${item.version}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <AdminPage
      icon={<PackageOpen size={13} />}
      eyebrow="쉬운 설치"
      title={tabs.find(tab => tab.id === active)?.label || "Store 자료"}
      tabs={tabs}
      activeHref={tabs.find(tab => tab.id === active)?.href}
      action={
        <button type="button" className={buttonClass} disabled={pending} onClick={() => startTransition(() => router.refresh())} title="패키지 목록 새로고침">
          <RefreshCw size={14} className={pending ? "animate-spin" : ""} />새로고침
        </button>
      }
    >
      {!state.success || !data ? (
        <div role="alert" className="flex items-center gap-3 border-y border-red-200 py-5 text-sm text-red-600 dark:border-red-900 dark:text-red-300">
          <AlertCircle size={18} />{state.message}
        </div>
      ) : (
        <>
          <dl aria-label="쉬운 설치 상태 요약" className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Store 계정", value: "연결 안 됨", Icon: Link2, tone: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" },
              { label: "실행 환경", value: data.environment === "development" ? "개발 환경" : "운영 환경", Icon: Monitor, tone: "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300" },
              { label: "설치된 패키지", value: `${data.packages.length}개`, Icon: Package, tone: "bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-300" },
              { label: "설치 실행", value: "아직 지원하지 않음", Icon: CirclePause, tone: "bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-400" },
            ].map(({ label, value, Icon, tone }) => (
              <div key={label} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-800 dark:bg-dark-950">
                <dt className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone}`}><Icon size={16} strokeWidth={1.7} /></span>
                  <span className="text-xs font-medium leading-5 text-gray-500 dark:text-dark-400">{label}</span>
                </dt>
                <dd className="mt-4 min-h-10 break-words text-sm font-semibold leading-5 text-gray-800 dark:text-dark-100 sm:min-h-5">{value}</dd>
              </div>
            ))}
          </dl>

          {active === "installed" ? (
            <AdminPanel title="패키지 목록" action={
                <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-md border border-gray-200 bg-white px-3 dark:border-dark-800 dark:bg-dark-950">
                  <Search size={16} className="shrink-0 text-gray-400" />
                  <input aria-label="패키지 검색" value={search} onChange={event => setSearch(event.target.value)} placeholder="패키지 이름 또는 버전" className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none dark:text-dark-100" />
                </label>
              }>
              {data.warnings.length > 0 && (
                <div role="status" className="m-5 space-y-1 border-l-2 border-amber-500 pl-4 text-sm text-amber-700 dark:text-amber-300">
                  {data.warnings.map(warning => <p key={warning}>{warning}</p>)}
                </div>
              )}
              {packages.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
                  <Package size={32} strokeWidth={1.5} className="text-gray-400 dark:text-dark-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">{search ? "검색 결과가 없습니다." : "등록된 설치 패키지가 없습니다."}</h3>
                  <p className={mutedClass}>{search ? "다른 이름이나 버전을 확인해 주세요." : "패키지 정보 파일이 없는 기존 확장 기능은 이 목록에 포함되지 않습니다."}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 px-5 dark:divide-dark-800">
                  {packages.map(item => (
                    <details key={item.packageId} className="group py-4">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 [&::-webkit-details-marker]:hidden">
                        <Package size={18} className="shrink-0 text-gray-500 dark:text-dark-400" />
                        <span className="min-w-0 flex-1 break-all text-sm font-semibold text-gray-900 dark:text-dark-100">{item.packageId}</span>
                        <span className="max-w-full break-all font-mono text-xs text-gray-500 dark:text-dark-400">{item.version}</span>
                        <span className="text-xs text-amber-700 dark:text-amber-300">서명 미검증</span>
                        <ChevronDown size={16} className="text-gray-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <dl className="mt-5 grid gap-4 bg-gray-50 p-4 text-sm sm:grid-cols-2 dark:bg-dark-900">
                        <div><dt className={mutedClass}>설치 경로</dt><dd className="mt-1 break-all font-mono text-xs text-gray-800 dark:text-dark-200">{item.installPath}</dd></div>
                        <div><dt className={mutedClass}>Plextype 지원 버전</dt><dd className="mt-1 text-gray-800 dark:text-dark-200">{item.minPlatformVersion} ~ {item.maxPlatformVersion || "상한 없음"}</dd></div>
                        <div><dt className={mutedClass}>DB 검토</dt><dd className="mt-1 text-gray-800 dark:text-dark-200">{item.requiresDatabaseReview ? "필요" : "불필요"}</dd></div>
                        <div><dt className={mutedClass}>파일 무결성</dt><dd className="mt-1 text-gray-800 dark:text-dark-200">아직 검증하지 않음</dd></div>
                      </dl>
                    </details>
                  ))}
                </div>
              )}
            </AdminPanel>
          ) : active === "connection" ? (
            <AdminPanel title="Store 연결 상태">
              <dl className="divide-y divide-gray-100 text-sm dark:divide-dark-800">
                {[
                  ["Store 주소", "https://gjworks.dev/store"],
                  ["계정 연결", "연결 안 됨"],
                  ["연결 API", "준비 중"],
                  ["상품 목록 · 구매 권한 API", "준비 중"],
                  ["자동 설치 · 업데이트", "준비 중"],
                  ["현재 동작", "로컬 패키지 정보 조회만 가능"],
                ].map(([label, value]) => <div key={label} className="grid min-w-0 gap-2 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)]"><dt className="text-gray-500 dark:text-dark-400">{label}</dt><dd className="min-w-0 break-words text-gray-900 dark:text-dark-100">{value}</dd></div>)}
              </dl>
              <div className="border-t border-gray-100 px-4 py-4 dark:border-dark-800 flex items-start gap-2 text-xs leading-6 text-gray-500 dark:text-dark-400"><ShieldCheck size={16} className="mt-1 shrink-0" />파일 설치, 서버 명령 실행, DB 변경은 수행하지 않습니다.</div>
            </AdminPanel>
          ) : (
            <AdminPanel>
            <div className="flex min-h-80 min-w-0 flex-col items-center justify-center gap-4 px-5 py-10 text-center sm:px-6 sm:py-12">
              <Link2 size={32} strokeWidth={1.5} className="text-gray-400 dark:text-dark-500" />
              <h2 className="max-w-full break-words text-sm font-semibold leading-6 text-gray-900 dark:text-dark-100">{active === "purchases" ? "구매 내역을 연결할 계정이 없습니다." : "Store 연결을 준비하고 있습니다."}</h2>
              <p className={`max-w-lg leading-6 ${mutedClass}`}>외부 사이트용 Store 연결 API가 아직 제공되지 않아 {active === "purchases" ? "구매 내역" : "상품 목록"}을 불러올 수 없습니다.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/admin/installer/connection" className={adminPrimaryButtonClass}>연결 상태 확인</Link>
                <a href="https://gjworks.dev/store" target="_blank" rel="noopener noreferrer" className={buttonClass}>Store 방문<ArrowUpRight size={15} /></a>
              </div>
            </div>
            </AdminPanel>
          )}
        </>
      )}
    </AdminPage>
  );
}

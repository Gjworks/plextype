"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpRight, CheckCircle2, ChevronDown, Download, Link2, Monitor, Package, PackageOpen, Play, RefreshCw, Search, ShieldCheck, Trash2, Unlink } from "lucide-react";
import {
  AdminPage,
  AdminPanel,
  adminDangerButtonClass,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
} from "@/core/components/admin/AdminPageTemplate";
import {
  connectStoreAdminAction,
  disconnectStoreAdminAction,
  installStorePackageAdminAction,
  refreshStoreKeysAdminAction,
  uninstallStorePackageAdminAction,
} from "../actions/installer.action";
import type { InstallerActionResult, InstallerCatalogItem, InstallerState } from "../actions/_type";

const tabs = [
  { id: "catalog", label: "Store 자료", href: "/admin/installer" },
  { id: "installed", label: "설치된 패키지", href: "/admin/installer/installed" },
  { id: "connection", label: "연결 관리", href: "/admin/installer/connection" },
];

const buttonClass = `${adminGhostButtonClass} shrink-0 whitespace-nowrap`;
const mutedClass = "text-sm text-gray-500 dark:text-dark-400";

const compareVersions = (a: string, b: string) => {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if ((left[index] || 0) !== (right[index] || 0)) return (left[index] || 0) < (right[index] || 0) ? -1 : 1;
  }
  return 0;
};

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function InstallerAdmin({ state, view }: { state: InstallerState; view: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<InstallerActionResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const active = tabs.find(tab => tab.id === view)?.id || "catalog";
  const data = state.data;
  const packages = (data?.packages || []).filter(item => `${item.packageId} ${item.version}`.toLowerCase().includes(search.trim().toLowerCase()));
  const isDevelopment = data?.environment === "development";
  const canInstall = Boolean(isDevelopment && data?.storeConnected);

  // 설치·제거·연결은 서버의 파일을 바꾸므로 끝난 뒤 화면의 목록을 다시 받는다.
  const run = (key: string, work: () => Promise<InstallerActionResult>) => {
    setBusy(key);
    setResult(null);
    startTransition(async () => {
      try { setResult(await work()); }
      catch { setResult({ success: false, message: "처리 중 오류가 발생했습니다. 다시 시도해주세요." }); }
      setBusy(null);
      router.refresh();
    });
  };

  const installLabel = (item: InstallerCatalogItem) => {
    const installed = data?.packages.find(entry => entry.packageId === item.packageId);
    if (!installed) return "설치";
    return compareVersions(installed.version, item.version) < 0 ? "업데이트" : "다시 설치";
  };

  const isCompatible = (item: InstallerCatalogItem) => {
    if (!data?.platformVersion) return true;
    return compareVersions(data.platformVersion, item.minPlatformVersion) >= 0 &&
      (!item.maxPlatformVersion || compareVersions(data.platformVersion, item.maxPlatformVersion) <= 0);
  };

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
              data.connection
                ? { label: "Store 계정", value: data.connection.accountName || "연결됨", Icon: Link2, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300" }
                : { label: "Store 계정", value: "연결 안 됨", Icon: Link2, tone: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" },
              { label: "실행 환경", value: isDevelopment ? "개발 환경" : "운영 환경", Icon: Monitor, tone: "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300" },
              { label: "설치된 패키지", value: `${data.packages.length}개`, Icon: Package, tone: "bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-300" },
              isDevelopment
                ? { label: "설치 실행", value: data.storeConnected ? "가능" : "연결 후 가능", Icon: Play, tone: "bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-300" }
                : { label: "설치 실행", value: "개발 환경에서만 가능", Icon: Play, tone: "bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-400" },
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

          {result && (
            <div role={result.success ? "status" : "alert"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${result.success ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-300" : "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300"}`}>
              {result.success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
              <span className="min-w-0 break-words">{result.message}</span>
            </div>
          )}

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
                        <div><dt className={mutedClass}>파일 무결성</dt><dd className="mt-1 text-gray-800 dark:text-dark-200">설치할 때만 확인하며, 이후 변경 여부는 검사하지 않음</dd></div>
                      </dl>
                      {isDevelopment && (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className={`${adminDangerButtonClass} shrink-0 whitespace-nowrap`}
                            disabled={pending}
                            onClick={() => {
                              if (window.confirm(`${item.packageId} 패키지를 제거할까요? 폴더는 .plextype/backup으로 옮겨 보관합니다.`)) {
                                run(`remove:${item.packageId}`, () => uninstallStorePackageAdminAction(item.packageId));
                              }
                            }}
                          >
                            <Trash2 size={14} />{busy === `remove:${item.packageId}` ? "제거 중" : "제거"}
                          </button>
                          <span className="text-xs leading-5 text-gray-400 dark:text-dark-500">src/extensions/registry.tsx에 등록했다면 그 줄은 직접 지워야 합니다.</span>
                        </div>
                      )}
                    </details>
                  ))}
                </div>
              )}
            </AdminPanel>
          ) : active === "connection" ? (
            <AdminPanel title="Store 연결 상태">
              <dl className="divide-y divide-gray-100 text-sm dark:divide-dark-800">
                {(data.connection ? [
                  ["Store 주소", data.connection.storeUrl],
                  ["계정", data.connection.accountName || "-"],
                  ["토큰 이름", data.connection.tokenName || "-"],
                  ["서명 검증 키", `${data.connection.keyCount}개 보관`],
                  ["연결한 때", data.connection.connectedAt ? new Date(data.connection.connectedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "-"],
                ] : [
                  ["Store 주소", data.defaultStoreUrl],
                  ["계정 연결", "연결 안 됨"],
                  ["현재 동작", "Store 자료 목록과 설치된 패키지 조회만 가능"],
                ]).map(([label, value]) => <div key={label} className="grid min-w-0 gap-2 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)]"><dt className="text-gray-500 dark:text-dark-400">{label}</dt><dd className="min-w-0 break-words text-gray-900 dark:text-dark-100">{value}</dd></div>)}
              </dl>

              {!isDevelopment ? (
                <div className="flex items-start gap-2 border-t border-gray-100 px-4 py-4 text-xs leading-6 text-gray-500 dark:border-dark-800 dark:text-dark-400">
                  <ShieldCheck size={16} className="mt-1 shrink-0" />운영 환경에서는 연결과 설치를 하지 않습니다. 개발 환경에서 설치한 뒤 커밋해 배포합니다.
                </div>
              ) : data.connection ? (
                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-4 py-4 dark:border-dark-800">
                  <button type="button" className={buttonClass} disabled={pending} onClick={() => run("keys", refreshStoreKeysAdminAction)} title="Store가 서명 키를 바꾸었을 때 다시 받습니다.">
                    <RefreshCw size={14} className={busy === "keys" ? "animate-spin" : ""} />서명 키 다시 받기
                  </button>
                  <button
                    type="button"
                    className={`${adminDangerButtonClass} shrink-0 whitespace-nowrap`}
                    disabled={pending}
                    onClick={() => { if (window.confirm("Store 연결을 해제할까요? 이 프로젝트에 저장한 토큰을 지웁니다.")) run("disconnect", disconnectStoreAdminAction); }}
                  >
                    <Unlink size={14} />연결 해제
                  </button>
                </div>
              ) : (
                <form
                  className="grid gap-4 border-t border-gray-100 px-4 py-5 dark:border-dark-800"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    run("connect", () => connectStoreAdminAction(form));
                  }}
                >
                  <label className="grid min-w-0 gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                    <span className="text-sm text-gray-500 dark:text-dark-400">Store 주소</span>
                    <input name="storeUrl" type="url" required defaultValue={data.defaultStoreUrl} className={adminInputClass} />
                  </label>
                  <label className="grid min-w-0 gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                    <span className="text-sm text-gray-500 dark:text-dark-400">액세스 토큰</span>
                    <input name="token" type="password" required autoComplete="off" placeholder="pxt_…" className={adminInputClass} />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 sm:pl-[188px]">
                    <button type="submit" className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`} disabled={pending}>
                      <Link2 size={14} />{busy === "connect" ? "연결 중" : "연결"}
                    </button>
                    <span className="text-xs leading-5 text-gray-400 dark:text-dark-500">토큰은 Store의 계정 설정 &gt; 액세스 토큰에서 만듭니다.</span>
                  </div>
                </form>
              )}
              <div className="flex items-start gap-2 border-t border-gray-100 px-4 py-4 text-xs leading-6 text-gray-500 dark:border-dark-800 dark:text-dark-400"><ShieldCheck size={16} className="mt-1 shrink-0" />토큰은 이 프로젝트의 .plextype/store.json에만 저장하며 저장소에 올리지 않습니다. 패키지의 스크립트와 DB 변경은 실행하지 않습니다.</div>
            </AdminPanel>
          ) : (
            <AdminPanel title="설치할 수 있는 자료" description={`${data.connection?.storeUrl || data.defaultStoreUrl}의 공개 자료입니다. 모두 무료입니다.`}>
              {data.catalogError ? (
                <div className="flex min-h-64 min-w-0 flex-col items-center justify-center gap-4 px-5 py-10 text-center sm:px-6">
                  <Link2 size={32} strokeWidth={1.5} className="text-gray-400 dark:text-dark-500" />
                  <h2 className="max-w-full break-words text-sm font-semibold leading-6 text-gray-900 dark:text-dark-100">Store 자료 목록을 받지 못했습니다.</h2>
                  <p className={`max-w-lg leading-6 ${mutedClass}`}>{data.catalogError}</p>
                  <Link href="/admin/installer/connection" className={adminPrimaryButtonClass}>연결 상태 확인</Link>
                </div>
              ) : data.catalog.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
                  <Package size={32} strokeWidth={1.5} className="text-gray-400 dark:text-dark-500" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100">설치할 수 있는 자료가 아직 없습니다.</h2>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-dark-800">
                  {data.catalog.map(item => {
                    const installed = data.packages.find(entry => entry.packageId === item.packageId);
                    const compatible = isCompatible(item);
                    return (
                      <li key={item.productUuid} className="flex min-w-0 flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-words text-sm font-semibold text-gray-900 dark:text-dark-100">{item.name}</span>
                            <span className="break-all font-mono text-xs text-gray-500 dark:text-dark-400">{item.packageId}@{item.version}</span>
                            {installed && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">설치됨 {installed.version}</span>}
                            {item.requiresDatabaseReview && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">DB 검토 필요</span>}
                          </div>
                          {item.summary && <p className={`mt-1 line-clamp-2 break-words ${mutedClass}`}>{item.summary}</p>}
                          <p className="mt-1 text-xs text-gray-400 dark:text-dark-500">
                            {[item.sellerName, item.licenseType, `Plextype ${item.minPlatformVersion} ~ ${item.maxPlatformVersion || "상한 없음"}`, formatSize(item.size)].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`}
                          disabled={!canInstall || !compatible || pending}
                          title={!isDevelopment ? "개발 환경에서만 설치할 수 있습니다." : !data.storeConnected ? "연결 관리에서 Store에 먼저 연결해주세요." : !compatible ? `현재 Plextype ${data.platformVersion}과 호환되지 않습니다.` : undefined}
                          onClick={() => run(`install:${item.productUuid}`, () => installStorePackageAdminAction(item.productUuid))}
                        >
                          <Download size={14} />{busy === `install:${item.productUuid}` ? "설치 중" : !compatible ? "호환 안 됨" : installLabel(item)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-dark-800">
                <p className="min-w-0 text-xs leading-6 text-gray-500 dark:text-dark-400">
                  {canInstall
                    ? "설치하면 src/extensions에 소스가 들어갑니다. 관리자 메뉴나 스킨을 제공하는 패키지는 src/extensions/registry.tsx에 등록한 뒤, 확인하고 커밋해 배포합니다."
                    : isDevelopment
                      ? "설치하려면 연결 관리에서 Store에 연결해주세요."
                      : "운영 환경에서는 목록만 봅니다. 개발 환경에서 설치한 뒤 커밋해 배포합니다."}
                </p>
                <a href={`${data.connection?.storeUrl || data.defaultStoreUrl}/store`} target="_blank" rel="noopener noreferrer" className={buttonClass}>Store 방문<ArrowUpRight size={15} /></a>
              </div>
            </AdminPanel>
          )}
        </>
      )}
    </AdminPage>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpRight, CheckCircle2, ChevronDown, Download, FolderInput, Link2, Monitor, Package, PackageOpen, Play, RefreshCw, Search, ShieldCheck, Trash2, Unlink } from "lucide-react";
import {
  AdminPage,
  AdminPanel,
  adminDangerButtonClass,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
} from "@/core/components/admin/AdminPageTemplate";
import {
  adoptStorePackageAdminAction,
  connectStoreAdminAction,
  discardAdoptedPackageAdminAction,
  downloadReferenceAdminAction,
  markAdoptedVersionAdminAction,
  disconnectStoreAdminAction,
  installStorePackageAdminAction,
  previewStorePackageAdminAction,
  refreshStoreKeysAdminAction,
  uninstallStorePackageAdminAction,
} from "../actions/installer.action";
import type { InstallerActionResult, InstallerCatalogItem, InstallerPackagePreview, InstallerState } from "../actions/_type";
import InstallerCorePanel from "./InstallerCorePanel";

const tabs = [
  { id: "catalog", label: "Store 자료", href: "/admin/installer" },
  { id: "installed", label: "설치된 패키지", href: "/admin/installer/installed" },
  { id: "core", label: "코어 업데이트", href: "/admin/installer/core" },
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

// 막는 사유, 함께 설치되는 패키지, DB 변경, 모자란 npm 라이브러리 가운데 하나라도 있으면 설치 전에 보여 준다.
const needsConfirmation = (preview: InstallerPackagePreview) => (
  preview.blockers.length > 0 || preview.alsoInstalls.length > 0 || preview.hasDatabaseFiles ||
  preview.npm.missing.length > 0 || preview.npm.conflicts.length > 0 || preview.localChanges.length > 0
);

const localChangeLabel = { modified: "수정", removed: "삭제", added: "추가" } as const;

const expectedVersions = (preview: InstallerPackagePreview) => Object.fromEntries([
  ...preview.alsoInstalls.map((item) => [item.packageId, item.versionUuid]),
  [preview.packageId, preview.versionUuid],
]);

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function InstallerAdmin({ state, view }: { state: InstallerState; view: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<InstallerActionResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // DB를 바꾸는 패키지를 설치하기 전에, 적용될 내용을 보여 주고 확인을 기다리는 상태.
  const [confirming, setConfirming] = useState<{ item: InstallerCatalogItem; preview: InstallerPackagePreview } | null>(null);
  const [npmCommand, setNpmCommand] = useState<string | null>(null);
  const active = tabs.find(tab => tab.id === view)?.id || "catalog";
  const data = state.data;
  const packages = (data?.packages || []).filter(item => `${item.packageId} ${item.version}`.toLowerCase().includes(search.trim().toLowerCase()));
  const isDevelopment = data?.environment === "development";
  const canInstall = Boolean(isDevelopment && data?.storeConnected);

  // 설치했거나 가져온 버전보다 새로운 보안 패치가 나온 패키지. 어느 탭에서든 맨 위에 알린다.
  const securityAlerts = (data?.catalog || []).flatMap(item => {
    const adopted = data?.adopted.find(entry => entry.packageId === item.packageId);
    const base = adopted?.version ?? data?.packages.find(entry => entry.packageId === item.packageId)?.version;
    if (!base) return [];
    const pending = item.securityVersions.filter(version => compareVersions(version, base) > 0).sort(compareVersions);
    return pending.length > 0 ? [{ item, base, latest: pending[pending.length - 1], adopted: Boolean(adopted) }] : [];
  });

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

  // 설치 전 점검에서 알릴 것이 없는 패키지는 바로 설치하고, 있으면 내용을 먼저 보여 준다.
  const startInstall = (item: InstallerCatalogItem) => {
    setBusy(`install:${item.productUuid}`);
    setResult(null);
    setConfirming(null);
    setNpmCommand(null);
    startTransition(async () => {
      try {
        const checked = await previewStorePackageAdminAction(item.productUuid);
        if (!checked.success || !checked.preview) setResult({ success: false, message: checked.message });
        else if (needsConfirmation(checked.preview)) setConfirming({ item, preview: checked.preview });
        else setResult(await installStorePackageAdminAction(item.productUuid, { versionUuid: checked.preview.versionUuid, expected: expectedVersions(checked.preview) }));
      } catch {
        setResult({ success: false, message: "처리 중 오류가 발생했습니다. 다시 시도해주세요." });
      }
      setBusy(null);
      router.refresh();
    });
  };

  const confirmInstall = (applyDatabase: boolean) => {
    if (!confirming) return;
    const { item, preview } = confirming;
    setConfirming(null);
    // 프로젝트에 없는 npm 라이브러리는 설치기가 넣지 않으므로, 설치가 끝난 뒤에도 실행할 명령을 계속 보여 준다.
    setNpmCommand(preview.npm.command);
    run(`install:${item.productUuid}`, () => installStorePackageAdminAction(item.productUuid, { versionUuid: preview.versionUuid, expected: expectedVersions(preview), applyDatabase, overwriteLocalChanges: preview.localChanges.length > 0 }));
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

          {securityAlerts.length > 0 && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">
              <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={16} className="shrink-0" />보안 패치가 나온 패키지가 있습니다</div>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {securityAlerts.map(alert => (
                  <li key={alert.item.packageId} className="break-words">
                    {alert.item.name} ({alert.item.packageId}): 지금 {alert.base}, 보안 패치 {alert.latest}.{" "}
                    {alert.adopted
                      ? "내 확장으로 가져온 패키지라 자동으로 받을 수 없습니다. Store 자료에서 새 버전을 받아 두고 바뀐 내용을 직접 반영해주세요."
                      : "Store 자료에서 업데이트해주세요."}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <div role={result.success ? "status" : "alert"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${result.success ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-300" : "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300"}`}>
              {result.success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
              <span className="min-w-0 whitespace-pre-wrap break-words">{result.message}</span>
            </div>
          )}

          {npmCommand && result?.success && (
            <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-200">
              이 패키지가 쓰는 npm 라이브러리가 프로젝트에 없습니다. 터미널에서 실행해주세요.
              <pre className="mt-2 overflow-x-auto rounded-md border border-amber-200 bg-white px-3 py-2 text-xs text-gray-800 dark:border-dark-800 dark:bg-dark-950 dark:text-dark-200">{npmCommand}</pre>
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
                              if (window.confirm(`${item.packageId} 패키지를 제거할까요? 폴더는 .plextype/backup으로 옮겨 보관합니다.${item.requiresDatabaseReview ? "\n\n이 패키지가 만든 테이블과 마이그레이션 적용 이력은 DB에 남습니다." : ""}`)) {
                                run(`remove:${item.packageId}`, () => uninstallStorePackageAdminAction(item.packageId));
                              }
                            }}
                          >
                            <Trash2 size={14} />{busy === `remove:${item.packageId}` ? "제거 중" : "제거"}
                          </button>
                          <button
                            type="button"
                            className={buttonClass}
                            disabled={pending}
                            title="패키지를 src/extensions로 옮겨 직접 고쳐 쓰는 내 확장으로 만듭니다."
                            onClick={() => {
                              if (window.confirm(`${item.packageId} 패키지를 내 확장으로 가져올까요?\n\n폴더가 src/extensions/${item.packageId}로 옮겨지고 자유롭게 고칠 수 있게 됩니다. 대신 새 버전을 버튼으로 받을 수 없고, 알림을 보고 직접 반영해야 합니다. 보안 패치도 마찬가지입니다.`)) {
                                run(`adopt:${item.packageId}`, () => adoptStorePackageAdminAction(item.packageId));
                              }
                            }}
                          >
                            <FolderInput size={14} />{busy === `adopt:${item.packageId}` ? "가져오는 중" : "내 확장으로 가져오기"}
                          </button>
                        </div>
                      )}
                    </details>
                  ))}
                </div>
              )}
              {data.adopted.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-5 dark:border-dark-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">내 확장으로 가져온 패키지</h3>
                  <p className={`mt-1 leading-6 ${mutedClass}`}>직접 고쳐 쓰는 확장입니다. 설치기는 이 폴더를 덮어쓰지 않으며, 새 버전은 Store 자료 탭에서 알립니다.</p>
                  <ul className="mt-3 divide-y divide-gray-100 dark:divide-dark-800">
                    {data.adopted.map(item => (
                      <li key={item.packageId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="break-all text-sm font-semibold text-gray-900 dark:text-dark-100">{item.packageId} <span className="font-mono text-xs font-normal text-gray-500 dark:text-dark-400">{item.version} 기준</span></div>
                          <div className="mt-1 break-all font-mono text-xs text-gray-400 dark:text-dark-500">{item.path}</div>
                        </div>
                        {isDevelopment && (
                          <button
                            type="button"
                            className={`${adminDangerButtonClass} shrink-0 whitespace-nowrap`}
                            disabled={pending}
                            onClick={() => {
                              if (window.confirm(`${item.packageId} 가져오기를 취소할까요?\n\n고쳐 쓰던 폴더(${item.path})를 .plextype/backup으로 옮깁니다. 그 뒤 Store 자료에서 패키지를 다시 설치할 수 있습니다.`)) {
                                run(`discard:${item.packageId}`, () => discardAdoptedPackageAdminAction(item.packageId));
                              }
                            }}
                          >
                            <Trash2 size={14} />{busy === `discard:${item.packageId}` ? "취소 중" : "가져오기 취소"}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AdminPanel>
          ) : active === "core" ? (
            <InstallerCorePanel
              core={data.core}
              platformVersion={data.platformVersion}
              storeUrl={data.connection?.storeUrl || data.defaultStoreUrl}
              isDevelopment={isDevelopment}
              storeConnected={data.storeConnected}
              pending={pending}
              busy={busy}
              run={run}
            />
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
                <>
                {confirming && (() => {
                  const { item, preview } = confirming;
                  const blocked = preview.blockers.length > 0;
                  const sectionTitle = "mt-4 text-xs font-semibold text-gray-700 dark:text-dark-200";
                  return (
                  <div role="alertdialog" aria-label="설치 전 점검" className={`border-b px-5 py-5 ${blocked ? "border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5" : "border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5"}`}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">{item.name} {preview.version} 설치 전 점검</h3>
                    <ul className={`mt-2 space-y-1 leading-6 ${mutedClass}`}>
                      <li>Plextype {data.platformVersion} · 지원 범위 {item.minPlatformVersion} ~ {item.maxPlatformVersion || "상한 없음"}</li>
                      <li>Node {preview.node.current}{preview.node.required ? ` · ${preview.node.required} 이상 필요` : ""}</li>
                    </ul>

                    {blocked && (
                      <>
                        <h4 className="mt-4 text-xs font-semibold text-red-600 dark:text-red-300">설치할 수 없습니다</h4>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-red-600 dark:text-red-300">
                          {preview.blockers.map(reason => <li key={reason} className="whitespace-pre-wrap break-words">{reason}</li>)}
                        </ul>
                      </>
                    )}

                    {preview.alsoInstalls.length > 0 && (
                      <>
                        <h4 className={sectionTitle}>함께 설치되는 패키지</h4>
                        <ul className={`mt-1 space-y-1 leading-6 ${mutedClass}`}>
                          {preview.alsoInstalls.map(also => (
                            <li key={also.packageId} className="break-all font-mono text-xs">
                              {also.packageId}@{also.version}{also.previousVersion ? ` (지금 ${also.previousVersion}에서 업데이트)` : ""}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {preview.localChanges.length > 0 && (
                      <>
                        <h4 className="mt-4 text-xs font-semibold text-red-600 dark:text-red-300">직접 고친 파일이 있습니다</h4>
                        <p className={`mt-1 leading-6 ${mutedClass}`}>업데이트하면 아래 수정이 사라집니다. 이전 폴더는 .plextype/backup에 보관됩니다. 수정을 유지하려면 취소하고 설치된 패키지에서 내 확장으로 가져와주세요.</p>
                        {preview.localChanges.map(changed => (
                          <details key={changed.packageId} open className="mt-2 overflow-hidden rounded-md border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
                            <summary className="cursor-pointer px-3 py-2 font-mono text-xs text-gray-700 dark:text-dark-200">{changed.packageId} · {changed.files.length}개</summary>
                            <ul className="max-h-48 overflow-auto border-t border-gray-100 px-3 py-2 font-mono text-xs leading-6 text-gray-800 dark:border-dark-800 dark:text-dark-200">
                              {changed.files.map(file => <li key={file.path} className="break-all">{localChangeLabel[file.change]} · {file.path}</li>)}
                            </ul>
                          </details>
                        ))}
                      </>
                    )}

                    {preview.hasDatabaseFiles && (
                      <>
                        <h4 className={sectionTitle}>DB 변경</h4>
                        <p className={`mt-1 leading-6 ${mutedClass}`}>
                          {preview.migrations.length > 0
                            ? `"설치하고 DB에 적용"을 누르면 아래 마이그레이션 ${preview.migrations.length}개가 개발 DB에 적용됩니다.`
                            : "새로 적용할 마이그레이션은 없고 스키마 파일만 들어 있습니다. 스키마를 합쳐 Prisma 클라이언트를 다시 만듭니다."}
                        </p>
                        {preview.migrations.map(migration => (
                          <details key={`${migration.packageId}/${migration.name}`} open={preview.migrations.length === 1} className="mt-3 overflow-hidden rounded-md border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
                            <summary className="cursor-pointer break-all px-3 py-2 font-mono text-xs text-gray-700 dark:text-dark-200">{migration.packageId} · {migration.name}</summary>
                            <pre className="max-h-72 overflow-auto border-t border-gray-100 px-3 py-3 text-xs leading-5 text-gray-800 dark:border-dark-800 dark:text-dark-200">{migration.sql}{migration.truncated ? "\n-- 이하 생략. 전체 내용은 설치 후 패키지 폴더에서 확인합니다." : ""}</pre>
                          </details>
                        ))}
                      </>
                    )}

                    {(preview.npm.missing.length > 0 || preview.npm.conflicts.length > 0) && (
                      <>
                        <h4 className={sectionTitle}>npm 라이브러리</h4>
                        {preview.npm.command && (
                          <>
                            <p className={`mt-1 leading-6 ${mutedClass}`}>프로젝트에 없는 라이브러리가 있습니다. 설치기는 넣지 않으니 설치 후 터미널에서 실행해주세요.</p>
                            <pre className="mt-2 overflow-x-auto rounded-md border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-800 dark:border-dark-800 dark:bg-dark-950 dark:text-dark-200">{preview.npm.command}</pre>
                          </>
                        )}
                        {preview.npm.conflicts.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-700 dark:text-amber-300">
                            {preview.npm.conflicts.map(conflict => (
                              <li key={conflict.name} className="break-all">{conflict.name}: 프로젝트에는 {conflict.installed}가 있고 이 패키지는 {conflict.range}를 요구합니다. 설치는 되지만 동작하지 않을 수 있습니다.</li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {!blocked && preview.hasDatabaseFiles && (
                        <>
                          <button type="button" className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`} disabled={pending} onClick={() => confirmInstall(true)}>
                            <Download size={14} />{preview.localChanges.length > 0 ? "덮어쓰고 설치, DB에 적용" : "설치하고 DB에 적용"}
                          </button>
                          <button type="button" className={buttonClass} disabled={pending} onClick={() => confirmInstall(false)} title="파일만 설치합니다. DB에는 나중에 npm run plextype -- migrate 로 적용합니다.">
                            DB 적용 없이 설치
                          </button>
                        </>
                      )}
                      {!blocked && !preview.hasDatabaseFiles && (
                        <button type="button" className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`} disabled={pending} onClick={() => confirmInstall(false)}>
                          <Download size={14} />{preview.localChanges.length > 0 ? "덮어쓰고 업데이트" : "설치"}
                        </button>
                      )}
                      <button type="button" className={buttonClass} disabled={pending} onClick={() => setConfirming(null)}>{blocked ? "닫기" : "취소"}</button>
                    </div>
                  </div>
                  );
                })()}
                <ul className="divide-y divide-gray-100 dark:divide-dark-800">
                  {data.catalog.map(item => {
                    const installed = data.packages.find(entry => entry.packageId === item.packageId);
                    const adopted = data.adopted.find(entry => entry.packageId === item.packageId);
                    const newerThanAdopted = adopted ? compareVersions(item.version, adopted.version) > 0 : false;
                    const security = securityAlerts.some(alert => alert.item.packageId === item.packageId);
                    const compatible = isCompatible(item);
                    return (
                      <li key={item.productUuid} className="flex min-w-0 flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-words text-sm font-semibold text-gray-900 dark:text-dark-100">{item.name}</span>
                            <span className="break-all font-mono text-xs text-gray-500 dark:text-dark-400">{item.packageId}@{item.version}</span>
                            {installed && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">설치됨 {installed.version}</span>}
                            {adopted && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">내 확장으로 가져옴 · {adopted.version} 기준</span>}
                            {newerThanAdopted && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">새 버전 {item.version}</span>}
                            {security && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">보안 패치</span>}
                            {item.requiresDatabaseReview && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">DB 검토 필요</span>}
                          </div>
                          {item.summary && <p className={`mt-1 line-clamp-2 break-words ${mutedClass}`}>{item.summary}</p>}
                          <p className="mt-1 text-xs text-gray-400 dark:text-dark-500">
                            {[item.sellerName, item.licenseType, `Plextype ${item.minPlatformVersion} ~ ${item.maxPlatformVersion || "상한 없음"}`, formatSize(item.size)].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        {adopted ? (
                          // 가져온 패키지는 설치·업데이트하지 않는다. 새 버전은 비교용으로 받아 두고 직접 반영한다.
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {newerThanAdopted ? (
                              <>
                                <button type="button" className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`} disabled={!canInstall || pending} onClick={() => run(`reference:${item.productUuid}`, () => downloadReferenceAdminAction(item.productUuid))} title="프로젝트의 소스는 바꾸지 않고 .plextype/reference에 받습니다.">
                                  <Download size={14} />{busy === `reference:${item.productUuid}` ? "받는 중" : "새 버전 받아 두기"}
                                </button>
                                <button
                                  type="button"
                                  className={buttonClass}
                                  disabled={!isDevelopment || pending}
                                  onClick={() => { if (window.confirm(`${item.packageId}의 기준 버전을 ${item.version}으로 올릴까요? 새 버전의 변경을 내 확장에 반영한 뒤에 눌러주세요.`)) run(`mark:${item.packageId}`, () => markAdoptedVersionAdminAction(item.packageId, item.version)); }}
                                >
                                  {item.version} 반영 완료
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-dark-500">직접 관리 중</span>
                            )}
                          </div>
                        ) : (
                        <button
                          type="button"
                          className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`}
                          disabled={!canInstall || !compatible || pending}
                          title={!isDevelopment ? "개발 환경에서만 설치할 수 있습니다." : !data.storeConnected ? "연결 관리에서 Store에 먼저 연결해주세요." : !compatible ? `현재 Plextype ${data.platformVersion}과 호환되지 않습니다.` : undefined}
                          onClick={() => startInstall(item)}
                        >
                          <Download size={14} />{busy === `install:${item.productUuid}` ? "설치 중" : !compatible ? "호환 안 됨" : installLabel(item)}
                        </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                </>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-dark-800">
                <p className="min-w-0 text-xs leading-6 text-gray-500 dark:text-dark-400">
                  {canInstall
                    ? "설치하면 src/packages에 소스가 들어가고, 패키지의 관리자 메뉴와 스킨은 자동으로 등록됩니다. 확인한 뒤 커밋해 배포합니다."
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

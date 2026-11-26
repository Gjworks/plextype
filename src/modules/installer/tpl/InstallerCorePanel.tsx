"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Download, Search, ShieldCheck } from "lucide-react";
import { AdminPanel, adminDangerButtonClass, adminGhostButtonClass, adminPrimaryButtonClass } from "@/core/components/admin/AdminPageTemplate";
import { applyCoreUpdateAdminAction, previewCoreUpdateAdminAction } from "../actions/installer.action";
import type { InstallerActionResult, InstallerCoreConflictKind, InstallerCorePreview, InstallerCoreStatus } from "../actions/_type";

const buttonClass = `${adminGhostButtonClass} shrink-0 whitespace-nowrap`;
const mutedClass = "text-sm text-gray-500 dark:text-dark-400";
const sectionTitle = "mt-4 text-xs font-semibold text-gray-700 dark:text-dark-200";
const listClass = "max-h-48 overflow-auto border-t border-gray-100 px-3 py-2 font-mono text-xs leading-6 text-gray-800 dark:border-dark-800 dark:text-dark-200";
const boxClass = "mt-2 overflow-hidden rounded-md border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950";

const conflictLabel: Record<InstallerCoreConflictKind, string> = {
  modified: "직접 고쳤고 새 버전에서도 바뀜",
  deleted: "직접 지웠는데 새 버전에서 바뀜",
  removed: "직접 고쳤는데 새 버전에서 없어짐",
  occupied: "같은 자리에 다른 내용의 파일이 있음",
};

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function FileList({ title, files, open = false }: { title: string; files: string[]; open?: boolean }) {
  if (files.length === 0) return null;
  return (
    <details open={open} className={boxClass}>
      <summary className="cursor-pointer px-3 py-2 font-mono text-xs text-gray-700 dark:text-dark-200">{title} · {files.length}개</summary>
      <ul className={listClass}>{files.map(file => <li key={file} className="break-all">{file}</li>)}</ul>
    </details>
  );
}

// Store의 코어 배포본으로 Plextype 코어를 올리는 탭. 바뀔 내용을 먼저 보여 주고, 확인을 받은 뒤에 적용한다.
export default function InstallerCorePanel({ core, platformVersion, storeUrl, isDevelopment, storeConnected, pending, busy, run }: {
  core: InstallerCoreStatus;
  platformVersion: string;
  storeUrl: string;
  isDevelopment: boolean;
  storeConnected: boolean;
  pending: boolean;
  busy: string | null;
  run: (key: string, work: () => Promise<InstallerActionResult>) => void;
}) {
  const [checking, startChecking] = useTransition();
  const [preview, setPreview] = useState<InstallerCorePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 적용에 이어 npm install과 DB 적용까지 실행할지. 실행 중인 서버의 라이브러리를 바꾸는 일이라 고른 경우에만 한다.
  const [finish, setFinish] = useState(false);
  const canUpdate = isDevelopment && storeConnected && core.updateAvailable;

  const check = () => {
    setError(null);
    setPreview(null);
    startChecking(async () => {
      try {
        const checked = await previewCoreUpdateAdminAction();
        if (checked.success && checked.preview) setPreview(checked.preview);
        else setError(checked.message);
      } catch {
        setError("처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    });
  };

  const apply = (conflicts?: "keep" | "overwrite") => {
    if (!preview) return;
    const { version, sha256 } = preview;
    setPreview(null);
    run("core", () => applyCoreUpdateAdminAction({ version, sha256, conflicts, finish }));
  };

  const status = core.source
    ? "코어의 원본 저장소"
    : core.error
      ? "확인하지 못함"
      : core.updateAvailable
        ? `새 버전 ${core.latestVersion}`
        : core.latestVersion ? "최신" : "Store에 배포본 없음";
  const blocked = Boolean(preview && preview.blockers.length > 0);

  return (
    <AdminPanel title="Plextype 코어" description={`${storeUrl}이 배포하는 코어 배포본으로 코어 파일을 올립니다.`}>
      <dl className="divide-y divide-gray-100 text-sm dark:divide-dark-800">
        {[
          ["지금 버전", platformVersion || "-"],
          ["Store의 최신 버전", core.latestVersion || "-"],
          ["상태", status],
        ].map(([label, value]) => (
          <div key={label} className="grid min-w-0 gap-2 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <dt className="text-gray-500 dark:text-dark-400">{label}</dt>
            <dd className="min-w-0 break-words text-gray-900 dark:text-dark-100">{value}</dd>
          </div>
        ))}
      </dl>

      {core.error && (
        <div role="alert" className="flex items-start gap-2 border-t border-gray-100 px-4 py-4 text-sm leading-6 text-red-600 dark:border-dark-800 dark:text-red-300">
          <AlertCircle size={16} className="mt-1 shrink-0" />{core.error}
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 border-t border-gray-100 px-4 py-4 text-sm leading-6 text-red-600 dark:border-dark-800 dark:text-red-300">
          <AlertCircle size={16} className="mt-1 shrink-0" /><span className="min-w-0 whitespace-pre-wrap break-words">{error}</span>
        </div>
      )}

      {preview && (
        <div role="alertdialog" aria-label="코어 업데이트 전 점검" className={`border-t px-5 py-5 ${blocked ? "border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5" : "border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5"}`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">Plextype {preview.currentVersion} → {preview.version} 적용 전 점검</h3>
          <p className={`mt-2 leading-6 ${mutedClass}`}>
            파일 {preview.writes.length}개를 쓰고 {preview.removes.length}개를 지웁니다 · 배포본 {formatSize(preview.size)}. 바뀌거나 지워지는 파일은 .plextype/backup에 보관됩니다.
          </p>

          {blocked && (
            <>
              <h4 className="mt-4 text-xs font-semibold text-red-600 dark:text-red-300">적용할 수 없습니다</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-red-600 dark:text-red-300">
                {preview.blockers.map(reason => <li key={reason} className="whitespace-pre-wrap break-words">{reason}</li>)}
              </ul>
            </>
          )}

          {!preview.hasBaseline && (
            <p className="mt-4 text-sm leading-6 text-amber-700 dark:text-amber-300">
              Store에 Plextype {preview.currentVersion}의 배포본이 없어, 직접 고친 파일을 가려낼 수 없고 새 버전에서 없어진 파일도 지우지 못합니다.
              내용이 다른 파일은 모두 새 버전으로 바뀝니다. 적용한 뒤 git diff로 바뀐 내용을 확인해주세요.
            </p>
          )}

          {preview.conflicts.length > 0 && (
            <>
              <h4 className="mt-4 text-xs font-semibold text-red-600 dark:text-red-300">{preview.hasBaseline ? "직접 고친 파일이 새 버전과 충돌합니다" : "내용이 다른 파일"}</h4>
              {preview.hasBaseline && (
                <p className={`mt-1 leading-6 ${mutedClass}`}>
                  그대로 두면 새 버전의 내용이 .plextype/reference/core-{preview.version}에 받아지고, 직접 반영해야 합니다. 덮어쓰면 내 수정이 사라지고 이전 파일은 백업에 남습니다.
                </p>
              )}
              <details open className={boxClass}>
                <summary className="cursor-pointer px-3 py-2 font-mono text-xs text-gray-700 dark:text-dark-200">{preview.conflicts.length}개</summary>
                <ul className={listClass}>
                  {preview.conflicts.map(file => <li key={file.path} className="break-all">{file.path}{preview.hasBaseline ? ` · ${conflictLabel[file.kind]}` : ""}</li>)}
                </ul>
              </details>
            </>
          )}

          <h4 className={sectionTitle}>바뀌는 파일</h4>
          <FileList title="새로 추가" files={preview.writes.filter(file => file.change === "added").map(file => file.path)} />
          <FileList title="내용 변경" files={preview.writes.filter(file => file.change === "changed").map(file => file.path)} />
          <FileList title="삭제" files={preview.removes} />
          <FileList title="직접 고쳐서 그대로 두는 파일(새 버전에서 바뀌지 않음)" files={preview.kept} />

          {preview.dependencies.length > 0 && (
            <>
              <h4 className={sectionTitle}>npm 라이브러리</h4>
              <p className={`mt-1 break-words leading-6 ${mutedClass}`}>버전이 달라집니다: {preview.dependencies.join(", ")}. 적용한 뒤 npm install이 필요합니다.</p>
            </>
          )}

          {preview.migrations.length > 0 && (
            <>
              <h4 className={sectionTitle}>DB 변경</h4>
              <p className={`mt-1 leading-6 ${mutedClass}`}>코어 마이그레이션 {preview.migrations.length}개가 새로 들어옵니다. 적용한 뒤 개발 DB에 반영해야 합니다.</p>
              <ul className="mt-1 font-mono text-xs leading-6 text-gray-800 dark:text-dark-200">{preview.migrations.map(name => <li key={name} className="break-all">{name}</li>)}</ul>
            </>
          )}

          {!blocked && (
            <label className="mt-5 flex items-start gap-2 text-sm leading-6 text-gray-800 dark:text-dark-200">
              <input type="checkbox" className="mt-1.5 shrink-0" checked={finish} onChange={event => setFinish(event.target.checked)} />
              <span className="min-w-0">
                적용한 뒤 {preview.dependencies.length > 0 ? "npm install, " : ""}Prisma 클라이언트 생성{preview.migrations.length > 0 ? ", 개발 DB 마이그레이션" : ""}까지 실행
                <span className={`block ${mutedClass}`}>몇 분 걸릴 수 있고 그동안 화면이 불안정할 수 있습니다. 끝나면 개발 서버를 다시 시작해야 합니다. 고르지 않으면 적용한 뒤 터미널에서 직접 실행합니다.</span>
              </span>
            </label>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {!blocked && preview.conflicts.length === 0 && (
              <button type="button" className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`} disabled={pending} onClick={() => apply()}>
                <Download size={14} />{preview.version} 적용
              </button>
            )}
            {!blocked && preview.conflicts.length > 0 && preview.hasBaseline && (
              <button type="button" className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`} disabled={pending} onClick={() => apply("keep")}>
                <Download size={14} />고친 파일은 두고 적용
              </button>
            )}
            {!blocked && preview.conflicts.length > 0 && (
              <button
                type="button"
                className={`${adminDangerButtonClass} shrink-0 whitespace-nowrap`}
                disabled={pending}
                onClick={() => { if (window.confirm(`파일 ${preview.conflicts.length}개를 새 버전의 내용으로 덮어쓸까요? 이전 파일은 .plextype/backup에 보관됩니다.`)) apply("overwrite"); }}
              >
                {preview.hasBaseline ? "모두 새 버전으로 덮어쓰기" : "내용이 다른 파일을 바꾸고 적용"}
              </button>
            )}
            <button type="button" className={buttonClass} disabled={pending} onClick={() => setPreview(null)}>{blocked ? "닫기" : "취소"}</button>
          </div>
        </div>
      )}

      {!core.source && !preview && (
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-4 py-4 dark:border-dark-800">
          <button
            type="button"
            className={`${adminPrimaryButtonClass} shrink-0 whitespace-nowrap`}
            disabled={!canUpdate || pending || checking}
            title={!isDevelopment ? "개발 환경에서만 적용할 수 있습니다." : !storeConnected ? "연결 관리에서 Store에 먼저 연결해주세요." : !core.updateAvailable ? "받을 새 버전이 없습니다." : undefined}
            onClick={check}
          >
            <Search size={14} />{checking ? "확인 중" : busy === "core" ? "적용 중" : "바뀌는 내용 확인"}
          </button>
          <span className="text-xs leading-5 text-gray-400 dark:text-dark-500">확인만으로는 아무것도 바뀌지 않습니다.</span>
        </div>
      )}

      <div className="flex items-start gap-2 border-t border-gray-100 px-4 py-4 text-xs leading-6 text-gray-500 dark:border-dark-800 dark:text-dark-400">
        <ShieldCheck size={16} className="mt-1 shrink-0" />
        {core.source
          ? "이 저장소는 코어를 직접 고쳐 배포하는 원본이라 Store에서 코어를 받지 않습니다."
          : "코어 파일만 바꾸며 src/extensions와 src/packages는 건드리지 않습니다. git merge upstream/main으로 코어를 받는 프로젝트는 두 방법을 섞지 않습니다. npm install과 DB 적용은 고른 경우에만 실행합니다."}
      </div>
    </AdminPanel>
  );
}

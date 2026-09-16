"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Search, Send, RefreshCw, Play, Pause, X, UserRound, Users, Globe, Monitor, Smartphone } from "lucide-react";
import { AdminPage, AdminPanel, AdminEmptyState, adminInputClass, adminTextareaClass, adminPrimaryButtonClass, adminGhostButtonClass } from "@/modules/admin/components/AdminPageTemplate";
import * as actions from "../actions/broadcast.action";
import type { BroadcastDraft, BroadcastJob, BroadcastPreview, RecipientOption } from "../broadcast";

const tabs = [{ label: "메시지 발송", href: "/admin/notification" }, { label: "발송 내역", href: "/admin/notification/history" }];
const channels = { notification: "알림센터", web: "웹 푸시", app: "앱 푸시" };
const statuses: Record<string, string> = { pending: "대기", sending: "처리 중", done: "처리 완료", failed: "일부/전체 실패", skipped: "건너뜀", unknown: "결과 확인 필요" };
const formRowClass = "grid gap-3 border-b border-gray-100 px-5 py-6 dark:border-dark-800 md:grid-cols-[144px_minmax(0,1fr)] md:gap-8 md:px-6";
const formLabelClass = "text-sm font-medium text-gray-700 dark:text-dark-200 md:pt-2.5";
type Overview = { ready: boolean; webEnabled: boolean; appEnabled: boolean; jobs: BroadcastJob[]; groups: RecipientOption[] };
type RecipientResult = { userId: number; status: string; result: Record<string, unknown> | null };
function channelResult(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "-";
  const item = value as Record<string, unknown>;
  if (item.reason) return String(item.reason);
  if (item.skipped) return "설정 비활성 또는 인증 정보 미설정";
  return `전송 ${Number(item.sent || 0)}건 · 실패 ${Number(item.failed || 0)}건${!item.sent && !item.failed ? " (등록된 기기 없음)" : ""}`;
}

export default function BroadcastAdmin({ initial, history }: { initial: Overview; history: boolean }) {
  const [draft, setDraft] = useState<BroadcastDraft>({ audience: "users", ids: [], title: "", content: "", linkUrl: "/user/notifications", channels: { notification: true, web: false, app: false } });
  const [selected, setSelected] = useState<RecipientOption[]>([]);
  const [options, setOptions] = useState<RecipientOption[]>([]);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<BroadcastPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [jobs, setJobs] = useState(initial.jobs);
  const [active, setActive] = useState<string | null>(null);
  const [details, setDetails] = useState<{ id: string; rows: RecipientResult[] } | null>(null);
  const requestId = useRef<string | null>(null);
  const stop = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop.current = true; }; }, []);

  function change(next: BroadcastDraft) { setDraft(next); setPreview(null); setConfirmed(false); requestId.current = null; setMessage(""); }
  function updateJob(job: BroadcastJob) { setJobs(items => [job, ...items.filter(item => item.id !== job.id)].slice(0, 50)); }
  async function run(job: BroadcastJob) {
    setActive(job.id); stop.current = false;
    try {
      let current = job;
      while (mounted.current && !stop.current && (current.pending > 0 || current.sending > 0)) {
        const result = await actions.processBroadcastBatchAdminAction(current.id);
        if (!mounted.current) return;
        if (!result.success) { setMessage(result.message); break; }
        updateJob(result.data);
        if (result.data.pending === current.pending) break;
        current = result.data;
      }
    } catch { if (mounted.current) setMessage("응답을 확인하지 못했습니다. 내역을 새로고침한 뒤 남은 대상만 이어서 처리해 주세요."); }
    finally { if (mounted.current) { setActive(null); setBusy(false); } }
  }
  async function task(fn: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await fn(); } catch { setMessage("요청을 처리하지 못했습니다. 잠시 후 다시 확인해 주세요."); }
    finally { if (mounted.current) setBusy(false); }
  }
  const disabled = busy || active !== null;
  const recipientOptions = draft.audience === "groups" ? initial.groups : options;

  return <AdminPage icon={<Bell size={14} />} eyebrow="Notification" title={history ? "발송 내역" : "메시지 발송"} tabs={tabs} activeHref={tabs[history ? 1 : 0].href} description="회원별·그룹별·전체 회원에게 운영 알림을 발송합니다.">
    {!initial.ready && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">발송 이력 테이블이 아직 없습니다. 알림 발송용 DB 마이그레이션 적용 후 사용할 수 있습니다.</p>}
    {message && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{message}</p>}
    {!history && <AdminPanel title="알림 작성">
      <fieldset disabled={disabled || !initial.ready} className="min-w-0 text-sm text-gray-700 dark:text-dark-200 disabled:opacity-60 [&_input[type=checkbox]]:accent-primary-500">
        <div className={formRowClass}>
        <div className={formLabelClass}>발송 대상 <span className="text-primary-500">(*)</span></div>
        <div className="min-w-0 max-w-3xl space-y-4">
        <div className="inline-grid max-w-full grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-dark-800">{([['users', '회원 선택', UserRound], ['groups', '그룹 선택', Users], ['all', '전체 회원', Globe]] as const).map(([value, label, Icon]) => <label key={value} className="min-w-0 cursor-pointer"><input className="peer sr-only" type="radio" name="audience" checked={draft.audience === value} onChange={() => { change({ ...draft, audience: value, ids: [] }); setSelected([]); setOptions([]); }} /><span className="flex min-h-9 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-gray-500 transition-colors peer-checked:bg-white peer-checked:text-primary-600 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-disabled:cursor-not-allowed dark:text-dark-400 dark:peer-checked:bg-dark-950 dark:peer-checked:text-primary-300"><Icon size={14} className="hidden shrink-0 sm:block" />{label}</span></label>)}</div>
        {draft.audience !== "all" && <div className="space-y-3">
          {draft.audience === "users" && <div className="flex gap-2"><input aria-label="회원 검색" className={adminInputClass} value={search} maxLength={100} onChange={e => setSearch(e.target.value)} placeholder="닉네임, 계정 또는 이메일" /><button type="button" className={adminGhostButtonClass} onClick={() => task(async () => { const result = await actions.searchBroadcastRecipientsAdminAction("users", search); if (result.success) { setOptions(result.data); if (!result.data.length) setMessage("검색 결과가 없습니다."); } else setMessage(result.message); })}><Search size={16} />검색</button></div>}
          {draft.audience === "users" && selected.length > 0 && <div className="flex flex-wrap gap-2">{selected.map(item => <button key={item.id} type="button" className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 dark:bg-dark-800" onClick={() => { setSelected(selected.filter(i => i.id !== item.id)); change({ ...draft, ids: draft.ids.filter(id => id !== item.id) }); }} title={`${item.label} 선택 해제`}>{item.label}<X size={14} /></button>)}</div>}
          {draft.audience === "groups" && !recipientOptions.length && <p className="text-sm text-gray-500 dark:text-dark-400">등록된 그룹이 없습니다.</p>}
          {recipientOptions.length > 0 && <div className={draft.audience === "groups" ? "grid gap-2 sm:grid-cols-2" : "max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-800"}>{recipientOptions.map(item => <label key={item.id} className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-md border px-3 py-3 transition-colors ${draft.ids.includes(item.id) ? "border-primary-500/30 bg-primary-500/5 dark:border-primary-400/30" : "border-gray-200 hover:bg-gray-50 dark:border-dark-700 dark:hover:bg-dark-900"}`}><input className="h-4 w-4 shrink-0" type="checkbox" checked={draft.ids.includes(item.id)} onChange={e => { setSelected(e.target.checked ? [...selected, item] : selected.filter(i => i.id !== item.id)); change({ ...draft, ids: e.target.checked ? [...draft.ids, item.id] : draft.ids.filter(id => id !== item.id) }); }} /><span className="min-w-0 break-words font-medium">{item.label}<span className="mt-0.5 block text-xs font-normal text-gray-400 dark:text-dark-400">{item.detail}</span></span></label>)}</div>}
        </div>}
        <p className="text-xs text-gray-500 dark:text-dark-400">비활성 회원과 관리자 알림 수신 거부 회원은 제외합니다. 여러 그룹에 속한 회원은 한 번만 포함합니다.</p>
        </div></div>
        <div className={formRowClass}><div className={formLabelClass}>발송 채널 <span className="text-primary-500">(*)</span></div><div className="grid max-w-3xl gap-3 sm:grid-cols-3">{(Object.keys(channels) as (keyof typeof channels)[]).map(key => { const Icon = { notification: Bell, web: Monitor, app: Smartphone }[key]; const unavailable = key === "web" && !initial.webEnabled || key === "app" && !initial.appEnabled; return <label key={key} className={`flex items-center justify-between gap-3 py-2 ${unavailable ? "opacity-50" : "cursor-pointer"}`}><span className="flex items-center gap-2"><Icon size={16} className="shrink-0 text-gray-400" /><span className="text-xs font-medium">{channels[key]}{unavailable && <span className="block text-[11px] font-normal text-gray-400">사용 안 함</span>}</span></span><span className="relative inline-flex shrink-0"><input className="peer sr-only" type="checkbox" role="switch" checked={draft.channels[key]} disabled={unavailable} onChange={e => change({ ...draft, channels: { ...draft.channels, [key]: e.target.checked } })} /><span className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary-500 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:bg-dark-700" /><span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" /></span></label>; })}</div></div>
        <label className={formRowClass}><span className={formLabelClass}>제목 <span className="text-primary-500">(*)</span></span><input className={`${adminInputClass} max-w-3xl`} maxLength={100} value={draft.title} onChange={e => change({ ...draft, title: e.target.value })} /></label>
        <label className={formRowClass}><span className={formLabelClass}>내용 <span className="text-primary-500">(*)</span></span><span className="block min-w-0 max-w-3xl"><textarea className={adminTextareaClass} rows={5} maxLength={2000} value={draft.content} onChange={e => change({ ...draft, content: e.target.value })} /><span className="mt-2 block text-right text-xs tabular-nums text-gray-400">{draft.content.length} / 2,000</span></span></label>
        <label className={formRowClass}><span className={formLabelClass}>이동 경로 <span className="text-primary-500">(*)</span></span><input className={`${adminInputClass} max-w-3xl`} value={draft.linkUrl} maxLength={500} onChange={e => change({ ...draft, linkUrl: e.target.value })} placeholder="/posts/notice" /></label>
        <div className="flex justify-end bg-gray-50/70 px-5 py-4 dark:bg-dark-900/40"><button type="button" className={adminPrimaryButtonClass} onClick={() => task(async () => { const result = await actions.previewBroadcastAdminAction(draft); if (result.success) { setPreview(result.data); setConfirmed(false); } else setMessage(result.message); })}><Users size={16} />발송 대상 확인</button></div>
        {preview && <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-dark-800"><p>발송 대상 <strong>{preview.count.toLocaleString()}명</strong> · 웹 구독 회원 {preview.webUsers}명 · 앱 등록 회원 {preview.appUsers}명</p><label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>대상과 내용을 확인했습니다. {draft.audience === "all" ? "전체 대상 회원에게" : "선택한 대상에게"} 발송합니다.</span></label><button type="button" disabled={!confirmed || preview.count === 0} className={adminPrimaryButtonClass} onClick={() => task(async () => { requestId.current ??= crypto.randomUUID(); const result = await actions.createBroadcastAdminAction(requestId.current, draft, preview.count); if (!result.success) { setMessage(result.message); return; } updateJob(result.data); setPreview(null); setConfirmed(false); await run(result.data); })}><Send size={16} />발송 시작</button></div>}
      </fieldset>
    </AdminPanel>}
    <AdminPanel title={history ? "최근 발송 50건" : "발송 진행 및 최근 내역"} description="화면을 닫으면 남은 대상은 발송 내역에서 이어서 처리할 수 있습니다. 푸시 처리 완료는 기기 수신·열람을 보장하지 않습니다." action={<button type="button" disabled={disabled} className={adminGhostButtonClass} onClick={() => task(async () => { const result = await actions.getBroadcastOverviewAdminAction(); if (result.success) setJobs(result.data.jobs); else setMessage(result.message); })}><RefreshCw size={14} />새로고침</button>}>
      {!jobs.length ? <AdminEmptyState icon={<Bell size={28} />} title="발송 내역이 없습니다" /> : <div className="divide-y divide-gray-100 dark:divide-dark-800">{jobs.map(job => <div key={job.id} className="space-y-3 p-5 text-sm text-gray-700 dark:text-dark-200">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 break-words"><button type="button" className="text-left font-semibold hover:underline" disabled={disabled} onClick={() => task(async () => { const result = await actions.getBroadcastResultsAdminAction(job.id); if (result.success) setDetails({ id: job.id, rows: result.data }); else setMessage(result.message); })}>{job.draft.title}</button><p className="mt-1 text-xs text-gray-500 dark:text-dark-400">{new Date(job.createdAt).toLocaleString("ko-KR")} · {Object.entries(channels).filter(([key]) => job.draft.channels[key as keyof typeof channels]).map(([, label]) => label).join(" · ")}</p></div>{active === job.id ? <button type="button" className={adminGhostButtonClass} onClick={() => { stop.current = true; setMessage("현재 처리 중인 대상이 끝나면 일시중지합니다."); }}><Pause size={14} />일시중지</button> : (job.pending > 0 || job.sending > 0) && <button type="button" disabled={disabled} className={adminGhostButtonClass} onClick={() => { setBusy(true); void run(job); }}><Play size={14} />{job.pending ? "이어서 발송" : "상태 확인"}</button>}</div>
        <progress className="h-2 w-full accent-primary-500" max={Math.max(1, job.total)} value={job.total - job.pending - job.sending} aria-label="처리 진행률" />
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs"><span>대상 {job.total}명</span>{Object.entries(statuses).map(([key, label]) => <span key={key}>{label} {job[key as keyof Pick<BroadcastJob, 'pending' | 'sending' | 'done' | 'failed' | 'skipped' | 'unknown'>]}</span>)}</div>
        {details?.id === job.id && <div className="border-t border-gray-100 pt-3 dark:border-dark-800"><div className="flex items-center justify-between gap-3"><p className="text-xs">대상별 결과 (최근 100건). 결과 확인 필요 항목은 중복 방지를 위해 자동 재발송하지 않습니다.</p><button type="button" title="결과 닫기" onClick={() => setDetails(null)}><X size={16} /></button></div><p className="my-3 whitespace-pre-wrap break-words">{job.draft.content}</p><div className="max-h-80 overflow-auto divide-y divide-gray-100 dark:divide-dark-800">{details.rows.map(row => <div key={row.userId} className="grid gap-2 py-3 text-xs sm:grid-cols-[140px_1fr]"><span>회원 #{row.userId} · {statuses[row.status] || row.status}</span><div className="space-y-1">{row.result ? Object.entries(row.result).map(([key, value]) => <p key={key}>{channels[key as keyof typeof channels] || "안내"}: {channelResult(value)}</p>) : <p>처리 결과가 아직 없습니다.</p>}</div></div>)}</div></div>}
      </div>)}</div>}
    </AdminPanel>
  </AdminPage>;
}

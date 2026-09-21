"use client";

import { useState, useTransition } from "react";
import { Mail, Save, Server, ShieldCheck, KeyRound, CirclePause } from "lucide-react";
import Button from "@components/button/Button";
import { AdminPage, AdminPanel, adminInputClass } from "../components/AdminPageTemplate";
import { getMailSettingsAdminAction, updateMailSettingsAdminAction } from "../actions/mail-settings.action";
import type { MailSettingsView } from "../mail-settings";

export default function MailSettingsPage({ initial, tabs }: { initial: MailSettingsView; tabs: Array<{ label: string; href: string }> }) {
  const [settings, setSettings] = useState(initial);
  const [mode, setMode] = useState(initial.mode);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const rowClass = "grid min-w-0 gap-3 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center";
  const labelClass = "text-sm text-gray-500 dark:text-dark-400";
  return (
    <AdminPage eyebrow="Settings" title="메일 설정" tabs={tabs} activeHref="/admin/settings/mail" icon={<Mail size={13} />} action={
      <Button type="submit" form="mail-settings" className="shrink-0 whitespace-nowrap" icon={<Save size={14} />} isLoading={pending}>저장</Button>
    }>
      <dl aria-label="저장된 메일 설정 요약" className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "발송 설정", value: settings.mode === "disabled" ? "사용 안 함" : settings.mode === "custom" ? "SMTP 직접 설정" : "서버 환경변수", Icon: Mail, tone: "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300" },
          { label: "SMTP 서버", value: settings.mode === "custom" ? settings.host || "미설정" : settings.mode === "environment" ? settings.environmentConfigured ? "환경변수 설정됨" : "환경변수 미설정" : "사용 안 함", Icon: Server, tone: "bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-300" },
          { label: "직접 설정 인증정보", value: settings.passwordConfigured ? "저장됨" : "미등록", Icon: KeyRound, tone: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" },
          { label: "연결 확인", value: "미검증", Icon: CirclePause, tone: "bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-400" },
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
      <form id="mail-settings" onSubmit={event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setMessage("");
        startTransition(async () => {
          try {
            const result = await updateMailSettingsAdminAction(form);
            setMessage(result.message);
            setSuccess(result.success);
            if (result.success) {
              setPassword("");
              const refreshed = await getMailSettingsAdminAction();
              if (refreshed.data) setSettings(refreshed.data);
            }
          } catch { setSuccess(false); setMessage("메일 설정을 저장하지 못했습니다."); }
        });
      }} className="space-y-6">
        {message && <p role={success ? "status" : "alert"} className={`text-sm ${success ? "text-green-700 dark:text-green-400" : "text-red-500"}`}>{message}</p>}
        <AdminPanel title="메일 발송">
          <div className={rowClass}>
            <label htmlFor="mail-mode" className={labelClass}>설정 방식</label>
            <select id="mail-mode" name="mode" value={mode} onChange={event => setMode(event.target.value as MailSettingsView["mode"])} className={`${adminInputClass} max-w-lg`} disabled={pending}>
              <option value="environment">서버 환경변수 사용</option>
              <option value="custom">SMTP 직접 설정</option>
              <option value="disabled">발송 사용 안 함</option>
            </select>
          </div>
        </AdminPanel>
        <AdminPanel title="SMTP 서버">
          <fieldset disabled={pending || mode !== "custom"} className="divide-y divide-gray-100 disabled:opacity-50 dark:divide-dark-800">
            {[
              { name: "host", label: "SMTP 서버", placeholder: "smtp.gmail.com", type: "text", value: settings.host },
              { name: "port", label: "포트", placeholder: "465", type: "number", value: settings.port },
              { name: "user", label: "인증 계정", placeholder: "", type: "text", value: settings.user },
              { name: "from", label: "발신 이메일", placeholder: "help@gjworks.dev", type: "email", value: settings.from },
            ].map(field => <div key={field.name} className={rowClass}>
              <label htmlFor={`mail-${field.name}`} className={labelClass}>{field.label} <span className="text-red-500">(*)</span></label>
              <input id={`mail-${field.name}`} name={field.name} type={field.type} defaultValue={field.value} placeholder={field.placeholder} required={mode === "custom"} min={field.type === "number" ? 1 : undefined} max={field.type === "number" ? 65535 : undefined} className={`${adminInputClass} max-w-lg`} autoComplete="off" />
            </div>)}
            <div className={rowClass}>
              <label htmlFor="mail-security" className={labelClass}>암호화 <span className="text-red-500">(*)</span></label>
              <select id="mail-security" name="secure" defaultValue={String(settings.secure)} className={`${adminInputClass} max-w-lg`}>
                <option value="true">TLS (465)</option><option value="false">STARTTLS (587)</option>
              </select>
            </div>
            <div className={rowClass}>
              <label htmlFor="mail-password" className={labelClass}>SMTP 비밀번호 {!settings.passwordConfigured && <span className="text-red-500">(*)</span>}</label>
              <input id="mail-password" name="password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required={mode === "custom" && !settings.passwordConfigured} placeholder={settings.passwordConfigured ? "저장됨 · 변경할 때만 입력" : "앱 비밀번호 또는 SMTP 비밀번호"} className={`${adminInputClass} max-w-lg`} />
            </div>
          </fieldset>
          <div className="flex items-start gap-2 border-t border-gray-100 px-4 py-4 text-xs leading-6 text-gray-500 dark:border-dark-800 dark:text-dark-400">
            <ShieldCheck size={16} className="mt-1 shrink-0" />
            <span>SMTP 비밀번호는 암호화하여 저장됩니다. 저장만으로 메일이 발송되지는 않습니다.</span>
          </div>
        </AdminPanel>
        {mode === "custom" && !settings.encryptionReady && <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">인증정보 저장을 위해 서버에 32자 이상의 MAIL_ENCRYPTION_KEY 또는 SECRET_KEY가 필요합니다.</p>}
      </form>
    </AdminPage>
  );
}

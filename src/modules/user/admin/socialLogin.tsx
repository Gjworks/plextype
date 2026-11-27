"use client";

import { useState, useTransition } from "react";
import { Check, ChevronRight, Copy, ExternalLink, KeyRound, Save, ShieldCheck, X } from "lucide-react";

import Button from "@components/button/Button";
import Switch from "@components/form/Switch";
import Modal from "@components/modal/Modal";
import { AdminPage, adminGhostButtonClass, adminInputClass, adminTextareaClass } from "@/core/components/admin/AdminPageTemplate";

import type { SocialLoginProviderSettings, SocialLoginSettingsView } from "@/modules/user/actions/social.type";
import { getSocialLoginSettingsAdminAction, saveSocialLoginProviderAdminAction } from "@/modules/user/actions/social.action";
import { ProviderIcon } from "@/modules/user/tpl/shared/SocialProviderIcon";

const labelClass = "text-[13px] font-medium text-gray-600 dark:text-dark-300";

// 흰 바탕의 대표색은 카드 바탕과 구분되지 않아 테두리를 준다.
const tileBorder = (background: string) => (/^#f{3}(f{3})?$/i.test(background) ? "ring-1 ring-inset ring-gray-200 dark:ring-dark-700" : "");

const BrandTile = ({ provider, size }: { provider: SocialLoginProviderSettings; size: "md" | "lg" }) => (
  <span
    style={{ background: provider.brand.background, color: provider.brand.color }}
    className={`flex shrink-0 items-center justify-center ${size === "lg" ? "size-12 rounded-2xl" : "size-11 rounded-xl"} ${tileBorder(provider.brand.background)}`}
  >
    <ProviderIcon providerKey={provider.key} label={provider.label} logo={provider.logo} size={size === "lg" ? 22 : 20} />
  </span>
);

// 켜 두었지만 필수 값이 빠져 버튼이 나오지 않는 상태를 따로 알려 준다.
const statusOf = (provider: SocialLoginProviderSettings) => (
  provider.active
    ? { label: "사용 중", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300", dot: "bg-emerald-500" }
    : provider.enabled
      ? { label: "설정 필요", className: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", dot: "bg-amber-500" }
      : { label: "사용 안 함", className: "bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-400", dot: "bg-gray-300 dark:bg-dark-600" }
);

const StatusBadge = ({ provider }: { provider: SocialLoginProviderSettings }) => {
  const status = statusOf(provider);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
      <span className={`size-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
};

// 제공자 하나의 설정 창. 제공자마다 따로 저장한다.
const ProviderSettings = ({ provider, encryptionReady, onSaved, onClose }: {
  provider: SocialLoginProviderSettings;
  encryptionReady: boolean;
  onSaved: (view: SocialLoginSettingsView) => void;
  onClose: () => void;
}) => {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  // 저장한 뒤 비밀 칸을 비우기 위해 폼을 다시 만든다.
  const [formVersion, setFormVersion] = useState(0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(provider.callbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* 복사가 막힌 브라우저에서는 주소를 직접 선택해 복사한다. */ }
  };

  return (
    <form
      key={formVersion}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setResult(null);
        startTransition(async () => {
          try {
            const saved = await saveSocialLoginProviderAdminAction(form);
            setResult(saved);
            if (saved.success) {
              onSaved(await getSocialLoginSettingsAdminAction());
              setFormVersion((version) => version + 1);
            }
          } catch { setResult({ success: false, message: "설정을 저장하지 못했습니다." }); }
        });
      }}
      className="flex max-h-[88vh] flex-col overflow-hidden rounded-2xl bg-white text-left dark:bg-dark-950"
    >
      <input type="hidden" name="provider" value={provider.key} />
      <header className="flex items-center gap-4 border-b border-gray-100 px-6 py-5 dark:border-dark-800">
        <BrandTile provider={provider} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-gray-800 dark:text-dark-100">{provider.label} 로그인</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <StatusBadge provider={provider} />
            연결된 계정 {provider.linkedCount}개
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="닫기" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-800">
          <X size={18} />
        </button>
      </header>

      {/* fieldset은 높이 제한과 스크롤을 따르지 않는 브라우저가 있어, 스크롤은 바깥 div가 맡는다. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
      <fieldset disabled={pending} className="min-w-0 space-y-6 px-6 py-6">
        <section className="rounded-xl bg-gray-50 p-4 dark:bg-dark-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[13px] font-semibold text-gray-700 dark:text-dark-100">1. 키 발급받기</div>
            <a href={provider.guide.consoleUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-300">
              {provider.guide.consoleName} 열기 <ExternalLink size={12} />
            </a>
          </div>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] leading-6 text-gray-500 dark:text-dark-400">
            {provider.guide.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <div className="mt-4">
            <div className="text-xs text-gray-400">등록할 리다이렉트 주소</div>
            <div className="mt-1.5 flex items-center gap-2">
              <input readOnly value={provider.callbackUrl} onFocus={(event) => event.currentTarget.select()} aria-label={`${provider.label} 리다이렉트 주소`} className={`${adminInputClass} font-mono text-xs`} />
              <button type="button" onClick={copy} className={`${adminGhostButtonClass} shrink-0`}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="text-[13px] font-semibold text-gray-700 dark:text-dark-100">2. 발급받은 값 넣기</div>
          <div className="mt-3 grid gap-4">
            {provider.fields.map((field) => {
              const id = `${provider.key}-${field.name}`;
              const placeholder = field.secret && field.configured ? "저장됨 · 바꿀 때만 입력" : field.placeholder;
              return (
                <div key={field.name} className="grid gap-1.5">
                  <label htmlFor={id} className={labelClass}>
                    {field.label}
                    {!field.required && <span className="ml-1 font-normal text-gray-400">(선택)</span>}
                  </label>
                  {field.multiline ? (
                    <textarea id={id} name={`field.${field.name}`} rows={5} spellCheck={false} placeholder={placeholder} className={`${adminTextareaClass} font-mono text-xs`} />
                  ) : (
                    <input
                      id={id}
                      name={`field.${field.name}`}
                      type={field.secret ? "password" : "text"}
                      defaultValue={field.value}
                      autoComplete={field.secret ? "new-password" : "off"}
                      spellCheck={false}
                      placeholder={placeholder}
                      className={adminInputClass}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-gray-400">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            비밀 값은 암호화해 저장하며 다시 보여 주지 않습니다.
          </p>
        </section>

        <section className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3.5 dark:border-dark-800">
          <div>
            <div className="text-[13px] font-semibold text-gray-700 dark:text-dark-100">3. 사용하기</div>
            <div className="mt-0.5 text-xs text-gray-400">켜면 로그인·가입 화면에 {provider.label} 버튼이 나옵니다.</div>
          </div>
          <Switch name="enabled" defaultChecked={provider.enabled} aria-label={`${provider.label} 로그인 사용`} />
        </section>

        {!encryptionReady && (
          <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">비밀 값을 저장하려면 서버에 32자 이상의 SECRET_KEY가 필요합니다.</p>
        )}
      </fieldset>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-gray-100 px-6 py-4 dark:border-dark-800">
        <p role={result?.success ? "status" : "alert"} className={`min-w-0 text-sm ${result?.success ? "text-emerald-700 dark:text-emerald-400" : "text-red-500"}`}>
          {result?.message}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onClose} className={adminGhostButtonClass}>닫기</button>
          <Button type="submit" icon={<Save size={14} />} isLoading={pending}>저장</Button>
        </div>
      </footer>
    </form>
  );
};

// 소셜 로그인 설정 화면. 제공자를 카드로 늘어놓고, 카드를 누르면 그 제공자의 설정 창을 연다.
// 제공자가 늘어나도 화면이 길어지지 않고 한눈에 상태를 볼 수 있게 하기 위함이다.
export default function SocialLoginSettingsAdmin({ initial }: { initial: SocialLoginSettingsView }) {
  const [view, setView] = useState(initial);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const opened = view.providers.find((provider) => provider.key === openKey) ?? null;
  const activeCount = view.providers.filter((provider) => provider.active).length;

  return (
    <AdminPage
      eyebrow="Social Login"
      title="소셜 로그인"
      description="쓸 로그인 수단을 골라 키를 넣고 켜면 로그인·가입 화면에 버튼이 나옵니다."
      icon={<KeyRound size={13} />}
      action={<div className="text-xs text-gray-400">{view.providers.length}개 가운데 <span className="font-semibold text-gray-700 dark:text-dark-100">{activeCount}개 사용 중</span></div>}
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {view.providers.map((provider) => (
          <li key={provider.key}>
            <button
              type="button"
              onClick={() => setOpenKey(provider.key)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-950 dark:hover:border-dark-700"
            >
              <BrandTile provider={provider} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-800 dark:text-dark-100">{provider.label}</span>
                <span className="mt-1 block text-xs text-gray-400">연결된 계정 {provider.linkedCount}개</span>
              </span>
              <StatusBadge provider={provider} />
              <ChevronRight size={16} className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
            </button>
          </li>
        ))}
      </ul>

      <Modal state={Boolean(opened)} close={() => setOpenKey(null)} size="sm">
        {opened && (
          <ProviderSettings
            key={opened.key}
            provider={opened}
            encryptionReady={view.encryptionReady}
            onSaved={setView}
            onClose={() => setOpenKey(null)}
          />
        )}
      </Modal>
    </AdminPage>
  );
}

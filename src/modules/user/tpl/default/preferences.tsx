"use client";

import type React from "react";
import { useMemo, useState, useTransition } from "react";
import { Bell, Check, Monitor, Moon, Settings2, Sun, Type } from "lucide-react";

import Button from "@/core/components/button/Button";
import HeaderUser from "@/modules/user/tpl/default/header";
import { syncThemeColorMeta } from "@/core/utils/theme/themeColor";
import {
  UserFontScalePreference,
  UserPreferenceData,
  UserThemePreference,
} from "@/modules/user/actions/preference.query";
import { saveMyPreferenceAction } from "@/modules/user/actions/preference.action";

type PreferencesProps = {
  initialPreference: UserPreferenceData;
};

const themeOptions: Array<{ value: UserThemePreference; label: string; icon: React.ReactNode }> = [
  { value: "system", label: "시스템", icon: <Monitor size={16} /> },
  { value: "light", label: "라이트", icon: <Sun size={16} /> },
  { value: "dark", label: "다크", icon: <Moon size={16} /> },
];

const fontScaleOptions: Array<{ value: UserFontScalePreference; label: string }> = [
  { value: "small", label: "작게" },
  { value: "normal", label: "기본" },
  { value: "large", label: "크게" },
];

const applyClientTheme = (theme: UserThemePreference) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", shouldUseDark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";
  syncThemeColorMeta(shouldUseDark ? "dark" : "light");
  localStorage.setItem("userThemePreference", theme);
  document.cookie = `userThemePreference=${encodeURIComponent(theme)}; path=/; max-age=31536000; samesite=lax`;
};

const Toggle = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300 dark:border-dark-800 dark:bg-dark-900 dark:hover:border-dark-700"
      aria-pressed={checked}
    >
      <span>
        <span className="block text-sm font-medium text-gray-950 dark:text-dark-100">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-dark-400">{description}</span>
      </span>
      <span className={`relative block h-6 w-11 min-w-11 rounded-full transition-colors ${checked ? "bg-gray-950 dark:bg-dark-100" : "bg-gray-200 dark:bg-dark-700"}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-dark-950 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
};

const OptionButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
      active
        ? "bg-gray-950 text-white dark:bg-dark-100 dark:text-dark-950"
        : "bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-950 dark:bg-dark-900 dark:text-dark-300 dark:ring-dark-700 dark:hover:bg-dark-800 dark:hover:text-white"
    }`}
  >
    {children}
  </button>
);

const Preferences = ({ initialPreference }: PreferencesProps) => {
  const [preference, setPreference] = useState<UserPreferenceData>(initialPreference);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const formData = useMemo(() => {
    const data = new FormData();
    Object.entries(preference).forEach(([key, value]) => data.set(key, String(value)));
    return data;
  }, [preference]);

  const handleThemeChange = (theme: UserThemePreference) => {
    setPreference((prev) => ({ ...prev, theme }));
    applyClientTheme(theme);
  };

  const handleFontScaleChange = (fontScale: UserFontScalePreference) => {
    setPreference((prev) => ({ ...prev, fontScale }));
    document.documentElement.dataset.fontScale = fontScale;
  };

  const handleSubmit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveMyPreferenceAction(formData);
      if (!result.success || !result.data) {
        setMessage({ type: "error", text: result.message || "개인 설정 저장에 실패했습니다." });
        return;
      }
      setPreference(result.data);
      applyClientTheme(result.data.theme);
      setMessage({ type: "success", text: result.message || "개인 설정이 저장되었습니다." });
    });
  };

  return (
    <>
      <HeaderUser />
      <div className="min-h-screen bg-white dark:bg-dark-950">
        <div className="mx-auto max-w-screen-lg px-4 py-10 md:py-14">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-900 md:p-8">
            <div className="border-b border-gray-200 pb-6 dark:border-dark-800">
              <div className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">Preference</div>
              <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-gray-950 dark:text-dark-100">개인 설정</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-400">화면 표시와 알림 수신 방식을 계정 기준으로 저장합니다.</p>
            </div>

            {message && (
              <div className={`mt-5 rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-200" : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300"}`}>
                {message.text}
              </div>
            )}

            <section className="mt-6 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-800 dark:bg-dark-950/40">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-950 dark:text-dark-100">
                  <Settings2 size={16} />
                  화면
                </div>
                <div className="flex flex-wrap gap-2">
                  {themeOptions.map((item) => (
                    <OptionButton key={item.value} active={preference.theme === item.value} onClick={() => handleThemeChange(item.value)}>
                      {item.icon}
                      {item.label}
                    </OptionButton>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {fontScaleOptions.map((item) => (
                    <OptionButton key={item.value} active={preference.fontScale === item.value} onClick={() => handleFontScaleChange(item.value)}>
                      <Type size={15} />
                      {item.label}
                    </OptionButton>
                  ))}
                </div>
                <div className="mt-4">
                  <Toggle
                    title="애니메이션 줄이기"
                    description="움직임이 많은 전환 효과를 줄입니다."
                    checked={preference.reduceMotion}
                    onChange={(checked) => {
                      setPreference((prev) => ({ ...prev, reduceMotion: checked }));
                      document.documentElement.dataset.motion = checked ? "reduced" : "default";
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-800 dark:bg-dark-950/40">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-950 dark:text-dark-100">
                  <Bell size={16} />
                  알림
                </div>
                <div className="grid gap-3">
                  <Toggle title="댓글 알림" description="내 글에 새 댓글이 달릴 때 알림을 받습니다." checked={preference.notifyComments} onChange={(checked) => setPreference((prev) => ({ ...prev, notifyComments: checked }))} />
                  <Toggle title="답글 알림" description="내 댓글에 답글이 달릴 때 알림을 받습니다." checked={preference.notifyReplies} onChange={(checked) => setPreference((prev) => ({ ...prev, notifyReplies: checked }))} />
                  <Toggle title="운영 알림" description="관리자 안내와 운영 알림을 받습니다." checked={preference.notifyAdmin} onChange={(checked) => setPreference((prev) => ({ ...prev, notifyAdmin: checked }))} />
                </div>
              </div>
            </section>

            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={handleSubmit} isLoading={isPending} icon={<Check size={15} />}>
                저장하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Preferences;

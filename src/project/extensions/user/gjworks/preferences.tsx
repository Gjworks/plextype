"use client";

import type React from "react";
import { useMemo, useState, useTransition } from "react";
import { Bell, Check, Eye, Monitor, Moon, Settings2, Sun, Type, Wand2 } from "lucide-react";

import Button from "@/core/components/button/Button";
import HeaderUser from "./header";
import {
  UserFontScalePreference,
  UserPreferenceData,
  UserThemePreference,
} from "@/modules/user/actions/preference.query";
import { saveMyPreferenceAction } from "@/modules/user/actions/preference.action";

type PreferencesProps = {
  initialPreference: UserPreferenceData;
};

const themeOptions: Array<{
  value: UserThemePreference;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { value: "system", label: "시스템", description: "기기 설정을 따라갑니다.", icon: <Monitor size={16} /> },
  { value: "light", label: "라이트", description: "밝은 화면을 유지합니다.", icon: <Sun size={16} /> },
  { value: "dark", label: "다크", description: "어두운 화면을 유지합니다.", icon: <Moon size={16} /> },
];

const fontScaleOptions: Array<{
  value: UserFontScalePreference;
  label: string;
  description: string;
}> = [
  { value: "small", label: "작게", description: "정보 밀도를 높입니다." },
  { value: "normal", label: "기본", description: "기본 크기로 표시합니다." },
  { value: "large", label: "크게", description: "텍스트를 더 쉽게 읽습니다." },
];

const applyClientTheme = (theme: UserThemePreference) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", shouldUseDark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";
  localStorage.setItem("userThemePreference", theme);
  document.cookie = `userThemePreference=${encodeURIComponent(theme)}; path=/; max-age=31536000; samesite=lax`;
};

const PreferenceToggle = ({
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
      className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-gray-200 bg-white p-4 text-left shadow-sm shadow-gray-100 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-dark-800 dark:bg-dark-900 dark:shadow-black/20 dark:hover:border-dark-700 dark:hover:bg-dark-800"
      aria-pressed={checked}
    >
      <span>
        <span className="block text-sm font-semibold text-gray-900 dark:text-dark-100">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-gray-400 dark:text-dark-400">{description}</span>
      </span>
      <span
        className="relative block h-6 w-11 min-w-11 rounded-full bg-gray-200 transition-colors data-[checked=true]:bg-gray-900 dark:bg-dark-700 dark:data-[checked=true]:bg-dark-100"
        data-checked={checked}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform dark:bg-dark-950 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
};

const Preferences = ({ initialPreference }: PreferencesProps) => {
  const [preference, setPreference] = useState<UserPreferenceData>(initialPreference);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const formData = useMemo(() => {
    const data = new FormData();
    Object.entries(preference).forEach(([key, value]) => {
      data.set(key, String(value));
    });
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
      setMessage({ type: "success", text: result.message || "개인 설정이 저장되었습니다." });
      applyClientTheme(result.data.theme);
    });
  };

	  return (
	    <>
	      <HeaderUser />
	      <div className="min-h-screen bg-white dark:bg-dark-950 dark:text-dark-100">
	        <div className="mx-auto max-w-screen-lg px-3 py-8 md:px-5 md:py-10">
	          <div className="mx-auto max-w-2xl">
	            <section className="border-b border-gray-200 pb-6 dark:border-dark-800">
	              <div className="flex items-end justify-between gap-4">
	                <div>
	                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-dark-500">
	                    <Settings2 size={14} />
	                    My Preference
	                  </div>
	                  <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-950 dark:text-dark-100">개인 설정</h1>
	                  <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400 dark:text-dark-400">
	                    화면 표시, 알림 수신, 작성 환경을 내 계정 기준으로 저장합니다.
	                  </p>
	                </div>
	              </div>
	            </section>
	
	            {message && (
	              <div className={`mt-5 rounded-md px-3 py-2 text-sm ${
	                message.type === "success"
	                  ? "bg-gray-100 text-gray-700 dark:bg-dark-900 dark:text-dark-200"
	                  : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300"
	              }`}>
	                {message.text}
	              </div>
	            )}
	
	            <section className="mt-6 space-y-4">
	              <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100 dark:border-dark-800 dark:bg-dark-900 dark:shadow-black/20">
	                <div className="mb-4 flex items-start gap-3">
	                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300">
	                    <Wand2 size={17} />
	                  </div>
	                  <div>
	                    <div className="text-sm font-black text-gray-950 dark:text-dark-100">화면 표시</div>
	                    <p className="mt-1 text-xs leading-5 text-gray-400 dark:text-dark-400">
	                      다크모드와 읽기 편의성을 설정합니다.
	                    </p>
	                  </div>
	                </div>
	
	                <div className="grid gap-3 md:grid-cols-3">
	                  {themeOptions.map((item) => {
	                    const active = preference.theme === item.value;
	                    return (
	                      <button
	                        key={item.value}
	                        type="button"
	                        onClick={() => handleThemeChange(item.value)}
	                        className={`cursor-pointer rounded-md border p-4 text-left shadow-sm transition-colors ${
	                          active
	                            ? "border-gray-900 bg-gray-950 text-white shadow-gray-200 dark:border-dark-100 dark:bg-dark-100 dark:text-dark-950 dark:shadow-black/20"
	                            : "border-gray-200 bg-white text-gray-500 shadow-gray-100 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 dark:border-dark-800 dark:bg-dark-900 dark:text-dark-300 dark:shadow-black/20 dark:hover:border-dark-700 dark:hover:bg-dark-800 dark:hover:text-dark-100"
	                        }`}
	                      >
	                        <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-full ${
	                          active ? "bg-white/15 text-current dark:bg-dark-950/10" : "bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300"
	                        }`}>
	                          {item.icon}
	                        </span>
	                        <span className="block text-sm font-bold">{item.label}</span>
	                        <span className="mt-1 block text-xs leading-5 opacity-70">{item.description}</span>
	                      </button>
	                    );
	                  })}
	                </div>
	
	                <div className="mt-3 grid gap-3 md:grid-cols-3">
	                  {fontScaleOptions.map((item) => {
	                    const active = preference.fontScale === item.value;
	                    return (
	                      <button
	                        key={item.value}
	                        type="button"
	                        onClick={() => handleFontScaleChange(item.value)}
	                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 text-left shadow-sm transition-colors ${
	                          active
	                            ? "border-gray-900 bg-gray-950 text-white shadow-gray-200 dark:border-dark-100 dark:bg-dark-100 dark:text-dark-950 dark:shadow-black/20"
	                            : "border-gray-200 bg-white text-gray-500 shadow-gray-100 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 dark:border-dark-800 dark:bg-dark-900 dark:text-dark-300 dark:shadow-black/20 dark:hover:border-dark-700 dark:hover:bg-dark-800 dark:hover:text-dark-100"
	                        }`}
	                      >
	                        <Type size={16} />
	                        <span>
	                          <span className="block text-sm font-bold">{item.label}</span>
	                          <span className="mt-1 block text-xs opacity-70">{item.description}</span>
	                        </span>
	                      </button>
	                    );
	                  })}
	                </div>
	
	                <div className="mt-3">
	                  <PreferenceToggle
	                    title="애니메이션 줄이기"
	                    description="움직임이 많은 전환 효과를 줄이는 설정입니다."
	                    checked={preference.reduceMotion}
	                    onChange={(checked) => {
	                      setPreference((prev) => ({ ...prev, reduceMotion: checked }));
	                      document.documentElement.dataset.motion = checked ? "reduced" : "default";
	                    }}
	                  />
	                </div>
	              </div>
	
	              <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100 dark:border-dark-800 dark:bg-dark-900 dark:shadow-black/20">
	                <div className="mb-4 flex items-start gap-3">
	                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300">
	                    <Bell size={17} />
	                  </div>
	                  <div>
	                    <div className="text-sm font-black text-gray-950 dark:text-dark-100">알림 수신</div>
	                    <p className="mt-1 text-xs leading-5 text-gray-400 dark:text-dark-400">
	                      내 활동 흐름에 맞춰 받을 알림을 줄입니다.
	                    </p>
	                  </div>
	                </div>
	
	                <div className="grid gap-3">
	                  <PreferenceToggle title="댓글 알림" description="내 글에 새 댓글이 달릴 때 알림을 받습니다." checked={preference.notifyComments} onChange={(checked) => setPreference((prev) => ({ ...prev, notifyComments: checked }))} />
	                  <PreferenceToggle title="답글 알림" description="내 댓글에 답글이 달릴 때 알림을 받습니다." checked={preference.notifyReplies} onChange={(checked) => setPreference((prev) => ({ ...prev, notifyReplies: checked }))} />
	                  <PreferenceToggle title="운영 알림" description="관리자 안내와 강제 처리 알림을 받습니다." checked={preference.notifyAdmin} onChange={(checked) => setPreference((prev) => ({ ...prev, notifyAdmin: checked }))} />
	                </div>
	              </div>
	
	              <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100 dark:border-dark-800 dark:bg-dark-900 dark:shadow-black/20">
	                <div className="mb-4 flex items-start gap-3">
	                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300">
	                    <Eye size={17} />
	                  </div>
	                  <div>
	                    <div className="text-sm font-black text-gray-950 dark:text-dark-100">프로필 표시</div>
	                    <p className="mt-1 text-xs leading-5 text-gray-400 dark:text-dark-400">
	                      작성자 영역과 에디터 사용감을 조정합니다.
	                    </p>
	                  </div>
	                </div>
	
	                <div className="grid gap-3">
	                  <PreferenceToggle title="프로필 이미지 표시" description="게시글과 댓글 작성자 옆 이미지를 표시합니다." checked={preference.showProfileImage} onChange={(checked) => setPreference((prev) => ({ ...prev, showProfileImage: checked }))} />
	                  <PreferenceToggle title="닉네임 표시" description="작성자명 영역에 닉네임을 우선 표시합니다." checked={preference.showNickname} onChange={(checked) => setPreference((prev) => ({ ...prev, showNickname: checked }))} />
	                  <PreferenceToggle title="댓글 에디터 compact" description="댓글 작성 에디터를 더 낮은 높이로 시작합니다." checked={preference.editorCompact} onChange={(checked) => setPreference((prev) => ({ ...prev, editorCompact: checked }))} />
	                </div>
	              </div>
	            </section>
	
	            <div className="sticky bottom-0 mt-6 flex items-center justify-end border-t border-gray-200 bg-white/90 py-4 backdrop-blur-xl dark:border-dark-800 dark:bg-dark-950/90">
	              <Button
	                type="button"
	                onClick={handleSubmit}
	                isLoading={isPending}
	                icon={<Check size={15} />}
	                fullWidth={false}
	              >
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

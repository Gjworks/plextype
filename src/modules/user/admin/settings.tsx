"use client";

import React, { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { AuthSettingsData } from "@/modules/user/actions/settings.type";
import { updateAuthSettingsAdminAction } from "@/modules/user/actions/settings.action";
import Button from "@components/button/Button";
import InputField from "@components/form/InputField";
import { updateUserLayoutAdminAction } from "../actions/user-layout.action";
import {
  settingsPrimaryButtonClass,
  selectClass,
  SectionShell,
  FieldRow,
  InlineField,
  Toggle,
} from "@/core/components/admin/SettingsFields";

type RegistryOption = {
  key: string;
  label: string;
  description: string;
};

const sectionMeta = {
  auth: {
    label: "회원/인증 설정",
    eyebrow: "Account",
    description: "가입, 계정 상태, 세션 정책을 관리합니다.",
  },
};

const UploadTogglePolicy = ({
  title,
  description,
  name,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-gray-100 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-6 text-gray-400">
          {description}
        </div>
      </div>
      <Toggle name={name} checked={checked} onChange={onChange} />
    </div>
  );
};

const defaultUserLayoutOptions: RegistryOption[] = [
  {
    key: "default",
    label: "기본 사용자",
    description: "Plextype 배포판에 포함되는 기본 사용자 화면입니다.",
  },
];

const defaultAuthSettings: AuthSettingsData = {
  registrationEnabled: true,
  accountDeletionEnabled: true,
  defaultUserStatus: "active",
  minPasswordLength: 8,
  requirePasswordNumber: false,
  requirePasswordLetter: false,
  requirePasswordSpecial: false,
  loginFailLimit: 5,
  loginFailWindowMinutes: 15,
  loginLockMinutes: 15,
  accessTokenExpiresIn: "1h",
  refreshTokenExpiresIn: "4h",
  allowConcurrentSessions: true,
  adminSessionGuard: true,
};

const Settings = ({
  initialAuthSettings = defaultAuthSettings,
  initialSiteSettings = { userLayout: "default" },
  userLayoutOptions = defaultUserLayoutOptions,
}: {
  initialAuthSettings?: AuthSettingsData;
  initialSiteSettings?: { userLayout: string };
  userLayoutOptions?: RegistryOption[];
}) => {
  const router = useRouter();

  const activeSection = "auth";

  const meta = useMemo(() => sectionMeta[activeSection], [activeSection]);

  const [isPending, startTransition] = useTransition();

  const [siteSettings, setSiteSettings] = useState<{
    userLayout: string;
  }>(initialSiteSettings);

  const [authSettings, setAuthSettings] =
    useState<AuthSettingsData>(initialAuthSettings);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(
    null,
  );

  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const minPasswordLengthRef = useRef<HTMLInputElement>(null);

  const loginFailLimitRef = useRef<HTMLInputElement>(null);

  const loginFailWindowMinutesRef = useRef<HTMLInputElement>(null);

  const loginLockMinutesRef = useRef<HTMLInputElement>(null);

  const accessTokenExpiresInRef = useRef<HTMLInputElement>(null);

  const refreshTokenExpiresInRef = useRef<HTMLInputElement>(null);

  const handleSiteSelectChange =
    (field: "userLayout") => (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSiteSettings((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleAuthInputChange =
    (field: keyof AuthSettingsData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target.type === "number" ? Number(e.target.value) : e.target.value;
      setAuthSettings((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleAuthToggleChange =
    (field: keyof AuthSettingsData) => (checked: boolean) => {
      setAuthSettings((prev) => ({
        ...prev,
        [field]: checked,
      }));
    };

  const resetAuthSettings = () => {
    setFieldErrors(null);
    setFormMessage(null);
    setAuthSettings(initialAuthSettings);
    setSiteSettings((prev) => ({
      ...prev,
      userLayout: initialSiteSettings.userLayout,
    }));
  };

  const handleAuthSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors(null);
    setFormMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const siteResult = await updateUserLayoutAdminAction(
        siteSettings.userLayout,
      );
      if (!siteResult.success) {
        if (siteResult.fieldErrors) {
          setFieldErrors(siteResult.fieldErrors);
        } else {
          setFormMessage({ type: "error", message: siteResult.message });
        }
        return;
      }
      const result = await updateAuthSettingsAdminAction(formData);
      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          if (result.fieldErrors.minPasswordLength)
            minPasswordLengthRef.current?.focus();
          else if (result.fieldErrors.loginFailLimit)
            loginFailLimitRef.current?.focus();
          else if (result.fieldErrors.loginFailWindowMinutes)
            loginFailWindowMinutesRef.current?.focus();
          else if (result.fieldErrors.loginLockMinutes)
            loginLockMinutesRef.current?.focus();
          else if (result.fieldErrors.accessTokenExpiresIn)
            accessTokenExpiresInRef.current?.focus();
          else if (result.fieldErrors.refreshTokenExpiresIn)
            refreshTokenExpiresInRef.current?.focus();
        } else {
          setFormMessage({ type: "error", message: result.message });
        }
        return;
      }
      if (result.data) setAuthSettings(result.data);
      setFormMessage({ type: "success", message: result.message });
      router.refresh();
    });
  };

  const handleSubmit = handleAuthSubmit;

  const handleReset = resetAuthSettings;

  return (
    <form
      className="max-w-screen-2xl mx-auto px-3 py-10 dark:text-dark-100"
      onSubmit={handleSubmit}
    >
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
            System Control / {meta.eyebrow}
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-700 dark:text-dark-100">
            {meta.label}
          </div>
          <div className="mt-1 text-sm text-gray-400">{meta.description}</div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={!handleReset || isPending}
            onClick={handleReset}
            className="border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 hover:ring-4 hover:ring-gray-100/70 disabled:bg-white disabled:text-gray-300 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-100 dark:hover:ring-dark-800/35 dark:disabled:bg-dark-900 dark:disabled:text-dark-600"
          >
            초기화
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={!handleSubmit}
            className={settingsPrimaryButtonClass}
          >
            저장하기
          </Button>
        </div>
      </div>

      {formMessage && (
        <div
          className={`mb-6 rounded-md px-3 py-2 text-sm leading-6 ${formMessage.type === "success" ? "bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-300" : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300"}`}
        >
          {formMessage.message}
        </div>
      )}

      {false}

      {false}

      {
        <>
          <SectionShell
            icon={<UserRound size={13} />}
            title="user 모듈 스킨 설정"
            description="/user 마이페이지 영역에서 사용할 user 모듈 스킨을 선택합니다."
          >
            <InlineField
              title="user 모듈 스킨"
              description="저장 후 /user 화면을 새로고침하면 선택한 user 모듈 스킨이 적용됩니다."
              settingKey="site.userLayout"
            >
              <select
                name="userLayout"
                value={siteSettings.userLayout}
                onChange={handleSiteSelectChange("userLayout")}
                className={selectClass}
              >
                {userLayoutOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs leading-5 text-gray-400">
                {userLayoutOptions.find(
                  (option) => option.key === siteSettings.userLayout,
                )?.description || "등록된 user 모듈 스킨입니다."}
              </div>
              {fieldErrors?.userLayout && (
                <div className="mt-2 text-xs text-red-500">
                  {fieldErrors.userLayout}
                </div>
              )}
            </InlineField>
          </SectionShell>

          <SectionShell
            icon={<UserRound size={13} />}
            title="회원가입"
            description="신규 회원이 들어오는 방식과 가입 직후 사용할 계정 상태를 정합니다."
          >
            <FieldRow
              label="회원가입 허용"
              description="꺼두면 회원가입 페이지 접근과 공개 회원가입 API 요청이 모두 차단됩니다. 관리자가 관리자 화면에서 직접 회원을 추가하는 기능은 유지됩니다."
            >
              <Toggle
                name="registrationEnabled"
                checked={authSettings.registrationEnabled}
                onChange={handleAuthToggleChange("registrationEnabled")}
              />
            </FieldRow>
            <FieldRow
              label="탈퇴 허용"
              description="꺼두면 사용자가 내 계정에서 직접 회원탈퇴를 진행할 수 없습니다. 관리자 삭제 권한에는 영향을 주지 않습니다."
            >
              <Toggle
                name="accountDeletionEnabled"
                checked={authSettings.accountDeletionEnabled}
                onChange={handleAuthToggleChange("accountDeletionEnabled")}
              />
            </FieldRow>
            <FieldRow
              label="가입 후 상태"
              description="신규 가입 계정에 자동으로 부여할 상태입니다. 승인 대기나 차단 상태인 일반 회원은 로그인할 수 없고, 관리자는 예외로 로그인할 수 있습니다."
            >
              <select
                className={selectClass}
                name="defaultUserStatus"
                value={authSettings.defaultUserStatus}
                onChange={handleAuthInputChange("defaultUserStatus")}
              >
                <option value="active">즉시 활성화</option>
                <option value="pending">승인 대기</option>
                <option value="blocked">차단 상태</option>
              </select>
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<ShieldCheck size={13} />}
            title="비밀번호 정책"
            description="회원가입, 관리자 회원 등록/수정, 내 비밀번호 변경에 공통으로 적용됩니다."
          >
            <FieldRow
              label="최소 길이"
              description="비밀번호가 가져야 하는 최소 글자 수입니다. 너무 낮으면 계정 탈취 위험이 커지고, 너무 높으면 가입 전환이 떨어질 수 있습니다. 기본값은 8자입니다."
            >
              <InputField
                ref={minPasswordLengthRef}
                inputTitle="비밀번호 최소 길이"
                name="minPasswordLength"
                type="number"
                value={authSettings.minPasswordLength}
                onChange={handleAuthInputChange("minPasswordLength")}
                error={fieldErrors?.minPasswordLength}
                placeholder="8"
                hideLabel
              />
            </FieldRow>
            <FieldRow
              label="필수 문자"
              description="비밀번호에 반드시 포함해야 하는 문자 종류입니다. 여러 항목을 켜면 모든 조건을 동시에 만족해야 저장됩니다."
            >
              <div className="grid gap-3 md:grid-cols-3">
                <UploadTogglePolicy
                  title="영문 포함"
                  description="켜두면 a-z 또는 A-Z 문자가 최소 1개 이상 필요합니다."
                  name="requirePasswordLetter"
                  checked={authSettings.requirePasswordLetter}
                  onChange={handleAuthToggleChange("requirePasswordLetter")}
                />
                <UploadTogglePolicy
                  title="숫자 포함"
                  description="켜두면 0-9 숫자가 최소 1개 이상 필요합니다."
                  name="requirePasswordNumber"
                  checked={authSettings.requirePasswordNumber}
                  onChange={handleAuthToggleChange("requirePasswordNumber")}
                />
                <UploadTogglePolicy
                  title="특수문자 포함"
                  description="켜두면 !, @, # 같은 특수문자가 최소 1개 이상 필요합니다."
                  name="requirePasswordSpecial"
                  checked={authSettings.requirePasswordSpecial}
                  onChange={handleAuthToggleChange("requirePasswordSpecial")}
                />
              </div>
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<LockKeyhole size={13} />}
            title="인증 정책"
            description="로그인 유지 시간, 토큰 갱신, 반복 로그인 실패 시 잠금 기준을 정합니다."
          >
            <FieldRow
              label="토큰 유지 시간"
              description="Access Token은 짧게, Refresh Token은 상대적으로 길게 두는 값입니다. 15m, 1h, 7d처럼 숫자와 단위 s/m/h/d 조합으로 입력합니다."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  ref={accessTokenExpiresInRef}
                  inputTitle="Access Token"
                  name="accessTokenExpiresIn"
                  value={authSettings.accessTokenExpiresIn}
                  onChange={handleAuthInputChange("accessTokenExpiresIn")}
                  error={fieldErrors?.accessTokenExpiresIn}
                  placeholder="1h"
                  hideLabel
                />
                <InputField
                  ref={refreshTokenExpiresInRef}
                  inputTitle="Refresh Token"
                  name="refreshTokenExpiresIn"
                  value={authSettings.refreshTokenExpiresIn}
                  onChange={handleAuthInputChange("refreshTokenExpiresIn")}
                  error={fieldErrors?.refreshTokenExpiresIn}
                  placeholder="4h"
                  hideLabel
                />
              </div>
            </FieldRow>
            <FieldRow
              label="로그인 실패 제한"
              description="같은 계정과 IP 조합에서 로그인 실패가 반복될 때 잠금 처리합니다. 예: 15분 동안 5회 실패하면 15분간 로그인을 막습니다."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-3 min-h-[52px]">
                    <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                      실패 허용 횟수
                    </div>
                    <div className="mt-1 text-xs leading-5 text-gray-400">
                      잠금 처리 전까지 허용할 로그인 실패 횟수입니다.
                    </div>
                  </div>
                  <InputField
                    ref={loginFailLimitRef}
                    inputTitle="실패 허용 횟수"
                    name="loginFailLimit"
                    type="number"
                    value={authSettings.loginFailLimit}
                    onChange={handleAuthInputChange("loginFailLimit")}
                    error={fieldErrors?.loginFailLimit}
                    placeholder="5"
                    hideLabel
                  />
                </div>
                <div>
                  <div className="mb-3 min-h-[52px]">
                    <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                      실패 카운트 유지
                    </div>
                    <div className="mt-1 text-xs leading-5 text-gray-400">
                      실패 기록을 몇 분 동안 누적해서 볼지 정합니다.
                    </div>
                  </div>
                  <InputField
                    ref={loginFailWindowMinutesRef}
                    inputTitle="실패 카운트 유지(분)"
                    name="loginFailWindowMinutes"
                    type="number"
                    value={authSettings.loginFailWindowMinutes}
                    onChange={handleAuthInputChange("loginFailWindowMinutes")}
                    error={fieldErrors?.loginFailWindowMinutes}
                    placeholder="15"
                    hideLabel
                  />
                </div>
                <div>
                  <div className="mb-3 min-h-[52px]">
                    <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                      잠금 시간
                    </div>
                    <div className="mt-1 text-xs leading-5 text-gray-400">
                      제한에 걸린 계정과 IP 조합을 몇 분 동안 막을지 정합니다.
                    </div>
                  </div>
                  <InputField
                    ref={loginLockMinutesRef}
                    inputTitle="잠금 시간(분)"
                    name="loginLockMinutes"
                    type="number"
                    value={authSettings.loginLockMinutes}
                    onChange={handleAuthInputChange("loginLockMinutes")}
                    error={fieldErrors?.loginLockMinutes}
                    placeholder="15"
                    hideLabel
                  />
                </div>
              </div>
            </FieldRow>
            <FieldRow
              label="세션 정책"
              description="여러 기기 로그인 허용 여부와 관리자 페이지에서 세션을 계속 확인할지 정합니다. 보안을 우선하면 둘 다 켜두는 편이 좋습니다."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <UploadTogglePolicy
                  title="동시 로그인 허용"
                  description="켜두면 여러 브라우저와 기기에서 동시에 로그인할 수 있습니다. 꺼두면 새 로그인 시 기존 접속 세션을 정리합니다."
                  name="allowConcurrentSessions"
                  checked={authSettings.allowConcurrentSessions}
                  onChange={handleAuthToggleChange("allowConcurrentSessions")}
                />
                <UploadTogglePolicy
                  title="관리자 세션 검문"
                  description="켜두면 관리자 페이지가 포커스되거나 일정 시간이 지날 때 관리자 권한을 다시 확인합니다. 토큰 만료 후 오래 머무르는 상황을 줄입니다."
                  name="adminSessionGuard"
                  checked={authSettings.adminSessionGuard}
                  onChange={handleAuthToggleChange("adminSessionGuard")}
                />
              </div>
            </FieldRow>
          </SectionShell>
        </>
      }

      {false}

      {false}

      {false}
    </form>
  );
};
export default Settings;

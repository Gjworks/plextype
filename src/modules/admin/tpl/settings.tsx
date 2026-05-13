"use client";

import React, { useMemo, useState } from "react";
import {
  Bell,
  Globe2,
  Image,
  LockKeyhole,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

import Button from "@components/button/Button";
import InputField from "@components/form/InputField";

type SettingsSection = "site" | "seo" | "auth" | "upload" | "notification";

type SettingsProps = {
  section?: SettingsSection;
};

const sectionMeta: Record<SettingsSection, {
  label: string;
  eyebrow: string;
  description: string;
}> = {
  site: {
    label: "사이트 기본정보",
    eyebrow: "General",
    description: "서비스 이름, 대표 이미지, 기본 언어를 정리합니다.",
  },
  seo: {
    label: "SEO 기본설정",
    eyebrow: "Discovery",
    description: "검색 노출과 공유 메타 정보의 기본값입니다.",
  },
  auth: {
    label: "회원/인증 설정",
    eyebrow: "Account",
    description: "가입, 계정 상태, 세션 정책을 관리합니다.",
  },
  upload: {
    label: "업로드 설정",
    eyebrow: "Storage",
    description: "첨부파일 용량, 확장자, 검증 기준을 관리합니다.",
  },
  notification: {
    label: "알림 설정",
    eyebrow: "Signal",
    description: "댓글, 답글, 실시간 알림의 기본 정책입니다.",
  },
};

const selectClass =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-gray-400 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-100";

const textareaClass =
  "w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm leading-6 text-gray-700 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-400 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-100 dark:placeholder:text-dark-500";

const SectionShell = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => {
  return (
    <section className="grid grid-cols-4 gap-8 border-t border-gray-200 py-10 first:border-t-0 dark:border-dark-800">
      <div className="col-span-4 lg:col-span-1">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
          {icon}
          Settings
        </div>
        <div className="mt-3 text-lg font-semibold text-gray-600 dark:text-dark-100">{title}</div>
        {description && <div className="mt-2 text-sm leading-6 text-gray-400">{description}</div>}
      </div>
      <div className="col-span-4 lg:col-span-3">
        <div className="grid gap-2">{children}</div>
      </div>
    </section>
  );
};

const FieldRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-md p-5 transition-colors hover:bg-gray-50 dark:hover:bg-dark-900">
      <div className="mb-4">
        <div className="text-sm font-medium text-black dark:text-dark-100">{label}</div>
        {description && <div className="mt-1 text-xs leading-5 text-gray-400">{description}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

const Toggle = ({ defaultChecked = false }: { defaultChecked?: boolean }) => {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      type="button"
      onClick={() => setChecked((prev) => !prev)}
      className="relative block h-6 w-11 cursor-pointer rounded-full bg-gray-200 transition-colors data-[checked=true]:bg-cyan-500"
      data-checked={checked}
      aria-pressed={checked}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

const Settings = ({ section = "site" }: SettingsProps) => {
  const activeSection = sectionMeta[section] ? section : "site";
  const meta = useMemo(() => sectionMeta[activeSection], [activeSection]);

  return (
    <div className="max-w-screen-2xl mx-auto px-3 py-10">
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">System Control / {meta.eyebrow}</div>
          <div className="mt-2 text-lg font-semibold text-gray-700">{meta.label}</div>
          <div className="mt-1 text-sm text-gray-400">{meta.description}</div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button type="button" disabled className="border border-gray-200 bg-white text-gray-400 hover:bg-white hover:text-gray-400">
            초기화
          </Button>
          <Button type="button" disabled className="!bg-blue-100 !text-blue-400 hover:!bg-blue-100 hover:!text-blue-400">
            저장하기
          </Button>
        </div>
      </div>

      {activeSection === "site" && (
        <>
          <SectionShell icon={<Globe2 size={13} />} title="브랜드 정보" description="사이트가 외부에 표시되는 기본 정보입니다.">
            <FieldRow label="사이트 이름" description="영문 시스템 이름과 한글 표시명을 분리합니다.">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField inputTitle="APP_NAME" name="appName" placeholder="APP_NAME  Gjworks" hideLabel />
                <InputField inputTitle="APP_TITLE" name="appTitle" placeholder="APP_TITLE  지제이웍스" hideLabel />
              </div>
            </FieldRow>
            <FieldRow label="사이트 설명" description="검색 결과와 공유 화면에서 기본 설명으로 사용할 수 있습니다.">
              <textarea className={textareaClass} name="siteDescription" rows={4} placeholder="사이트를 대표하는 짧은 설명" />
            </FieldRow>
          </SectionShell>

          <SectionShell icon={<Image size={13} />} title="대표 이미지" description="로고, 파비콘, 공유 이미지를 지정합니다.">
            <FieldRow label="이미지 경로" description="업로드 선택 기능은 추후 연결합니다.">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField inputTitle="로고 이미지" name="logoPath" placeholder="로고 이미지 경로" hideLabel />
                <InputField inputTitle="파비콘" name="faviconPath" placeholder="파비콘 경로" hideLabel />
                <InputField inputTitle="기본 OG 이미지" name="defaultOgImage" placeholder="기본 OG 이미지 경로" hideLabel />
              </div>
            </FieldRow>
            <FieldRow label="기본 언어">
              <select className={selectClass} name="defaultLocale" defaultValue="ko">
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </FieldRow>
          </SectionShell>
        </>
      )}

      {activeSection === "seo" && (
        <>
          <SectionShell icon={<Search size={13} />} title="검색 노출" description="문서별 SEO 값이 없을 때 사용할 기본값입니다.">
            <FieldRow label="타이틀 규칙">
              <InputField inputTitle="타이틀 접미사" name="titleSuffix" placeholder="| Gjworks" hideLabel />
            </FieldRow>
            <FieldRow label="기본 메타 설명">
              <InputField inputTitle="Meta Description" name="metaDescription" placeholder="검색 결과에 노출될 기본 설명" hideLabel />
            </FieldRow>
            <FieldRow label="Robots" description="검색엔진 색인과 링크 추적 기본 정책입니다.">
              <div className="grid gap-4 md:grid-cols-2">
                <select className={selectClass} name="robotsIndex" defaultValue="index">
                  <option value="index">색인 허용</option>
                  <option value="noindex">색인 차단</option>
                </select>
                <select className={selectClass} name="robotsFollow" defaultValue="follow">
                  <option value="follow">링크 추적 허용</option>
                  <option value="nofollow">링크 추적 차단</option>
                </select>
              </div>
            </FieldRow>
          </SectionShell>

          <SectionShell icon={<Globe2 size={13} />} title="사이트맵" description="검색엔진에 전달할 URL 범위입니다.">
            <FieldRow label="사이트맵 사용">
              <Toggle defaultChecked />
            </FieldRow>
            <FieldRow label="게시글 사이트맵 포함">
              <Toggle defaultChecked />
            </FieldRow>
          </SectionShell>
        </>
      )}

      {activeSection === "auth" && (
        <>
          <SectionShell icon={<UserRound size={13} />} title="회원가입" description="회원 가입과 계정 상태 기본값입니다.">
            <FieldRow label="회원가입 허용">
              <Toggle defaultChecked />
            </FieldRow>
            <FieldRow label="탈퇴 허용">
              <Toggle defaultChecked />
            </FieldRow>
            <FieldRow label="가입 후 상태">
              <select className={selectClass} name="defaultUserStatus" defaultValue="active">
                <option value="active">즉시 활성화</option>
                <option value="pending">승인 대기</option>
                <option value="blocked">차단 상태</option>
              </select>
            </FieldRow>
          </SectionShell>

          <SectionShell icon={<LockKeyhole size={13} />} title="인증 정책" description="세션 유지와 로그인 실패 제한 기준입니다.">
            <FieldRow label="토큰 유지 시간">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField inputTitle="Access Token" name="accessTokenExpiresIn" placeholder="Access Token  1h" hideLabel />
                <InputField inputTitle="Refresh Token" name="refreshTokenExpiresIn" placeholder="Refresh Token  4h" hideLabel />
              </div>
            </FieldRow>
            <FieldRow label="로그인 실패 제한">
              <InputField inputTitle="실패 허용 횟수" name="loginFailLimit" type="number" placeholder="5" hideLabel />
            </FieldRow>
            <FieldRow label="관리자 세션 검문">
              <Toggle defaultChecked />
            </FieldRow>
          </SectionShell>
        </>
      )}

      {activeSection === "upload" && (
        <>
          <SectionShell icon={<Upload size={13} />} title="파일 제한" description="업로드 가능한 파일의 크기와 범위입니다.">
            <FieldRow label="용량 제한">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField inputTitle="파일당 MB" name="maxUploadSizeMb" type="number" placeholder="파일당 MB" hideLabel />
                <InputField inputTitle="사용자별 MB" name="userStorageLimitMb" type="number" placeholder="사용자별 MB" hideLabel />
                <InputField inputTitle="이미지 최대 너비" name="maxImageWidth" type="number" placeholder="이미지 최대 너비" hideLabel />
              </div>
            </FieldRow>
            <FieldRow label="허용 확장자" description="쉼표로 구분된 확장자 목록입니다.">
              <textarea className={textareaClass} name="allowedExtensions" rows={3} placeholder=".png, .jpg, .jpeg, .gif, .webp, .mp4, .zip" />
            </FieldRow>
          </SectionShell>

          <SectionShell icon={<ShieldCheck size={13} />} title="검증 정책" description="파일 업로드 시 적용할 보안 검증입니다.">
            <FieldRow label="MIME 타입 검증">
              <Toggle defaultChecked />
            </FieldRow>
            <FieldRow label="프로필 이미지 제한">
              <Toggle defaultChecked />
            </FieldRow>
            <FieldRow label="동영상/압축파일 허용">
              <div className="flex flex-wrap gap-8">
                <label className="flex items-center gap-3 text-sm text-gray-600">
                  <Toggle defaultChecked />
                  동영상
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-600">
                  <Toggle defaultChecked />
                  압축파일
                </label>
              </div>
            </FieldRow>
          </SectionShell>
        </>
      )}

      {activeSection === "notification" && (
        <>
          <SectionShell icon={<Bell size={13} />} title="댓글 알림" description="게시글과 답글 이벤트 알림 기준입니다.">
            <FieldRow label="댓글 알림">
              <Toggle defaultChecked />
            </FieldRow>
            <FieldRow label="답글 알림">
              <Toggle defaultChecked />
            </FieldRow>
            <FieldRow label="본인 액션 제외" description="내 글에 내가 작성한 댓글은 알림을 만들지 않습니다.">
              <Toggle defaultChecked />
            </FieldRow>
            <FieldRow label="실시간 알림">
              <Toggle defaultChecked />
            </FieldRow>
          </SectionShell>

          <SectionShell icon={<Bell size={13} />} title="알림 보관" description="알림 목록과 히스토리 화면의 기본값입니다.">
            <FieldRow label="보관 기간">
              <InputField inputTitle="보관 기간(일)" name="notificationRetentionDays" type="number" placeholder="90일" hideLabel />
            </FieldRow>
            <FieldRow label="노출 개수">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField inputTitle="메뉴 미리보기" name="notificationPreviewCount" type="number" placeholder="메뉴 미리보기 5" hideLabel />
                <InputField inputTitle="히스토리 페이지" name="notificationPageSize" type="number" placeholder="히스토리 페이지 20" hideLabel />
              </div>
            </FieldRow>
            <FieldRow label="썸네일 표시">
              <Toggle defaultChecked />
            </FieldRow>
          </SectionShell>
        </>
      )}
    </div>
  );
};

export default Settings;

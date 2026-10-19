"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Globe2, Image, Search, ShieldCheck, Upload } from "lucide-react";
import {
  SearchSettingsData,
  SeoSettingsData,
  SiteSettingsData,
} from "@/modules/admin/actions/_type";
import {
  updateSearchSettingsAdminAction,
  updateSeoSettingsAdminAction,
  updateSiteSettingsAdminAction,
} from "@/modules/admin/actions/settings.action";
import Button from "@components/button/Button";
import InputField from "@components/form/InputField";
import {
  settingsPrimaryButtonClass,
  selectClass,
  textareaClass,
  SectionShell,
  FieldRow,
  InlineField,
  Toggle,
} from "@/core/components/admin/SettingsFields";

type SettingsSection = "site" | "seo" | "search";

type RegistryOption = {
  key: string;
  label: string;
  description: string;
};

const sectionMeta = {
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
  search: {
    label: "통합검색 설정",
    eyebrow: "Search",
    description: "검색 대상, 민감 정보 노출, 확장 모듈 연동 정책을 관리합니다.",
  },
};

const SiteImageUploadField = ({
  title,
  description,
  recommendedSize,
  currentPath,
  pathName,
  fileName,
  variant = "wide",
}: {
  title: string;
  description: string;
  recommendedSize: string;
  currentPath?: string;
  pathName: keyof SiteSettingsData;
  fileName: string;
  variant?: "logo" | "favicon" | "wide";
}) => {
  const inputId = `site-${fileName}`;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const displayUrl = previewUrl || currentPath || "";
  const isFavicon = variant === "favicon";
  const previewWrapClass = isFavicon
    ? "mb-4 flex h-[148px] items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-950"
    : variant === "logo"
      ? "mb-4 grid h-[148px] place-items-center overflow-hidden rounded-md border border-dashed border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-950"
      : "mb-4 grid aspect-[1.91/1] min-h-[148px] place-items-center overflow-hidden rounded-md border border-dashed border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-950";
  const imageClass = isFavicon
    ? "h-16 w-16 object-contain"
    : "h-full w-full object-contain";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  return (
    <div className="flex h-full min-h-[356px] flex-col rounded-md border border-gray-100 bg-white p-4 transition-colors hover:border-gray-200 dark:border-dark-800 dark:bg-dark-900">
      <input type="hidden" name={pathName} value={currentPath || ""} />
      <div className={previewWrapClass}>
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt={title} className={imageClass} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Image size={22} strokeWidth={1.5} />
            <span className="text-xs font-medium">이미지 없음</span>
          </div>
        )}
      </div>
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-6 text-gray-400">
          {description}
        </div>
        <div className="mt-2 inline-flex rounded bg-gray-100 px-2 py-1 font-mono text-[10px] font-semibold text-gray-500 dark:bg-dark-800">
          {recommendedSize}
        </div>
        {currentPath && (
          <div className="mt-2 truncate font-mono text-[10px] text-gray-400">
            {currentPath}
          </div>
        )}
      </div>
      <label
        htmlFor={inputId}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-950 bg-gray-950 px-4 text-xs font-medium text-white ring-4 ring-gray-950/5 transition-all duration-200 hover:bg-gray-800 hover:ring-gray-950/10 dark:border-dark-100 dark:bg-dark-100 dark:text-gray-950 dark:ring-white/10 dark:hover:bg-white dark:hover:ring-white/15"
      >
        <Upload size={13} />
        파일 선택
      </label>
      <input
        id={inputId}
        name={fileName}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/avif,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico"
        onChange={handleFileChange}
        className="sr-only"
      />
    </div>
  );
};

const UploadNumberField = ({
  refObject,
  title,
  description,
  unit,
  name,
  value,
  onChange,
  error,
  placeholder,
}: {
  refObject?: React.Ref<HTMLInputElement>;
  title: string;
  description: string;
  unit: string;
  name: string;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder: string;
}) => {
  return (
    <div className="rounded-md border border-gray-100 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
      <div className="mb-3 min-h-[58px]">
        <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-6 text-gray-400">
          {description}
        </div>
      </div>
      <div className="relative">
        <InputField
          ref={refObject}
          inputTitle={title}
          name={name}
          type="number"
          value={value}
          onChange={onChange}
          error={error}
          placeholder={placeholder}
          hideLabel
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
          {unit}
        </span>
      </div>
    </div>
  );
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

const defaultSiteSettings: SiteSettingsData = {
  appName: "plextype",
  projectName: "plextype",
  projectTitle: "plextype",
  siteUrl: "http://localhost:3000",
  apiBaseUrl: "",
  logoPath: "",
  faviconPath: "",
  defaultOgImage: "",
  adminLayout: "default",
  userLayout: "default",
};

const defaultAdminLayoutOptions: RegistryOption[] = [
  {
    key: "default",
    label: "기본 관리자",
    description: "Plextype 배포판에 포함되는 기본 관리자 화면입니다.",
  },
];

const defaultSeoSettings: SeoSettingsData = {
  defaultTitle: "Plextype",
  titleTemplate: "%s | Plextype",
  metaDescription: "Plextype으로 만든 사이트입니다.",
  keywords: "",
  robotsIndex: "index",
  robotsFollow: "follow",
  twitterCard: "summary_large_image",
  sitemapEnabled: true,
  includePagesInSitemap: true,
  includePostsInSitemap: true,
};

const defaultSearchSettings: SearchSettingsData = {
  integratedSearchEnabled: true,
  documentSearchEnabled: true,
  commentSearchEnabled: true,
  attachmentSearchEnabled: true,
  userSearchEnabled: false,
  extensionSearchEnabled: true,
  includeUserEmail: false,
  defaultResultLimit: 6,
  minSearchLength: 2,
};

const Settings = ({
  section = "site",
  initialSiteSettings = defaultSiteSettings,
  initialSeoSettings = defaultSeoSettings,
  initialSearchSettings = defaultSearchSettings,
  adminLayoutOptions = defaultAdminLayoutOptions,
}: {
  section?: SettingsSection;
  initialSiteSettings?: SiteSettingsData;
  initialSeoSettings?: SeoSettingsData;
  initialSearchSettings?: SearchSettingsData;
  adminLayoutOptions?: RegistryOption[];
}) => {
  const router = useRouter();

  const activeSection = sectionMeta[section] ? section : "site";

  const meta = useMemo(() => sectionMeta[activeSection], [activeSection]);

  const [isPending, startTransition] = useTransition();

  const [siteSettings, setSiteSettings] =
    useState<SiteSettingsData>(initialSiteSettings);

  const [seoSettings, setSeoSettings] =
    useState<SeoSettingsData>(initialSeoSettings);

  const [searchSettings, setSearchSettings] = useState<SearchSettingsData>(
    initialSearchSettings,
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(
    null,
  );

  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const appNameRef = useRef<HTMLInputElement>(null);

  const projectNameRef = useRef<HTMLInputElement>(null);

  const projectTitleRef = useRef<HTMLInputElement>(null);

  const siteUrlRef = useRef<HTMLInputElement>(null);

  const apiBaseUrlRef = useRef<HTMLInputElement>(null);

  const defaultTitleRef = useRef<HTMLInputElement>(null);

  const titleTemplateRef = useRef<HTMLInputElement>(null);

  const metaDescriptionRef = useRef<HTMLTextAreaElement>(null);

  const keywordsRef = useRef<HTMLTextAreaElement>(null);

  const defaultResultLimitRef = useRef<HTMLInputElement>(null);

  const minSearchLengthRef = useRef<HTMLInputElement>(null);

  const handleSiteChange =
    (field: keyof SiteSettingsData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSiteSettings((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSiteSelectChange =
    (field: keyof SiteSettingsData) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSiteSettings((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSeoInputChange =
    (field: keyof SeoSettingsData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setSeoSettings((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSeoToggleChange =
    (field: keyof SeoSettingsData) => (checked: boolean) => {
      setSeoSettings((prev) => ({
        ...prev,
        [field]: checked,
      }));
    };

  const handleSearchInputChange =
    (field: keyof SearchSettingsData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchSettings((prev) => ({
        ...prev,
        [field]: Number(e.target.value),
      }));
    };

  const handleSearchToggleChange =
    (field: keyof SearchSettingsData) => (checked: boolean) => {
      setSearchSettings((prev) => ({
        ...prev,
        [field]: checked,
      }));
    };

  const resetSiteSettings = () => {
    setFieldErrors(null);
    setFormMessage(null);
    setSiteSettings(initialSiteSettings);
  };

  const resetSeoSettings = () => {
    setFieldErrors(null);
    setFormMessage(null);
    setSeoSettings(initialSeoSettings);
  };

  const resetSearchSettings = () => {
    setFieldErrors(null);
    setFormMessage(null);
    setSearchSettings(initialSearchSettings);
  };

  const handleSiteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors(null);
    setFormMessage(null);
    const currentAdminLayout = siteSettings.adminLayout;
    const formData = new FormData(e.currentTarget);
    const selectedAdminLayout = siteSettings.adminLayout;
    formData.set("adminLayout", selectedAdminLayout);
    formData.set("userLayout", siteSettings.userLayout);
    startTransition(async () => {
      const result = await updateSiteSettingsAdminAction(formData);
      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          if (result.fieldErrors.appName) appNameRef.current?.focus();
          else if (result.fieldErrors.projectName)
            projectNameRef.current?.focus();
          else if (result.fieldErrors.projectTitle)
            projectTitleRef.current?.focus();
          else if (result.fieldErrors.siteUrl) siteUrlRef.current?.focus();
          else if (result.fieldErrors.apiBaseUrl)
            apiBaseUrlRef.current?.focus();
        } else {
          setFormMessage({ type: "error", message: result.message });
        }
        return;
      }
      if (result.data) setSiteSettings(result.data);
      setFormMessage({ type: "success", message: result.message });
      if (selectedAdminLayout !== currentAdminLayout) {
        window.location.assign("/admin");
        return;
      }
      router.refresh();
    });
  };

  const handleSeoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors(null);
    setFormMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSeoSettingsAdminAction(formData);
      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          if (result.fieldErrors.defaultTitle) defaultTitleRef.current?.focus();
          else if (result.fieldErrors.titleTemplate)
            titleTemplateRef.current?.focus();
          else if (result.fieldErrors.metaDescription)
            metaDescriptionRef.current?.focus();
          else if (result.fieldErrors.keywords) keywordsRef.current?.focus();
        } else {
          setFormMessage({ type: "error", message: result.message });
        }
        return;
      }
      if (result.data) setSeoSettings(result.data);
      setFormMessage({ type: "success", message: result.message });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors(null);
    setFormMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSearchSettingsAdminAction(formData);
      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          if (result.fieldErrors.defaultResultLimit)
            defaultResultLimitRef.current?.focus();
          else if (result.fieldErrors.minSearchLength)
            minSearchLengthRef.current?.focus();
        } else {
          setFormMessage({ type: "error", message: result.message });
        }
        return;
      }
      if (result.data) setSearchSettings(result.data);
      setFormMessage({ type: "success", message: result.message });
    });
  };

  const handleSubmit =
    activeSection === "site"
      ? handleSiteSubmit
      : activeSection === "seo"
        ? handleSeoSubmit
        : activeSection === "search"
          ? handleSearchSubmit
          : undefined;

  const handleReset =
    activeSection === "site"
      ? resetSiteSettings
      : activeSection === "seo"
        ? resetSeoSettings
        : activeSection === "search"
          ? resetSearchSettings
          : undefined;

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

      {activeSection === "site" && (
        <>
          <SectionShell
            icon={<Globe2 size={13} />}
            title="브랜드 정보"
            description="사이트가 외부에 표시되는 기본 정보입니다."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InlineField
                title="사이트 이름(영문)"
                description="관리자와 시스템 화면에서 사용하는 영문 이름입니다."
                settingKey="APP_NAME"
              >
                <InputField
                  ref={appNameRef}
                  inputTitle="APP_NAME"
                  name="appName"
                  value={siteSettings.appName}
                  onChange={handleSiteChange("appName")}
                  error={fieldErrors?.appName}
                  placeholder="Gjworks"
                  hideLabel
                />
              </InlineField>
              <InlineField
                title="사이트 이름(한글)"
                description="사용자에게 보여줄 한글 사이트 이름입니다."
                settingKey="PROJECT_TITLE"
              >
                <InputField
                  ref={projectTitleRef}
                  inputTitle="PROJECT_TITLE"
                  name="projectTitle"
                  value={siteSettings.projectTitle}
                  onChange={handleSiteChange("projectTitle")}
                  error={fieldErrors?.projectTitle}
                  placeholder="지제이웍스"
                  hideLabel
                />
              </InlineField>
            </div>
            <InlineField
              title="프로젝트 이름"
              description="내부 식별과 시스템 표시에 사용할 이름입니다."
              settingKey="PROJECT_NAME"
            >
              <InputField
                ref={projectNameRef}
                inputTitle="PROJECT_NAME"
                name="projectName"
                value={siteSettings.projectName}
                onChange={handleSiteChange("projectName")}
                error={fieldErrors?.projectName}
                placeholder="gjworks"
                hideLabel
              />
            </InlineField>
            <div className="grid gap-4 md:grid-cols-2">
              <InlineField
                title="사이트 대표 URL"
                description="외부에서 접근하는 대표 주소입니다."
                settingKey="NEXT_PUBLIC_DEFAULT_URL"
              >
                <InputField
                  ref={siteUrlRef}
                  inputTitle="NEXT_PUBLIC_DEFAULT_URL"
                  name="siteUrl"
                  value={siteSettings.siteUrl}
                  onChange={handleSiteChange("siteUrl")}
                  error={fieldErrors?.siteUrl}
                  placeholder="https://gjworks.dev"
                  hideLabel
                />
              </InlineField>
              <InlineField
                title="API 기본 URL"
                description="클라이언트나 외부 연동에서 사용할 API 주소입니다."
                settingKey="NEXT_PUBLIC_API_BASE_URL"
              >
                <InputField
                  ref={apiBaseUrlRef}
                  inputTitle="NEXT_PUBLIC_API_BASE_URL"
                  name="apiBaseUrl"
                  value={siteSettings.apiBaseUrl || ""}
                  onChange={handleSiteChange("apiBaseUrl")}
                  error={fieldErrors?.apiBaseUrl}
                  placeholder="http://host.docker.internal:3000"
                  hideLabel
                />
              </InlineField>
            </div>
          </SectionShell>

          <SectionShell
            icon={<Image size={13} />}
            title="대표 이미지"
            description="로고, 파비콘, 공유 이미지를 업로드합니다."
          >
            <FieldRow
              label="이미지 업로드"
              description="저장 시 파일이 업로드되고 사이트 설정에는 이미지 경로가 자동으로 기록됩니다."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <SiteImageUploadField
                  title="로고 이미지"
                  description="헤더와 브랜드 영역에서 사용할 기본 로고입니다."
                  recommendedSize="권장 320x120px · PNG/WebP"
                  currentPath={siteSettings.logoPath}
                  pathName="logoPath"
                  fileName="logoFile"
                  variant="logo"
                />
                <SiteImageUploadField
                  title="파비콘"
                  description="브라우저 탭과 북마크에 표시할 아이콘입니다."
                  recommendedSize="권장 32x32px 또는 180x180px · ICO/PNG"
                  currentPath={siteSettings.faviconPath}
                  pathName="faviconPath"
                  fileName="faviconFile"
                  variant="favicon"
                />
                <SiteImageUploadField
                  title="기본 OG 이미지"
                  description="공유 이미지가 없을 때 사용할 대표 이미지입니다."
                  recommendedSize="권장 1200x630px · JPG/PNG/WebP"
                  currentPath={siteSettings.defaultOgImage}
                  pathName="defaultOgImage"
                  fileName="defaultOgImageFile"
                  variant="wide"
                />
              </div>
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<ShieldCheck size={13} />}
            title="관리자 화면"
            description="관리자 페이지에서 사용할 레이아웃 스킨을 선택합니다."
          >
            <InlineField
              title="관리자 레이아웃"
              description="저장 후 관리자 페이지를 새로고침하면 선택한 레이아웃이 적용됩니다."
              settingKey="site.adminLayout"
            >
              <select
                name="adminLayout"
                value={siteSettings.adminLayout}
                onChange={handleSiteSelectChange("adminLayout")}
                className={selectClass}
              >
                {adminLayoutOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs leading-5 text-gray-400">
                {adminLayoutOptions.find(
                  (option) => option.key === siteSettings.adminLayout,
                )?.description || "등록된 관리자 레이아웃입니다."}
              </div>
              {fieldErrors?.adminLayout && (
                <div className="mt-2 text-xs text-red-500">
                  {fieldErrors.adminLayout}
                </div>
              )}
            </InlineField>
          </SectionShell>
        </>
      )}

      {activeSection === "seo" && (
        <>
          <SectionShell
            icon={<Search size={13} />}
            title="검색 노출"
            description="문서별 SEO 값이 없을 때 사용할 기본값입니다."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InlineField
                title="기본 메타 제목"
                description="페이지 제목이 명확하지 않을 때 사용할 사이트 대표 제목입니다."
                settingKey="seo.defaultTitle"
              >
                <InputField
                  ref={defaultTitleRef}
                  inputTitle="기본 메타 제목"
                  name="defaultTitle"
                  value={seoSettings.defaultTitle}
                  onChange={handleSeoInputChange("defaultTitle")}
                  error={fieldErrors?.defaultTitle}
                  placeholder="지제이웍스"
                  hideLabel
                />
              </InlineField>
              <InlineField
                title="타이틀 규칙"
                description="%s 자리에 각 페이지 제목이 들어갑니다. 예: %s | 지제이웍스"
                settingKey="seo.titleTemplate"
              >
                <InputField
                  ref={titleTemplateRef}
                  inputTitle="타이틀 규칙"
                  name="titleTemplate"
                  value={seoSettings.titleTemplate}
                  onChange={handleSeoInputChange("titleTemplate")}
                  error={fieldErrors?.titleTemplate}
                  placeholder="%s | 지제이웍스"
                  hideLabel
                />
              </InlineField>
            </div>
            <FieldRow
              label="기본 메타 설명"
              description="게시글이나 페이지가 별도 설명을 제공하지 않을 때 검색 결과와 공유 미리보기에서 사용합니다."
            >
              <textarea
                ref={metaDescriptionRef}
                className={textareaClass}
                name="metaDescription"
                rows={4}
                value={seoSettings.metaDescription}
                onChange={handleSeoInputChange("metaDescription")}
                placeholder="검색 결과에 노출될 기본 설명"
              />
              {fieldErrors?.metaDescription && (
                <div className="mt-1.5 text-xs leading-5 text-red-500">
                  {fieldErrors.metaDescription}
                </div>
              )}
            </FieldRow>
            <FieldRow
              label="기본 키워드"
              description="쉼표로 구분해서 입력합니다. 최신 검색엔진 영향은 작지만 내부 검색/확장 기능에서 활용할 수 있습니다."
            >
              <textarea
                ref={keywordsRef}
                className={textareaClass}
                name="keywords"
                rows={3}
                value={seoSettings.keywords || ""}
                onChange={handleSeoInputChange("keywords")}
                placeholder="plextype, gjworks, xeant"
              />
              {fieldErrors?.keywords && (
                <div className="mt-1.5 text-xs leading-5 text-red-500">
                  {fieldErrors.keywords}
                </div>
              )}
            </FieldRow>
            <FieldRow
              label="Robots"
              description="검색엔진 색인과 링크 추적 기본 정책입니다."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  className={selectClass}
                  name="robotsIndex"
                  value={seoSettings.robotsIndex}
                  onChange={handleSeoInputChange("robotsIndex")}
                >
                  <option value="index">색인 허용</option>
                  <option value="noindex">색인 차단</option>
                </select>
                <select
                  className={selectClass}
                  name="robotsFollow"
                  value={seoSettings.robotsFollow}
                  onChange={handleSeoInputChange("robotsFollow")}
                >
                  <option value="follow">링크 추적 허용</option>
                  <option value="nofollow">링크 추적 차단</option>
                </select>
              </div>
            </FieldRow>
            <FieldRow
              label="소셜 카드"
              description="X/Twitter 등에서 링크를 공유할 때 사용할 카드 형태입니다. 대표 이미지가 있다면 큰 이미지 카드가 더 잘 보입니다."
            >
              <select
                className={selectClass}
                name="twitterCard"
                value={seoSettings.twitterCard}
                onChange={handleSeoInputChange("twitterCard")}
              >
                <option value="summary_large_image">큰 이미지 카드</option>
                <option value="summary">요약 카드</option>
              </select>
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<Globe2 size={13} />}
            title="사이트맵"
            description="검색엔진에 전달할 URL 범위입니다."
          >
            <FieldRow
              label="사이트맵 정책"
              description="공개 메뉴와 공개 게시글을 sitemap.xml에 포함할지 정합니다. 비밀글과 외부 링크는 제외됩니다."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <UploadTogglePolicy
                  title="사이트맵 사용"
                  description="끄면 sitemap.xml은 빈 목록에 가까운 기본 응답만 반환합니다."
                  name="sitemapEnabled"
                  checked={seoSettings.sitemapEnabled}
                  onChange={handleSeoToggleChange("sitemapEnabled")}
                />
                <UploadTogglePolicy
                  title="페이지 포함"
                  description="사이트맵 메뉴에 등록된 공개 내부 링크를 포함합니다."
                  name="includePagesInSitemap"
                  checked={seoSettings.includePagesInSitemap}
                  onChange={handleSeoToggleChange("includePagesInSitemap")}
                />
                <UploadTogglePolicy
                  title="게시글 포함"
                  description="공개 게시판의 일반 게시글 URL을 포함합니다."
                  name="includePostsInSitemap"
                  checked={seoSettings.includePostsInSitemap}
                  onChange={handleSeoToggleChange("includePostsInSitemap")}
                />
              </div>
            </FieldRow>
          </SectionShell>
        </>
      )}

      {false}

      {false}

      {false}

      {activeSection === "search" && (
        <>
          <SectionShell
            icon={<Search size={13} />}
            title="통합검색 엔진"
            description="헤더 검색 오버레이와 /api/search에서 사용할 기본 동작을 정합니다."
          >
            <FieldRow
              label="기본 동작"
              description="통합검색을 끄면 검색 API는 빈 결과를 반환합니다. 최소 검색어 길이는 너무 짧게 잡으면 DB 부하가 커질 수 있습니다."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <UploadTogglePolicy
                  title="통합검색 사용"
                  description="헤더 검색과 /api/search 결과 생성을 허용합니다."
                  name="integratedSearchEnabled"
                  checked={searchSettings.integratedSearchEnabled}
                  onChange={handleSearchToggleChange("integratedSearchEnabled")}
                />
                <UploadNumberField
                  refObject={minSearchLengthRef}
                  title="최소 검색어"
                  description="이 글자 수 이상일 때만 검색을 실행합니다."
                  unit="자"
                  name="minSearchLength"
                  value={searchSettings.minSearchLength}
                  onChange={handleSearchInputChange("minSearchLength")}
                  error={fieldErrors?.minSearchLength}
                  placeholder="2"
                />
                <UploadNumberField
                  refObject={defaultResultLimitRef}
                  title="그룹별 결과"
                  description="각 검색 그룹이 기본으로 가져올 결과 수입니다."
                  unit="개"
                  name="defaultResultLimit"
                  value={searchSettings.defaultResultLimit}
                  onChange={handleSearchInputChange("defaultResultLimit")}
                  error={fieldErrors?.defaultResultLimit}
                  placeholder="6"
                />
              </div>
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<Search size={13} />}
            title="검색 대상"
            description="문서, 댓글, 첨부파일, 회원 검색을 서비스 정책에 맞게 켜고 끕니다."
          >
            <FieldRow
              label="Core provider"
              description="기본 모듈에서 제공하는 검색 대상입니다. 회원 검색은 개인정보 노출 가능성이 있어 기본값은 꺼져 있습니다."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <UploadTogglePolicy
                  title="문서"
                  description="게시글 제목과 본문을 검색합니다. 비밀글은 제외됩니다."
                  name="documentSearchEnabled"
                  checked={searchSettings.documentSearchEnabled}
                  onChange={handleSearchToggleChange("documentSearchEnabled")}
                />
                <UploadTogglePolicy
                  title="댓글"
                  description="댓글 내용을 검색합니다. 삭제/비밀 댓글은 제외됩니다."
                  name="commentSearchEnabled"
                  checked={searchSettings.commentSearchEnabled}
                  onChange={handleSearchToggleChange("commentSearchEnabled")}
                />
                <UploadTogglePolicy
                  title="첨부파일"
                  description="원본 파일명, 저장 파일명, MIME 타입을 검색합니다."
                  name="attachmentSearchEnabled"
                  checked={searchSettings.attachmentSearchEnabled}
                  onChange={handleSearchToggleChange("attachmentSearchEnabled")}
                />
                <UploadTogglePolicy
                  title="회원"
                  description="닉네임과 이메일 기준으로 회원을 검색합니다. 공개 서비스에서는 신중히 사용합니다."
                  name="userSearchEnabled"
                  checked={searchSettings.userSearchEnabled}
                  onChange={handleSearchToggleChange("userSearchEnabled")}
                />
              </div>
            </FieldRow>
            <FieldRow
              label="민감 정보"
              description="회원 검색을 켠 경우에도 결과에 어떤 정보를 보여줄지 별도로 제한합니다."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <UploadTogglePolicy
                  title="회원 이메일 노출"
                  description="회원 검색 결과 카드에 이메일을 표시합니다. 끄면 검색 조건에는 사용하더라도 결과에는 숨깁니다."
                  name="includeUserEmail"
                  checked={searchSettings.includeUserEmail}
                  onChange={handleSearchToggleChange("includeUserEmail")}
                />
                <UploadTogglePolicy
                  title="확장 모듈 검색"
                  description="extensions에서 등록한 search provider를 통합검색 결과에 포함합니다."
                  name="extensionSearchEnabled"
                  checked={searchSettings.extensionSearchEnabled}
                  onChange={handleSearchToggleChange("extensionSearchEnabled")}
                />
              </div>
            </FieldRow>
          </SectionShell>
        </>
      )}
    </form>
  );
};
export default Settings;

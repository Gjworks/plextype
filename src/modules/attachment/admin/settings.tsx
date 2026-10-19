"use client";

import React, { useMemo, useRef, useState, useTransition } from "react";
import { ShieldCheck, Upload } from "lucide-react";
import { UploadSettingsData } from "@/modules/attachment/actions/settings.type";
import { updateUploadSettingsAdminAction } from "@/modules/attachment/actions/settings.action";
import Button from "@components/button/Button";
import InputField from "@components/form/InputField";
import {
  settingsPrimaryButtonClass,
  selectClass,
  textareaClass,
  SectionShell,
  FieldRow,
  Toggle,
} from "@/core/components/admin/SettingsFields";

const sectionMeta = {
  upload: {
    label: "업로드 설정",
    eyebrow: "Storage",
    description: "첨부파일 용량, 확장자, 검증 기준을 관리합니다.",
  },
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

const defaultUploadSettings: UploadSettingsData = {
  maxUploadSizeMb: 20,
  userStorageLimitMb: 1024,
  maxImageWidth: 2560,
  maxImageHeight: 2560,
  imageQuality: 85,
  imageOutputFormat: "original",
  allowedExtensions:
    ".png, .jpg, .jpeg, .gif, .webp, .avif, .mp3, .ogg, .mp4, .webm, .mov, .zip",
  enableImageProcessing: true,
  stripImageMetadata: true,
  verifyMimeType: true,
  restrictProfileImage: true,
  allowVideo: true,
  allowArchive: true,
};

const Settings = ({
  initialUploadSettings = defaultUploadSettings,
}: {
  initialUploadSettings?: UploadSettingsData;
}) => {
  const activeSection = "upload";

  const meta = useMemo(() => sectionMeta[activeSection], [activeSection]);

  const [isPending, startTransition] = useTransition();

  const [uploadSettings, setUploadSettings] = useState<UploadSettingsData>(
    initialUploadSettings,
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(
    null,
  );

  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const maxUploadSizeMbRef = useRef<HTMLInputElement>(null);

  const userStorageLimitMbRef = useRef<HTMLInputElement>(null);

  const maxImageWidthRef = useRef<HTMLInputElement>(null);

  const maxImageHeightRef = useRef<HTMLInputElement>(null);

  const imageQualityRef = useRef<HTMLInputElement>(null);

  const allowedExtensionsRef = useRef<HTMLTextAreaElement>(null);

  const handleUploadInputChange =
    (field: keyof UploadSettingsData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        e.target.type === "number" ? Number(e.target.value) : e.target.value;
      setUploadSettings((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleUploadToggleChange =
    (field: keyof UploadSettingsData) => (checked: boolean) => {
      setUploadSettings((prev) => ({
        ...prev,
        [field]: checked,
      }));
    };

  const resetUploadSettings = () => {
    setFieldErrors(null);
    setFormMessage(null);
    setUploadSettings(initialUploadSettings);
  };

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors(null);
    setFormMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateUploadSettingsAdminAction(formData);
      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          if (result.fieldErrors.maxUploadSizeMb)
            maxUploadSizeMbRef.current?.focus();
          else if (result.fieldErrors.userStorageLimitMb)
            userStorageLimitMbRef.current?.focus();
          else if (result.fieldErrors.maxImageWidth)
            maxImageWidthRef.current?.focus();
          else if (result.fieldErrors.maxImageHeight)
            maxImageHeightRef.current?.focus();
          else if (result.fieldErrors.imageQuality)
            imageQualityRef.current?.focus();
          else if (result.fieldErrors.allowedExtensions)
            allowedExtensionsRef.current?.focus();
        } else {
          setFormMessage({ type: "error", message: result.message });
        }
        return;
      }
      if (result.data) setUploadSettings(result.data);
      setFormMessage({ type: "success", message: result.message });
    });
  };

  const handleSubmit = handleUploadSubmit;

  const handleReset = resetUploadSettings;

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

      {false}

      {
        <>
          <SectionShell
            icon={<Upload size={13} />}
            title="파일 제한"
            description="업로드 가능한 파일의 크기와 범위입니다."
          >
            <FieldRow
              label="용량 및 이미지 크기"
              description="첨부파일 저장 용량은 MB 기준이고, 이미지 최대 너비는 px 기준입니다."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <UploadNumberField
                  refObject={maxUploadSizeMbRef}
                  title="파일당 최대 용량"
                  description="파일 1개가 업로드될 수 있는 최대 크기입니다."
                  unit="MB"
                  name="maxUploadSizeMb"
                  value={uploadSettings.maxUploadSizeMb}
                  onChange={handleUploadInputChange("maxUploadSizeMb")}
                  error={fieldErrors?.maxUploadSizeMb}
                  placeholder="20"
                />
                <UploadNumberField
                  refObject={userStorageLimitMbRef}
                  title="사용자별 보관 용량"
                  description="한 사용자가 보관할 수 있는 전체 첨부파일 용량입니다."
                  unit="MB"
                  name="userStorageLimitMb"
                  value={uploadSettings.userStorageLimitMb}
                  onChange={handleUploadInputChange("userStorageLimitMb")}
                  error={fieldErrors?.userStorageLimitMb}
                  placeholder="1024"
                />
                <UploadNumberField
                  refObject={maxImageWidthRef}
                  title="이미지 최대 너비"
                  description="이 너비를 넘는 이미지는 비율을 유지한 채 줄입니다."
                  unit="PX"
                  name="maxImageWidth"
                  value={uploadSettings.maxImageWidth}
                  onChange={handleUploadInputChange("maxImageWidth")}
                  error={fieldErrors?.maxImageWidth}
                  placeholder="2560"
                />
                <UploadNumberField
                  refObject={maxImageHeightRef}
                  title="이미지 최대 높이"
                  description="이 높이를 넘는 이미지는 비율을 유지한 채 줄입니다."
                  unit="PX"
                  name="maxImageHeight"
                  value={uploadSettings.maxImageHeight}
                  onChange={handleUploadInputChange("maxImageHeight")}
                  error={fieldErrors?.maxImageHeight}
                  placeholder="2560"
                />
              </div>
            </FieldRow>
            <FieldRow
              label="이미지 처리"
              description="JPG, PNG, WebP, AVIF 업로드 시 sharp로 적용되는 이미지 최적화 정책입니다. GIF는 애니메이션 보호를 위해 원본 저장합니다."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-gray-100 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                      이미지 처리 사용
                    </div>
                    <div className="mt-1 text-xs leading-5 text-gray-400">
                      끄면 이미지도 원본 그대로 저장합니다.
                    </div>
                  </div>
                  <Toggle
                    name="enableImageProcessing"
                    checked={uploadSettings.enableImageProcessing}
                    onChange={handleUploadToggleChange("enableImageProcessing")}
                  />
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                      메타데이터 제거
                    </div>
                    <div className="mt-1 text-xs leading-5 text-gray-400">
                      EXIF 위치정보와 촬영 정보를 제거합니다.
                    </div>
                  </div>
                  <Toggle
                    name="stripImageMetadata"
                    checked={uploadSettings.stripImageMetadata}
                    onChange={handleUploadToggleChange("stripImageMetadata")}
                  />
                </div>
              </div>
            </FieldRow>
            <FieldRow
              label="이미지 품질"
              description="이미지를 재인코딩할 때 사용할 품질 값입니다. 낮을수록 용량은 줄고 화질 손실은 커집니다."
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px] md:items-center">
                <input
                  name="imageQuality"
                  type="range"
                  min={1}
                  max={100}
                  value={uploadSettings.imageQuality}
                  onChange={handleUploadInputChange("imageQuality")}
                  className="w-full accent-primary-500"
                />
                <InputField
                  ref={imageQualityRef}
                  inputTitle="이미지 품질"
                  name="imageQuality"
                  type="number"
                  value={uploadSettings.imageQuality}
                  onChange={handleUploadInputChange("imageQuality")}
                  error={fieldErrors?.imageQuality}
                  placeholder="85"
                  hideLabel
                />
              </div>
            </FieldRow>
            <FieldRow
              label="이미지 출력 포맷"
              description="원본 유지 또는 지정 포맷으로 변환해 저장합니다. WebP는 용량 대비 품질이 좋아 일반적으로 무난합니다."
            >
              <select
                className={selectClass}
                name="imageOutputFormat"
                value={uploadSettings.imageOutputFormat}
                onChange={(event) =>
                  setUploadSettings((prev) => ({
                    ...prev,
                    imageOutputFormat: event.target
                      .value as UploadSettingsData["imageOutputFormat"],
                  }))
                }
              >
                <option value="original">원본 포맷 유지</option>
                <option value="webp">WebP로 변환</option>
                <option value="jpeg">JPEG로 변환</option>
                <option value="png">PNG로 변환</option>
                <option value="avif">AVIF로 변환</option>
              </select>
              {fieldErrors?.imageOutputFormat && (
                <div className="mt-1.5 text-xs leading-5 text-red-500">
                  {fieldErrors.imageOutputFormat}
                </div>
              )}
            </FieldRow>
            <FieldRow
              label="허용 확장자"
              description="쉼표로 구분된 확장자 목록입니다."
            >
              <textarea
                ref={allowedExtensionsRef}
                className={textareaClass}
                name="allowedExtensions"
                rows={3}
                value={uploadSettings.allowedExtensions}
                onChange={handleUploadInputChange("allowedExtensions")}
                placeholder=".png, .jpg, .jpeg, .gif, .webp, .mp4, .zip"
              />
              {fieldErrors?.allowedExtensions && (
                <div className="mt-1.5 text-xs leading-5 text-red-500">
                  {fieldErrors.allowedExtensions}
                </div>
              )}
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<ShieldCheck size={13} />}
            title="검증 정책"
            description="파일 업로드 시 적용할 보안 검증입니다."
          >
            <FieldRow
              label="파일 형식 검증"
              description="확장자만 믿지 않고 브라우저가 전달한 MIME 타입도 함께 확인합니다."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <UploadTogglePolicy
                  title="MIME 타입 검증"
                  description=".jpg 파일이 실제 JPEG인지처럼 확장자와 MIME 타입이 맞는지 검사합니다."
                  name="verifyMimeType"
                  checked={uploadSettings.verifyMimeType}
                  onChange={handleUploadToggleChange("verifyMimeType")}
                />
                <UploadTogglePolicy
                  title="프로필 이미지 제한"
                  description="프로필 이미지 선택 화면에서는 이미지 MIME 타입만 허용하도록 제한합니다."
                  name="restrictProfileImage"
                  checked={uploadSettings.restrictProfileImage}
                  onChange={handleUploadToggleChange("restrictProfileImage")}
                />
              </div>
            </FieldRow>
            <FieldRow
              label="파일 종류 허용"
              description="게시글/댓글 첨부에서 이미지 외 파일을 어느 범위까지 허용할지 정합니다."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <UploadTogglePolicy
                  title="동영상 허용"
                  description="MP4, WebM, MOV 같은 동영상 첨부를 허용합니다. 끄면 이미지/오디오 등 다른 허용 파일만 업로드됩니다."
                  name="allowVideo"
                  checked={uploadSettings.allowVideo}
                  onChange={handleUploadToggleChange("allowVideo")}
                />
                <UploadTogglePolicy
                  title="압축파일 허용"
                  description="ZIP 첨부를 허용합니다. 배포 파일이나 자료실 용도가 아니라면 끄는 편이 안전합니다."
                  name="allowArchive"
                  checked={uploadSettings.allowArchive}
                  onChange={handleUploadToggleChange("allowArchive")}
                />
              </div>
            </FieldRow>
          </SectionShell>
        </>
      }

      {false}

      {false}
    </form>
  );
};
export default Settings;

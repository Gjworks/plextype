"use client";

import React from "react";
import { FileText, Heart, Layers, ListChecks, MessageSquareLock } from "lucide-react";

import InputField from "@components/form/InputField";
import type { PostInfoData } from "@/modules/posts/actions/_type";

type PostInfoProps = {
  id?: string;
  value: PostInfoData;
  onChange: (val: Partial<PostInfoData> | any) => void;
  fieldErrors?: Record<string, string> | null;
};

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
          Board
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

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
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

const PostInfo: React.FC<PostInfoProps> = ({ id, value, onChange, fieldErrors }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: inputValue, type } = e.target;
    onChange({ [name]: type === "number" ? Number(inputValue) : inputValue } as any);
  };

  const handleSkinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ skin: e.target.value.trim() || "default" });
  };

  return (
    <>
      {id && <input type="hidden" name="postId" value={id} />}
      <input type="hidden" name="moduleType" value="posts" />

      <SectionShell icon={<FileText size={13} />} title="게시판 기본설정" description="게시판 주소와 관리자 화면에 표시될 이름입니다.">
        <FieldRow label="게시판 ID" description="URL에 사용되는 영문/숫자 ID입니다.">
          <InputField
            inputTitle="게시판 ID"
            name="mid"
            type="text"
            placeholder="notice"
            value={value.mid || ""}
            onChange={handleInputChange}
            error={fieldErrors?.mid}
            hideLabel
          />
        </FieldRow>

        <FieldRow label="게시판 이름" description="관리자와 사용자 화면에 노출되는 이름입니다.">
          <InputField
            inputTitle="게시판 이름"
            name="moduleName"
            type="text"
            placeholder="공지사항"
            value={value.moduleName || ""}
            onChange={handleInputChange}
            error={fieldErrors?.moduleName}
            hideLabel
          />
        </FieldRow>

        <FieldRow label="게시판 설명" description="관리자 확인용 설명입니다.">
          <InputField
            inputTitle="게시판 설명"
            name="moduleDesc"
            type="text"
            placeholder="게시판 설명"
            value={value.moduleDesc || ""}
            onChange={handleInputChange}
            error={fieldErrors?.moduleDesc}
            hideLabel
          />
        </FieldRow>
      </SectionShell>

      <SectionShell icon={<Layers size={13} />} title="목록 설정" description="목록 화면의 스킨과 페이지 표시 기준입니다.">
        <FieldRow label="목록 스킨" description="default 또는 extensions에서 등록한 스킨 이름을 입력합니다.">
          <InputField
            inputTitle="목록 스킨"
            name="skin"
            type="text"
            placeholder="default"
            value={value.config.skin || "default"}
            onChange={handleSkinChange}
            hideLabel
          />
        </FieldRow>

        <FieldRow label="목록/페이지 수" description="한 페이지의 게시글 수와 페이지 네비게이션 개수입니다.">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              inputTitle="목록 수"
              name="listCount"
              type="number"
              value={value.config.listCount}
              onChange={handleInputChange}
              hideLabel
            />
            <InputField
              inputTitle="페이지 수"
              name="pageCount"
              type="number"
              value={value.config.pageCount}
              onChange={handleInputChange}
              hideLabel
            />
          </div>
        </FieldRow>
      </SectionShell>

      <SectionShell icon={<ListChecks size={13} />} title="기능 설정" description="게시판별 부가 기능의 사용 여부입니다.">
        <FieldRow label="좋아요 사용" description="게시글 본문에 좋아요 기능을 사용합니다.">
          <div className="flex items-center gap-3">
            <Toggle checked={Boolean(value.config.documentLike)} onChange={(checked) => onChange({ documentLike: checked })} />
            <span className="text-sm text-gray-600">좋아요 기능</span>
          </div>
        </FieldRow>

        <FieldRow label="상담 기능 사용" description="관리자와 작성자만 글을 볼 수 있는 게시판으로 운영합니다.">
          <div className="flex items-center gap-3">
            <Toggle checked={Boolean(value.config.consultingState)} onChange={(checked) => onChange({ consultingState: checked })} />
            <span className="text-sm text-gray-600">작성자 전용 목록</span>
          </div>
        </FieldRow>
      </SectionShell>
    </>
  );
};

export default PostInfo;

"use client";

import { ExtraFieldConfig } from "@extentions/posts/_actions/_type";
import InputField from "@/components/form/InputField";

interface Props {
  fields: ExtraFieldConfig[];
  existingData?: any; // 👈 수정 모드일 때 기존 값을 채워넣기 위한 바구니
}

export default function ExtraFieldRenderer({ fields, existingData }: Props) {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-t border-gray-100 mt-6">
      {fields.map((field) => {
        // 서버 액션에서 구분하기 쉽게 name을 설정합니다.
        // 예: extraData__version
        const inputName = `extraData__${field.name}`;
        const defaultValue = existingData?.[field.name] || "";

        return (
          <div key={field.name} className="flex flex-col gap-1">
            {field.type === "select" ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm text-black font-medium">{field.label}</label>
                <select
                  name={inputName} // 💡 register 대신 name 사용
                  defaultValue={defaultValue}
                  required={field.required}
                  className="h-[46px] px-3 rounded-md border border-gray-200 bg-white text-sm outline-none focus:ring-4 focus:ring-gray-100 shadow-md shadow-gray-100"
                >
                  <option value="">선택하세요</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ) : (
              <InputField
                name={inputName} // 💡 register 대신 name 사용
                inputTitle={field.label}
                type={field.type}
                defaultValue={defaultValue}
                required={field.required}
                placeholder={`${field.label}을(를) 입력하세요`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
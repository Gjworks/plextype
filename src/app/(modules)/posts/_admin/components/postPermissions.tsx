"use client";

import React, { useState, useEffect } from "react";

interface Group {
  id: number;
  groupName: string;
  groupTitle: string;
  groupDesc?: string;
}

interface Permission {
  subjectType: string;
  subjectId?: number | null;
}
interface PostPermissionsProps {
  id: string | number;
  value: Record<string, Permission[]>;
  groups: Group[];
  onChange: (val: Record<string, Permission[]>) => void;
}

interface PermissionSectionProps {
  permissionType: string;
  label: string;
  value: Record<string, Permission[]>;
  togglePermission: (
    type: string,
    subjectType: string,
    subjectId?: number
  ) => void;
  groups: Group[];
  permissionGroups: { label: string; value: string }[];
}

const PostPermissions: React.FC<PostPermissionsProps> = ({
                                                           id,
                                                           value,
                                                           groups,
                                                           onChange,
                                                         }) => {
  const [localPermissions, setLocalPermissions] = useState(value);

  useEffect(() => {
    setLocalPermissions(value); // 부모 value가 바뀌면 동기화
  }, [value]);

  const permissionGroups = [
    { label: "비회원", value: "guest" },
    { label: "로그인 사용자", value: "member" },
    { label: "관리자", value: "admin" },
  ];

  const permissions = [
    { label: "목록 조회", permissionsType: "listPermissions" },
    { label: "본문 열람", permissionsType: "readPermissions" },
    { label: "글 작성", permissionsType: "writePermissions" },
    { label: "댓글 작성", permissionsType: "commentPermissions" },
  ];

  function togglePermission(
    permissionType: string,
    subjectType: string,
    subjectId: number | null = null
  ) {
    const current = value[permissionType] ?? [];

    const exists = current.some(
      (p) =>
        p.subjectType === subjectType &&
        Number(p.subjectId) === Number(subjectId)
    );

    const updated = exists
      ? current.filter(
        (p) =>
          !(
            p.subjectType === subjectType &&
            Number(p.subjectId) === Number(subjectId)
          )
      )
      : [...current, { subjectType, subjectId }];

    // ✅ 부모로만 알림
    onChange({ ...value, [permissionType]: updated });
  }

  // UI 컴포넌트: 개별 체크박스 아이템
  const CheckboxItem = ({
                          label,
                          checked,
                          onChange,
                        }: {
    label: string;
    checked: boolean;
    onChange: () => void;
  }) => (
    <label className="flex items-center gap-2 cursor-pointer group select-none">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className="peer appearance-none w-4 h-4 border border-gray-300 rounded-sm bg-white checked:bg-cyan-600 checked:border-cyan-600 transition-all cursor-pointer"
          checked={checked}
          onChange={onChange}
        />
        <svg
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    </label>
  );

  const PermissionSection: React.FC<PermissionSectionProps> = ({
                                                                 permissionType,
                                                                 label,
                                                                 togglePermission,
                                                                 groups,
                                                                 permissionGroups,
                                                               }) => (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 hover:bg-gray-50 transition-colors last:border-0 items-start">
      {/* 라벨 영역 */}
      <div className="sm:col-span-4">
        <div className="text-sm text-black font-medium">{label}</div>
      </div>

      {/* 체크박스 영역 */}
      <div className="sm:col-span-4 flex flex-wrap gap-x-6 gap-y-3">
        {/* 기본 그룹 (비회원, 회원, 관리자) */}
        {permissionGroups.map(({ label, value: groupValue }) => (
          <CheckboxItem
            key={groupValue}
            label={label}
            checked={(localPermissions[permissionType] ?? []).some(
              (p) => p.subjectType === groupValue && p.subjectId === null
            )}
            onChange={() =>
              togglePermission(permissionType, groupValue, undefined)
            }
          />
        ))}

        {/* 구분선 (그룹이 있을 때만 표시) */}
        {groups.length > 0 && (
          <div className="w-px h-4 bg-gray-300 mx-1 self-center hidden sm:block"></div>
        )}

        {/* 사용자 정의 그룹 */}
        {groups.map((group) => (
          <CheckboxItem
            key={group.id}
            label={group.groupTitle}
            checked={(localPermissions[permissionType] ?? []).some(
              (p) =>
                p.subjectType === "group" &&
                Number(p.subjectId) === Number(group.id)
            )}
            onChange={() =>
              togglePermission(permissionType, "group", Number(group.id))
            }
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* PostInfo와 동일한 최상위 그리드 구조 */}
      <div className="grid grid-cols-4 gap-8 py-10">
        {/* 좌측 설명 영역 */}
        <div className="col-span-1">
          <div className="text-lg font-semibold text-gray-600 mb-3">
            권한 설정
          </div>
          <div className="text-gray-400 text-sm">
            게시판의 기능별 접근 권한을 설정합니다.
            <br />
            체크된 대상만 해당 기능을 이용할 수 있습니다.
          </div>
        </div>

        {/* 우측 폼 영역 */}
        <div className="col-span-3">
          <div className="overflow-hidden">
            {permissions.map(({ label, permissionsType }) => (
              <PermissionSection
                key={permissionsType}
                label={label}
                permissionType={permissionsType}
                value={value}
                togglePermission={togglePermission}
                groups={groups}
                permissionGroups={permissionGroups}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostPermissions;
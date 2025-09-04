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
    subjectId?: number,
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
    { label: "목록", permissionsType: "listPermissions" },
    { label: "본문", permissionsType: "readPermissions" },
    { label: "글쓰기", permissionsType: "writePermissions" },
    { label: "댓글", permissionsType: "commentPermissions" },
  ];

  function togglePermission(
    permissionType: string,
    subjectType: string,
    subjectId: number | null = null,
  ) {
    const current = value[permissionType] ?? [];

    const exists = current.some(
      (p) =>
        p.subjectType === subjectType &&
        Number(p.subjectId) === Number(subjectId),
    );

    const updated = exists
      ? current.filter(
          (p) =>
            !(
              p.subjectType === subjectType &&
              Number(p.subjectId) === Number(subjectId)
            ),
        )
      : [...current, { subjectType, subjectId }];

    // ✅ 부모로만 알림
    onChange({ ...value, [permissionType]: updated });
  }

  const PermissionSection: React.FC<PermissionSectionProps> = ({
    permissionType,
    label,
    value,
    togglePermission,
    groups,
    permissionGroups,
  }) => (
    <div className="mb-5">
      <div className="flex gap-2 items-center">
        <div className="w-24 text-sm text-black">{label}</div>
        <div className="flex-1 flex flex-wrap gap-2">
          {permissionGroups.map(({ label, value: groupValue }) => (
            <label key={groupValue}>
              <input
                type="checkbox"
                checked={(localPermissions[permissionType] ?? []).some(
                  (p) => p.subjectType === groupValue && p.subjectId === null,
                )}
                onChange={() =>
                  togglePermission(permissionType, groupValue, undefined)
                }
              />
              {label}
            </label>
          ))}

          {groups.map((group) => (
            <label key={group.id}>
              <input
                type="checkbox"
                checked={(localPermissions[permissionType] ?? []).some(
                  (p) =>
                    p.subjectType === "group" &&
                    Number(p.subjectId) === Number(group.id),
                )}
                onChange={() =>
                  togglePermission(permissionType, "group", Number(group.id))
                }
              />
              {group.groupTitle}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-3">
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
  );
};

export default PostPermissions;

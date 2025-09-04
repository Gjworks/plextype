interface Permission {
  subjectType: string; // "guest" | "member" | "admin" | "group"
  subjectId?: number | null; // group 권한일 경우
}

interface Permissions {
  listPermissions: Permission[];
  readPermissions: Permission[];
  writePermissions: Permission[];
  commentPermissions: Permission[];
}

interface CurrentUser {
  id: number;
  accountId: string;
  isAdmin: boolean;
  groups: number[]; // user가 속한 그룹 ID 배열
  loggedIn: boolean;
}

// 개별 권한 체크용
export const hasPermission = (
  permissions: Permission[],
  currentUser: CurrentUser | null,
) => {
  return permissions.some((p) => {
    if (p.subjectType === "guest") return true; // 비회원 접근 가능
    if (p.subjectType === "member") return !!currentUser?.loggedIn; // 로그인 필요
    if (p.subjectType === "admin") return currentUser?.isAdmin; // 관리자
    if (p.subjectType === "group" && currentUser?.groups) {
      return currentUser.groups.map(Number).includes(Number(p.subjectId)); // 그룹 권한 체크
    }
    return false;
  });
};

// permissions 객체 전체 체크
export const checkPermissions = (
  permissions: Permissions,
  currentUser: CurrentUser | null,
) => {
  return {
    doList: hasPermission(permissions.listPermissions, currentUser),
    doRead: hasPermission(permissions.readPermissions, currentUser),
    doWrite: hasPermission(permissions.writePermissions, currentUser),
    doComment: hasPermission(permissions.commentPermissions, currentUser),
  };
};

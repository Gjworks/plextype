// src/app/(extentions)/posts/_actions/permission.action.ts
'use server'

import { Permission, Permissions, CurrentUser } from "./_type";

/**
 * 🔑 권한 판별의 심장: hasPermission
 * 최고 관리자 및 기본 개방 정책을 최우선으로 적용합니다.
 */
export const hasPermission = async (
  permissions: Permission[],
  currentUser: CurrentUser | null,
): Promise<boolean> => {

  // 🚀 1. [Master Key] 최고 관리자는 모든 권한 설정을 무시하고 통과
  if (currentUser?.isAdmin === true) {
    return true;
  }

  // 🔓 2. [Default Open] 권한 설정이 아예 없다면 '누구나' 접근 가능
  // (게시판 생성 초기나 공개 게시판의 경우)
  if (!permissions || permissions.length === 0) {
    return true;
  }

  // 🔍 3. [Individual Check] 설정된 권한 중 하나라도 일치하면 통과 (OR 조건)
  return permissions.some((p) => {
    // (A) 비회원(guest) 허용: 누구나 접근 가능
    if (p.subjectType === "guest") return true;

    // (B) 회원(member) 허용: 로그인 상태이기만 하면 등급 상관없이 통과
    if (p.subjectType === "member") return !!currentUser?.loggedIn;

    // (C) 특정 그룹(group) 허용: 사용자가 해당 그룹에 속해 있는지 확인
    if (p.subjectType === "group" && currentUser?.groups) {
      return currentUser.groups.map(Number).includes(Number(p.subjectId));
    }

    // (D) 관리자(admin) 전용: (이미 1번에서 걸러졌겠지만 로직상 유지)
    if (p.subjectType === "admin") return !!currentUser?.isAdmin;

    return false;
  });
};

/**
 * 📋 게시판 전체 액션 권한 체크
 */
export async function checkPermissions(
  permissions: Permissions,
  currentUser: CurrentUser | null,
) {
  // 관리자일 경우 모든 권한을 즉시 true로 반환하여 성능 최적화
  if (currentUser?.isAdmin === true) {
    return {
      doList: true,
      doRead: true,
      doWrite: true,
      doComment: true,
    };
  }

  // 일반 유저/비회원은 각 항목별로 병렬 체크
  const [doList, doRead, doWrite, doComment] = await Promise.all([
    hasPermission(permissions.listPermissions, currentUser),
    hasPermission(permissions.readPermissions, currentUser),
    hasPermission(permissions.writePermissions, currentUser),
    hasPermission(permissions.commentPermissions, currentUser),
  ]);

  return { doList, doRead, doWrite, doComment };
}
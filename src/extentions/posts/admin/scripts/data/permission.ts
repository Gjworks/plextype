"use server";

import prisma from "@plextype/utils/db/prisma";
import { PermissionSubject } from "@prisma/client"; // enum 타입 import

// Permission 데이터 타입 정의
export type PermissionData = {
  id?: number;
  resourceType: string; // 예: "post"
  resourceId: number; // 리소스 id
  action: string; // "read", "write", "list", "comment" 등
  subjectType: PermissionSubject; // "user", "group", "role" 등
  subjectId?: number;
};

/**
 * 특정 리소스(resourceType + resourceId) 권한 조회
 */
export async function findPermissionsByResource(
  resourceType: string,
  resourceId: number,
): Promise<PermissionData[]> {
  const permissions = await prisma.permission.findMany({
    where: { resourceType, resourceId },
  });

  return permissions.map((p) => ({
    id: p.id,
    resourceType: p.resourceType,
    resourceId: p.resourceId,
    action: p.action,
    subjectType: p.subjectType,
    subjectId: p.subjectId ?? undefined,
  }));
}

/**
 * 특정 대상(subjectType + subjectId) 권한 조회
 */
export async function findPermissionsBySubject(
  subjectType: PermissionSubject,
  subjectId?: number,
): Promise<PermissionData[]> {
  const permissions = await prisma.permission.findMany({
    where: { subjectType, subjectId },
  });

  return permissions.map((p) => ({
    id: p.id,
    resourceType: p.resourceType,
    resourceId: p.resourceId,
    action: p.action,
    subjectType: p.subjectType,
    subjectId: p.subjectId ?? undefined,
  }));
}

/**
 * Permission 생성
 */
export async function createPermission(data: PermissionData) {
  return prisma.permission.create({
    data: {
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
      subjectType: data.subjectType,
      subjectId: data.subjectId,
    },
  });
}

/**
 * Permission 업데이트
 */
export async function updatePermission(id: number, data: PermissionData) {
  return prisma.permission.update({
    where: { id },
    data: {
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
      subjectType: data.subjectType,
      subjectId: data.subjectId,
    },
  });
}

/**
 * Permission 삭제
 */
export async function deletePermission(id: number) {
  return prisma.permission.delete({ where: { id } });
}

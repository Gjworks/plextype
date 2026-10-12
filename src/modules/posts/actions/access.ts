import "server-only";
import { cookies, headers } from "next/headers";
import { verify } from "@/core/utils/auth/jwtAuth";
import { findModuleById, findPermissionsByModuleId } from "./posts.query";
import { hasPermission } from "./permission";
import { createHmac } from "node:crypto";

export async function getBoardViewer() {
  const header = (await headers()).get("authorization");
  const token = header?.match(/^Bearer (.+)$/i)?.[1] || (await cookies()).get("accessToken")?.value;
  return token ? verify(token) : null;
}
export async function canAccessBoard(moduleId: number | null | undefined, action: "list" | "read" | "write" | "comment", viewer: Awaited<ReturnType<typeof getBoardViewer>>) {
  if (!moduleId) return false;
  const board = await findModuleById(moduleId);
  if (!board || (board.status && board.status !== "active" && !viewer?.isAdmin)) return false;
  const permissions = await findPermissionsByModuleId(moduleId);
  return hasPermission(permissions.filter(p => p.action === action), viewer ? {
    ...viewer, isAdmin: Boolean(viewer.isAdmin), loggedIn: true, groups: viewer.groups || [],
  } : null);
}
export function secretCookieValue(slug: string, passwordHash: string | null | undefined) {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("Invalid JWT_SECRET");
  return createHmac("sha256", secret).update(`post:${slug}:${passwordHash || ""}`).digest("hex");
}
export async function canReadDocument(document: { moduleId?: number | null; userId?: number | null; slug: string; isSecrets?: boolean | null; authorPassword?: string | null; published?: boolean | null }, viewer: Awaited<ReturnType<typeof getBoardViewer>>, checkSecret = true) {
  if (!await canAccessBoard(document.moduleId, "read", viewer)) return false;
  const owner = Boolean(viewer?.id && viewer.id === document.userId);
  if (document.published === false && !owner && !viewer?.isAdmin) return false;
  const board = await findModuleById(document.moduleId!);
  if ((board?.config as { consultingState?: boolean } | null)?.consultingState && !owner && !viewer?.isAdmin) return false;
  if (checkSecret && document.isSecrets && !owner && !viewer?.isAdmin) {
    return (await cookies()).get(`post_secret_${document.slug}`)?.value === secretCookieValue(document.slug, document.authorPassword);
  }
  return true;
}

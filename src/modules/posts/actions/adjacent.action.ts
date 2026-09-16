"use server";

import { cookies } from "next/headers";
import { verify } from "@/core/utils/auth/jwtAuth";
import { getPostsInfoAction } from "./posts.action";
import { checkPermissionsAction } from "./permission.action";
import { findAdjacentPostsQuery } from "./adjacent.query";

export async function getAdjacentPostsAction(mid: string, slug: string) {
  const empty = { previous: null, next: null };
  if (typeof mid !== "string" || typeof slug !== "string" || !mid || !slug) return empty;
  try {
    const info = await getPostsInfoAction(mid);
    if (!info.success || !info.data) return empty;
    const token = (await cookies()).get("accessToken")?.value;
    const verified = token ? await verify(token) : null;
    const user = verified?.id ? { ...verified, loggedIn: true, isAdmin: Boolean(verified.isAdmin), groups: verified.groups || [] } : null;
    const permissions = await checkPermissionsAction(info.data.permissions, user);
    if (!permissions.doList || !permissions.doRead) return empty;
    const ownerId = info.data.config?.consultingState && !user?.isAdmin ? (user?.id || 0) : undefined;
    return await findAdjacentPostsQuery(info.data.id, slug, ownerId);
  } catch (error) {
    console.error("getAdjacentPostsAction failed", error);
    return empty;
  }
}

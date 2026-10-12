import "server-only";
import { getLoggedUserAction } from "@/modules/user/actions/user.action";
export async function requireAdmin() {
  const user = await getLoggedUserAction();
  if (!user.id || !user.isAdmin) throw new Error("관리자 권한이 필요합니다.");
  return user;
}

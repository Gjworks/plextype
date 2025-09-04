import {
  findUserById,
  findUserFullById,
} from "@/extentions/user/admin/scripts/data/user";
import { getAllGroupRecords } from "@/extentions/user/admin/scripts/data/group";

export async function getUserUpdateData(userId: string) {
  const numericId = Number(userId);
  const user = await findUserFullById(numericId);
  if (!user) throw new Error("사용자 정보를 찾을 수 없습니다.");

  const groupList = await getAllGroupRecords();
  return { user, groupList };
}

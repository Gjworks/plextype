import { getUserSessionAction } from "@/modules/user/actions/user.action";

export const getAdminSession = async () => {
  const sessionInfo = await getUserSessionAction();
  if (!sessionInfo?.data?.isAdmin) return null;
  return sessionInfo.data;
};

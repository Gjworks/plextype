"use server";

import { getAllGroupRecords } from "@/extentions/user/admin/scripts/data/group";

const getGroups = async () => {
  return getAllGroupRecords(); // 그룹 리스트를 이름순으로 반환
};

export { getGroups };

// src/app/(extentions)/admin/user/groupList/page.tsx
import DashboardUserGroupList from "@/modules/user/admin/groupList";
// 💡 경로를 group.action 으로 명확하게 지정해 줍니다!
import { getAllGroupRecords } from "@/modules/user/actions/group.action";

const Page = async () => {
  // 💡 1. 서버가 화면을 그리기 전에 DB를 직통으로 찔러서 그룹 목록을 싹 가져옵니다.
  const groupList = await getAllGroupRecords();

  return (
    <div className="max-w-screen-2xl mx-auto py-10">
      {/* 💡 2. 클라이언트 컴포넌트에는 '완성된 데이터'만 쏙 던져줍니다. */}
      <DashboardUserGroupList initialGroupList={groupList} />
    </div>
  );
};

export default Page;
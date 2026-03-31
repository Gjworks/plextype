import UpsertForm from "@modules/user/_admin/upsertForm";
import { getAllGroupRecords } from "@modules/user/_actions/group.action";

const Page = async () => {
  const groupList = await getAllGroupRecords();

  return (
    <div className="max-w-screen-2xl mx-auto px-3">
      {/* 💡 user 데이터를 안 넘깁니다! -> 자동으로 '등록 모드' 발동 */}
      <UpsertForm groupList={groupList} />
    </div>
  );
};

export default Page;
import { getUserUpdateData } from "@/extentions/user/admin/scripts/actions/getUserUpdateData";
import UpdateFormClient from "./updateClient";

type Props = {
  id: string;
};

const DashboardUserUpdate = async ({ id }: Props) => {
  const { user, groupList } = await getUserUpdateData(id);
  console.log(user);
  return (
    <div className="max-w-screen-2xl mx-auto px-3">
      {user ? (
        <UpdateFormClient user={user} groupList={groupList} />
      ) : (
        <div>로딩 중...</div>
      )}
    </div>
  );
};

export default DashboardUserUpdate;

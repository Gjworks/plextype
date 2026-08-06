import NotificationPage from "@/extensions/service/notifications";
import UserAccountLayout from "@/extensions/user/gjworks/UserAccountLayout";

const UserNotificationsPage = () => {
  return (
    <UserAccountLayout active="notifications" title="알림센터" description="서비스와 계정에서 발생한 알림을 확인합니다.">
      <NotificationPage showHeader={false} variant="account" />
    </UserAccountLayout>
  );
};

export default UserNotificationsPage;

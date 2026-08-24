import NotificationPage from "@/extensions/service/notifications";
import UserAccountLayout from "@/extensions/user/gjworks/UserAccountLayout";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";
import HeaderUser from "@/modules/user/tpl/default/header";

const UserNotificationsPage = async () => {
  const settings = await getPublicSiteSettingsAction();
  const userLayoutKey = settings.data?.userLayout || "default";

  if (userLayoutKey !== "gjworks") {
    return (
      <>
        <HeaderUser />
        <main className="min-h-screen bg-white dark:bg-dark-950">
          <div className="mx-auto max-w-screen-lg px-4 py-10 md:py-14">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-900 md:p-8">
              <div className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">Notifications</div>
              <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-gray-950 dark:text-dark-100">알림센터</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-400">계정으로 도착한 알림을 확인합니다.</p>
              <NotificationPage showHeader={false} variant="account" />
            </section>
          </div>
        </main>
      </>
    );
  }

  return (
    <UserAccountLayout active="notifications" title="알림센터" description="서비스와 계정에서 발생한 알림을 확인합니다.">
      <NotificationPage showHeader={false} variant="account" />
    </UserAccountLayout>
  );
};

export default UserNotificationsPage;

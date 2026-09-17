import HeaderUser from "@/modules/user/tpl/default/header";
import NotificationHistory from "./NotificationHistory";

export default function UserNotificationsPage() {
  return (
    <>
      <HeaderUser />
      <main className="mx-auto max-w-screen-lg px-4 py-10 md:py-14">
        <NotificationHistory />
      </main>
    </>
  );
}

import { getBroadcastOverviewAdminAction } from "./actions/broadcast.action";
import BroadcastAdmin from "./admin/BroadcastAdmin";

export default async function NotificationAdmin({ history = false }: { history?: boolean }) {
  const result = await getBroadcastOverviewAdminAction();
  if (!result.success) return <p role="alert">{result.message}</p>;
  return <BroadcastAdmin history={history} initial={result.data} />;
}

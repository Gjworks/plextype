import { getServiceDeployLogsAdminAction } from "@/extensions/service/actions/deploy.action";
import { ServiceAdminDeployLogs } from "@/extensions/service/adminDeployLogs";

export const dynamic = "force-dynamic";

export default async function ServiceAdminDeployLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const logs = await getServiceDeployLogsAdminAction();

  return <ServiceAdminDeployLogs logs={logs} page={Number(page) || 1} />;
}

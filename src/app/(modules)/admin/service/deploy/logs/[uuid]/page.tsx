import { notFound } from "next/navigation";

import Bottom from "@/core/components/panel/Bottom";
import { getServiceDeployLogDetailAdminAction } from "@/extensions/service/actions/deploy.action";
import { ServiceAdminDeployLogDetail } from "@/extensions/service/adminDeployLogs";

export const dynamic = "force-dynamic";

export default async function ServiceAdminDeployLogDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const log = await getServiceDeployLogDetailAdminAction(uuid);
  if (!log) notFound();

  return (
    <Bottom closeHref="/admin/service/deploy/logs">
      <ServiceAdminDeployLogDetail log={log} />
    </Bottom>
  );
}

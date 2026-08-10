import { notFound } from "next/navigation";

import Bottom from "@/core/components/panel/Bottom";
import { getServiceDeployRequestDetailAdminAction } from "@/extensions/service/actions/deploy.action";
import { ServiceAdminDeployDetail } from "@/extensions/service/adminDeployDetail";

export default async function ServiceAdminDeployDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const detail = await getServiceDeployRequestDetailAdminAction(uuid);
  if (!detail) notFound();

  return (
    <Bottom closeHref="/admin/service/deploy">
      <ServiceAdminDeployDetail request={detail.request} jobs={detail.jobs} />
    </Bottom>
  );
}

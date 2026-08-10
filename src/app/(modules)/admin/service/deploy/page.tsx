import { ServiceAdminDeploy } from "@/extensions/service/adminDeploy";
import { getServiceDeployRequestsAdminAction } from "@/extensions/service/actions/deploy.action";

export default async function ServiceAdminDeployPage() {
  const requests = await getServiceDeployRequestsAdminAction();
  return <ServiceAdminDeploy requests={requests} />;
}

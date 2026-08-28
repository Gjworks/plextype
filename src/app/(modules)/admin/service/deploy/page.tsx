import { ServiceAdminDeploy } from "@/extensions/service/adminDeploy";
import {
  getServiceDeployAssignableUsersAdminAction,
  getServiceDeployRequestsAdminAction,
} from "@/extensions/service/actions/deploy.action";

export default async function ServiceAdminDeployPage() {
  const [requests, users] = await Promise.all([
    getServiceDeployRequestsAdminAction(),
    getServiceDeployAssignableUsersAdminAction(),
  ]);

  return <ServiceAdminDeploy requests={requests} users={users} />;
}

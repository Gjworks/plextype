import { getInstallerOverviewAdminAction } from "./actions/installer.action";
import InstallerAdmin from "./tpl/InstallerAdmin";

export default async function Installer({ view }: { view: string }) {
  const state = await getInstallerOverviewAdminAction();
  return <InstallerAdmin state={state} view={view} />;
}

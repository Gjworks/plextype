import { redirect } from "next/navigation";

import Timeline from "@/modules/user/tpl/default/timeline";
import { getUserTimelineAction } from "@/modules/user/actions/timeline.action";

const Page = async () => {
  const result = await getUserTimelineAction();

  if (!result.success || !result.data) {
    redirect("/auth/signin");
  }

  return <Timeline initialData={result.data} />;
};

export default Page;

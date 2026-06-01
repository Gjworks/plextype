import { redirect } from "next/navigation";

import Preferences from "@/modules/user/tpl/default/preferences";
import { getMyPreferenceAction } from "@/modules/user/actions/preference.action";

const Page = async () => {
  const result = await getMyPreferenceAction();

  if (!result.success || !result.data) {
    redirect("/auth/signin?redirect=/user/preferences");
  }

  return <Preferences initialPreference={result.data} />;
};

export default Page;

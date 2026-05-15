import type React from "react";

import AuthLayout from "./layouts/authLayout/Layout";
import DefaultLayout from "./layouts/default/Layout";
import HomePage from "./pages/MainIntro";
import IssueTrackerListSkin from "./posts/tpl/issuetracker/list";

export type PostSkinMap = Record<string, React.ComponentType<any>>;

export const postSkins: PostSkinMap = {
  issuetracker: IssueTrackerListSkin,
};

export { AuthLayout, DefaultLayout, HomePage };

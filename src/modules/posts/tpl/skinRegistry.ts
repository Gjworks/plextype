import type React from "react";

import IssueTrackerListSkin from "@/extensions/posts/tpl/issuetracker/list";

type PostSkinRegistry = {
  list: Record<string, React.ComponentType<any>>;
};

export const postSkinRegistry: PostSkinRegistry = {
  list: {
    issuetracker: IssueTrackerListSkin,
  },
};

export function normalizeSkinName(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

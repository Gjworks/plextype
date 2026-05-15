import type React from "react";

import { postSkins } from "@project/extensions";

type PostSkinRegistry = {
  list: Record<string, React.ComponentType<any>>;
};

export const postSkinRegistry: PostSkinRegistry = {
  list: postSkins || {},
};

export function normalizeSkinName(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

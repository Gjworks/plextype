import type React from "react";

import { postLayouts, postSkins, postReadSkins, postWriteSkins, postCommentSkins, postTocSkins, postCommentPlacingSkins } from "@extensions";

type PostSkinRegistry = {
  list: Record<string, React.ComponentType<any>>;
  read: Record<string, React.ComponentType<any>>;
  write: Record<string, React.ComponentType<any>>;
  comments: Record<string, React.ComponentType<any>>;
  toc: string[];
  placesComments: string[];
};
type PostLayoutRegistry = Record<string, React.ComponentType<any>>;

export const postSkinRegistry: PostSkinRegistry = {
  list: postSkins || {},
  read: postReadSkins || {},
  write: postWriteSkins || {},
  comments: postCommentSkins || {},
  toc: postTocSkins || [],
  placesComments: postCommentPlacingSkins || [],
};

export const postLayoutRegistry: PostLayoutRegistry = postLayouts || {};

export function normalizeSkinName(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeLayoutName(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

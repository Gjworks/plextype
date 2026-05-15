import type React from "react";

import AuthLayout from "@/layouts/auth/Layout";
import DefaultLayout from "@/layouts/default/Layout";
import HomePage from "@/page/home";

export type PostSkinMap = Record<string, React.ComponentType<any>>;

export const postSkins: PostSkinMap = {};

export { AuthLayout, DefaultLayout, HomePage };

"use client";

import React from "react";
import PostProvider from "./PostProvider";

export const PostProviderWrapper = ({ children, postInfo, currentUser, permissions }: any) => {
  return (
    <PostProvider value={{ postInfo, currentUser, permissions }}>
      {children}
    </PostProvider>
  );
};
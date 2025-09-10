"use client";

import React from "react";
import PostProvider from "./PostProvider";

export const PostProviderWrapper = ({ children, postInfo, currentUser }: any) => {
  return (
    <PostProvider value={{ postInfo, currentUser }}>
      {children}
    </PostProvider>
  );
};
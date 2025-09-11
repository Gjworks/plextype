// getPostsAction.ts
"use server";
import {getPosts} from "@/extentions/posts/scripts/actions/getPosts";

export async function getPostsAction(pid: string, page: number, pageSize: number) {
  return await getPosts(pid, page, pageSize);
}
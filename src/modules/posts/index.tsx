import React from "react";
import { cookies, headers } from "next/headers";
import { decodeJwt } from "jose";

// Actions & Utils
import { getPostsInfo } from "@/modules/posts/actions/posts.action";
import { getDocumentList, getDocument, saveDocument, increaseViewCount, getDocumentBySlugAction } from "@/modules/document/actions/document.action";
import { checkPermissions } from "@/modules/posts/actions/permission.action";
import { getCommentsAction, getParticipantsAction, saveCommentAction, removeCommentAction } from "@/modules/comment/actions/comment.action";

// UI Helpers
import PostNotFound from "@/modules/posts/tpl/default/notFound";
import PostProvider from "@/modules/posts/tpl/default/PostProvider";

// 🌟 [Default Skins] 아무것도 안 넘겼을 때 입을 기본 옷들
import DefaultListSkin from "@/modules/posts/tpl/default/list";
import DefaultReadSkin from "@/modules/posts/tpl/default/read";
import DefaultCommentsSkin from "@/modules/comment/tpl/list";
import DefaultWriteSkin from "@/modules/posts/tpl/default/write";

/** 💡 공통 서버 유저 헬퍼 */
async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return { id: 0, accountId: "", isAdmin: false, groups: [], loggedIn: false };
  try {
    const decoded = decodeJwt(token) as any;
    return { ...decoded, loggedIn: true };
  } catch {
    return { id: 0, accountId: "", isAdmin: false, groups: [], loggedIn: false };
  }
}

/**
 * 🧩 1. 목록 블록 (Post.List)
 */
async function PostList({
                          mid, page = 1, limit = 10, category,
                          Skin = DefaultListSkin // 👈 스킨 주입
                        }: {
  mid: string; page?: number; limit?: number; category?: string;
  Skin?: React.ComponentType<any>;
}) {
  const [infoRes, listRes, user] = await Promise.all([
    getPostsInfo(mid),
    getDocumentList(mid, page, limit, category),
    getServerUser()
  ]);

  if (!infoRes.success || !infoRes.data) return <PostNotFound />;

  const permissions = await checkPermissions(infoRes.data.permissions, user);

  return (
    <PostProvider value={{ postInfo: infoRes.data, currentUser: user, permissions }}>
      <Skin
        posts={listRes.data?.documentList || []}
        pagination={listRes.data?.navigation || { page: 1, totalPages: 1, listCount: 0, totalCount: 0 }}
      />
    </PostProvider>
  );
}

/**
 * 🧩 2. 상세 본문 블록 (Post.Read)
 */
async function PostRead({
                          mid, slug,
                          Skin = DefaultReadSkin // 👈 스킨 주입
                        }: {
  mid: string; slug: string;
  Skin?: React.ComponentType<any>;
}) {
  const [infoRes, docRes, user] = await Promise.all([
    getPostsInfo(mid),
    getDocumentBySlugAction(slug),
    getServerUser(),

  ]);

  if (!infoRes.success || !docRes.success || !docRes.data) return null;
  const numericId = docRes.data.id;
  const participantsRes = await getParticipantsAction(numericId);
  const permissions = await checkPermissions(infoRes.data.permissions, user);
  const requestIp = (await headers()).get("x-forwarded-for") || '';
  await increaseViewCount(numericId, user?.id, requestIp);

  return (
    <PostProvider value={{ postInfo: infoRes.data, currentUser: user, permissions }}>
      <Skin document={docRes.data} participants={participantsRes.data || []} />
    </PostProvider>
  );
}

/**
 * 🧩 3. 댓글 블록 (Post.Comments)
 */
async function PostComments({
                              mid, slug, page = 1,
                              Skin = DefaultCommentsSkin // 👈 스킨 주입
                            }: {
  mid: string; slug: string; page?: number;
  Skin?: React.ComponentType<any>;
}) {

  const docRes = await getDocumentBySlugAction(slug);
  if (!docRes.data) return null;
  const id = docRes.data.id;

  const [infoRes, user, commentsRes] = await Promise.all([
    getPostsInfo(mid),
    getServerUser(),
    getCommentsAction(id, page, 10),
  ]);

  if (!infoRes.success || !infoRes.data) return null;

  const permissions = await checkPermissions(infoRes.data.permissions, user);

  async function upsertCommentAction(data: any) {
    "use server";
    const path = `/posts/${mid}/${slug}`;
    if (data.commentId && (data.options?.remove || data.options?.deleted)) {
      return await removeCommentAction(id, data.commentId, path);
    }
    const formData = new FormData();
    if (data.commentId) formData.append("id", data.commentId.toString());
    formData.append("documentId", id.toString());
    formData.append("content", data.content);
    if (data.parentId) formData.append("parentId", data.parentId.toString());
    return await saveCommentAction(formData, path);
  }

  return (
    <PostProvider value={{ postInfo: infoRes.data, currentUser: user, permissions }}>
      <Skin
        documentId={id}
        commentsData={commentsRes.data || { items: [], pagination: { totalCount: 0, totalPages: 0, currentPage: 1, pageSize: 10 } }}
        upsertComment={upsertCommentAction as any}
        getCommentsPage={async (p: number) => { "use server"; return await getCommentsAction(id, p, 10); }}
      />
    </PostProvider>
  );
}

/**
 * 🧩 4. 쓰기/수정 블록 (Post.Write)
 */
async function PostWrite({
                           mid, slug,
                           Skin = DefaultWriteSkin // 👈 스킨 주입
                         }: {
  mid: string; slug?: string;
  Skin?: React.ComponentType<any>;
}) {
  const [infoRes, user] = await Promise.all([
    getPostsInfo(mid),
    getServerUser()
  ]);

  console.log(mid)

  if (!infoRes.success || !infoRes.data) return null;

  const permissions = await checkPermissions(infoRes.data.permissions, user);

  let existingPost: any = null;
  if (slug) {
    const docRes = await getDocumentBySlugAction(slug);
    existingPost = docRes.data;
  }

  const savePostAction = async (formData: FormData) => {
    "use server";
    return await saveDocument(mid, formData, `/posts/${mid}`);
  };

  return (
    <PostProvider value={{ postInfo: infoRes.data, currentUser: user, permissions }}>
      <Skin existingPost={existingPost} savePost={savePostAction} />
    </PostProvider>
  );
}

// 🌟 최종 조립 객체
export const Post = {
  List: PostList,
  Read: PostRead,
  Comments: PostComments,
  Write: PostWrite,
};
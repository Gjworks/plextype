import React from "react";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";

// Actions & Utils
import { getPostsInfo } from "./_actions/posts.action";
import { getDocumentList, getDocument, saveDocument } from "./_actions/document.action";
import { checkPermissions } from "./_actions/permission.action";
import { headers } from "next/headers";
import { getCommentsAction, getParticipantsAction, saveCommentAction, removeCommentAction } from "./_actions/comment.action";
import { increaseViewCount } from "./_actions/document.action";
import CommentsList from "./_tpl/default/comment/list";

import PostNotFound from "@extentions/posts/_tpl/default/notFound";
// Templates (UI)
import PostProvider from "./_tpl/default/PostProvider";
import PostsListClient from "./_tpl/default/list";
import PostsRead from "./_tpl/default/read";
import PostWriteTemplate from "./_tpl/default/write";

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
async function PostList({ pid, page = 1, limit = 10, category }: { pid: string; page?: number; limit?: number, category?: string; }) {
  const [infoRes, listRes, user] = await Promise.all([
    getPostsInfo(pid),
    getDocumentList(pid, page, limit, category),
    getServerUser()
  ]);

  // 🌟 [여기서 처리!] 게시판이 없으면 블록 자체가 NotFound를 뱉습니다.
  // 이렇게 해야 다른 페이지에 위젯으로 넣었을 때도 안전합니다.
  if (!infoRes.success || !infoRes.data) {
    return <PostNotFound />;
    // 혹은 위젯 형태라면 더 가벼운 <div className="p-4">게시판이 없습니다.</div> 형태도 좋고요.
  }

  const permissions = await checkPermissions(infoRes.data.permissions, user);

  return (
    <PostProvider value={{
      postInfo: infoRes.data,
      currentUser: user,
      permissions
    }}>
      <PostsListClient
        posts={listRes.data?.documentList || []}
        // 🌟 '기본값' 대신 실제 인터페이스에 맞는 초기 객체를 넣어줍니다.
        pagination={listRes.data?.navigation || {
          page: 1,
          totalPages: 1,
          listCount: 0,
          totalCount: 0
        }}
      />
    </PostProvider>
  );
}

/**
 * 🧩 2. 상세 블록 (Post.Read)
 */
/**
 * 🧩 [상세 본문 블록] Post.Read
 * 본문 내용 출력 및 조회수 증가만 담당합니다.
 */
async function PostRead({ pid, id }: { pid: string; id: number }) {
  const [infoRes, docRes, user, participantsRes] = await Promise.all([
    getPostsInfo(pid),
    getDocument(id),
    getServerUser(),
    getParticipantsAction(id) // 참여자 정보는 본문 영역(헤더/푸터)에서도 쓰이므로 유지
  ]);

  if (!infoRes.success || !docRes.success || !docRes.data) return null;

  const permissions = await checkPermissions(infoRes.data.permissions, user);

  // 조회수 증가
  const requestIp = (await headers()).get("x-forwarded-for") || '';
  await increaseViewCount(id, user?.id, requestIp);

  return (
    <PostProvider value={{ postInfo: infoRes.data, currentUser: user, permissions }}>
      <PostsRead document={docRes.data} participants={participantsRes.data || []} />
    </PostProvider>
  );
}

/**
 * 🧩 [댓글 블록] Post.Comments
 * 댓글 리스트 페칭 및 작성/수정/삭제 액션을 담당합니다.
 */
async function PostComments({ pid, id, page = 1 }: { pid: string; id: number; page?: number }) {
  const [infoRes, user, commentsRes] = await Promise.all([
    getPostsInfo(pid),
    getServerUser(),
    getCommentsAction(id, page, 10),
  ]);

  if (!infoRes.success) return null;

  const permissions = await checkPermissions(infoRes.data.permissions, user);

  // 댓글 서버 액션 정의
  async function upsertCommentAction(data: { content: string; parentId?: number; commentId?: number; options?: any }) {
    "use server";
    const path = `/posts/${pid}/${id}`;
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
      <CommentsList
        documentId={id}
        commentsData={commentsRes.data || { items: [], pagination: { totalCount: 0, totalPages: 0, currentPage: 1, pageSize: 10 } }}
        upsertComment={upsertCommentAction as any}
        getCommentsPage={async (p: number) => { "use server"; return await getCommentsAction(id, p, 10); }}
      />
    </PostProvider>
  );
}


/**
 * 🧩 [쓰기/수정 블록] Post.Write
 * 신규 작성과 수정을 모두 담당하며, 저장 로직(Server Action)까지 패키징합니다.
 */
async function PostWrite({ pid, id }: { pid: string; id?: number }) {
  const [infoRes, user] = await Promise.all([
    getPostsInfo(pid),
    getServerUser()
  ]);

  if (!infoRes.success || !infoRes.data) return null;

  const permissions = await checkPermissions(infoRes.data.permissions, user);

  // 2. 기존 글 가져오기 로직
  let existingPost: any = null;
  if (id) {
    const docRes = await getDocument(id);
    existingPost = docRes.data;
  }

  // 3. 저장 로직 (이건 블록이 책임집니다)
  const savePostAction = async (formData: FormData) => {
    "use server";
    return await saveDocument(pid, formData, `/posts/${pid}`);
  };

  return (
    <PostProvider value={{ postInfo: infoRes.data, currentUser: user, permissions }}>
      {/* 🌟 4. 여기서 정확하게 UI 템플릿에게 필요한 것만 전달합니다. */}
      {/* 이제 빨간 줄이 사라질 거예요! */}
      <PostWriteTemplate
        existingPost={existingPost}
        savePost={savePostAction}
      />
    </PostProvider>
  );
}

// 🌟 최종 조립 객체 (어디서든 이 객체를 통해 접근)
export const Post = {
  List: PostList,
  Read: PostRead,
  Comments: PostComments,
  Write: PostWrite,
};
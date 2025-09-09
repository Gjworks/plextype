import { cookies } from "next/headers";
import { decodeJwt } from "jose";

import { getPostInfo } from "@/extentions/posts/scripts/actions/getPostInfo";
import { checkPermissions } from "@/extentions/posts/scripts/actions/hasPermission";
import { upsertPost } from "@/extentions/posts/scripts/actions/upsertPost";
import { getPost } from "@/extentions/posts/scripts/actions/getPost";

import PostNotFound from "./notFound";
import PostNotPermission from "./notPermission";
import PostWriteClient from "@/extentions/posts/templates/default/writeClient";

interface PageProps {
  params: {
    pid: string;
    id?:string
  };
}

interface CurrentUser {
  id: number;
  accountId: string;
  isAdmin: boolean;
  groups: number[];
  loggedIn: boolean;
}

type Post = {
  id: number;
  title: string | null;
  content: string | null;
  createdAt: Date;
  user: {
    id: number;
    nickName: string;
  } | null;
  // ...나머지 필드들
};


const PostWrite = async ({ params }: PageProps) => {
  const { pid, id } = params;
  console.log(id)

  // JWT 쿠키에서 사용자 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  let currentUser: CurrentUser | null = null;
  if (accessToken) {
    try {
      const decoded = decodeJwt(accessToken) as {
        id: number;
        accountId: string;
        isAdmin: boolean;
        groups: number[];
      };
      if (decoded) {
        currentUser = { ...decoded, loggedIn: true };
      }
    } catch (err) {
      console.error("JWT decode 실패", err);
    }
  }

  // 게시판 정보 가져오기
  const postInfo = await getPostInfo(pid);
  if (!postInfo) {
    return <PostNotFound />;
  }

  // 권한 확인
  const permissionResult = checkPermissions(postInfo.permissions, currentUser);
  if (!permissionResult.doWrite) {
    return <PostNotPermission />;
  }


  let existingPost: Post | null = null;
  if (id) {
    existingPost = await getPost(Number(id));
    if (!existingPost) {
      return <div>존재하지 않는 글입니다.</div>;
    }
  }

  const savePost = async (formData: FormData) => {
    "use server"; // <-- 중요
    console.log(formData);
    await upsertPost(pid, formData);
  };
  console.log(existingPost)
  // 권한 통과 → 글쓰기 화면 렌더링
  return (
    <div className="max-w-screen-lg mx-auto px-3">
      <div className="py-5 px-8 rounded-2xl">
        <div className="pt-8 mb-6">
          <PostWriteClient savePost={savePost} existingPost={existingPost} />
        </div>
      </div>
    </div>
  );
};

export default PostWrite;

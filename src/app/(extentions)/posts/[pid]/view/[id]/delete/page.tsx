import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import prisma from "@plextype/utils/db/prisma";
import DocumentDelete from "@/extentions/posts/templates/default/delete";

const Page = async ({  params: rawParams  }: { params: Promise<{ pid: string; id?: string }> }) => {
  const { pid, id } = await rawParams;

  // 1. 쿠키에서 accessToken 가져오기
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인이 필요합니다.");

  // 2. JWT decode
  const decoded = decodeJwt(accessToken) as { id: number; isAdmin: boolean } | null;
  if (!decoded) throw new Error("유효하지 않은 토큰입니다.");
  const userId = decoded.id;
  const isAdmin = decoded.isAdmin;

  // 3. 글 정보 조회
  const document = await prisma.document.findUnique({
    where: { id: Number(id) },
    select: { id: true, userId: true, title: true },
  });
  if (!document) throw new Error("존재하지 않는 글입니다.");

  // 4. 작성자 확인
  if (document.userId !== userId && !isAdmin) {
    throw new Error("본인이 작성한 글만 삭제할 수 있습니다.");
  }

  return(
    <>
      <div className="py-20">
        {userId === document.userId && (
          <DocumentDelete document={document} pid={pid} />
        )}
      </div>
    </>
  )
}

export default Page
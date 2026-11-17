import Link from "next/link";
import { boardButton, boardDangerButton } from "./boardStyles";

// 기본 스킨 본문 아래의 목록·수정·삭제 버튼.
const BoardReadActions = ({ mid, slug, canEdit }: { mid: string; slug: string; canEdit: boolean }) => {
  const base = `/posts/${encodeURIComponent(mid)}`;
  const post = `${base}/${encodeURIComponent(slug)}`;

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      <Link href={base} className={boardButton}>목록</Link>
      {canEdit && (
        <div className="flex gap-1.5">
          <Link href={`${post}/edit`} className={boardButton}>수정</Link>
          <Link href={`${post}/delete`} className={boardDangerButton}>삭제</Link>
        </div>
      )}
    </div>
  );
};

export default BoardReadActions;

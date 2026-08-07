"use client";

import { useRouter } from "next/navigation";
import Button from "@components/button/Button";

interface ReadActionsProps {
  mid: string;
  slug: string;
  canEdit: boolean;
}

const ReadActions = ({ mid, slug, canEdit }: ReadActionsProps) => {
  const router = useRouter();

  return (
    <div className="flex justify-end gap-2 mx-auto max-w-screen-md px-3 py-8">
      <Button
        type="button"
        fullWidth={false}
        onClick={() => router.push(`/posts/${mid}`)}
        className="min-w-20 !px-5 !py-2"
      >
        목록
      </Button>

      {canEdit && (
        <>
          <Button
            type="button"
            fullWidth={false}
            onClick={() => router.push(`/posts/${mid}/${slug}/edit`)}
            className="min-w-20 border-primary-500/25 !px-5 !py-2 text-primary-600 hover:border-primary-500/35 hover:bg-primary-50 hover:text-primary-600 hover:ring-primary-100/70 dark:border-primary-400/20 dark:text-primary-300 dark:hover:bg-primary-400/10 dark:hover:ring-primary-400/10"
          >
            수정
          </Button>
          <Button
            type="button"
            fullWidth={false}
            onClick={() => router.push(`/posts/${mid}/${slug}/delete`)}
            className="min-w-20 border-red-500/20 !px-5 !py-2 text-red-500 hover:bg-red-500/5 hover:ring-red-100/70 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-400/10 dark:hover:ring-red-400/10"
          >
            삭제
          </Button>
        </>
      )}
    </div>
  );
};

export default ReadActions;

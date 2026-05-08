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
    <div className="flex justify-end gap-2 mx-auto max-w-screen-md py-8">
      <Button
        type="button"
        fullWidth={false}
        onClick={() => router.push(`/posts/${mid}`)}
        className=" !bg-gray-50 !py-1.5 !px-6 !border-gray-100 !text-gray-800 hover:!bg-gray-100"
      >
        목록
      </Button>

      {canEdit && (
        <>
          <Button
            type="button"
            fullWidth={false}
            onClick={() => router.push(`/posts/${mid}/${slug}/edit`)}
            className=" !bg-blue-50 !py-1.5 !px-6 !border-blue-100 !text-blue-600 hover:!bg-blue-600 hover:!text-white transition-all"
          >
            수정
          </Button>
          <Button
            type="button"
            fullWidth={false}
            onClick={() => router.push(`/posts/${mid}/${slug}/delete`)}
            className=" !bg-red-50 !py-1.5 !px-6 !border-red-100 !text-red-500 hover:!bg-red-600 hover:!text-white transition-all"
          >
            삭제
          </Button>
        </>
      )}
    </div>
  );
};

export default ReadActions;

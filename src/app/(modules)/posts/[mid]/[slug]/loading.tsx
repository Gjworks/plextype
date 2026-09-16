import ReadLoading, { CommentsLoading } from "@/modules/posts/tpl/default/readLoading";

export default function Loading() {
  return <div className="mx-auto w-full max-w-screen-xl"><ReadLoading /><CommentsLoading /></div>;
}

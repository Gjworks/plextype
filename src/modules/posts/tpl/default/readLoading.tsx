const bar = "rounded bg-gray-100 dark:bg-dark-800";

export function CommentsLoading() {
  return <div role="status" aria-label="댓글을 불러오는 중" className="mx-auto w-full max-w-screen-md px-3 py-8">
    <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
      <div className={`${bar} h-5 w-24`} />
      <div className={`${bar} h-24 w-full`} />
    </div>
    <span className="sr-only">댓글을 불러오는 중입니다.</span>
  </div>;
}

export default function ReadLoading() {
  return <div role="status" aria-label="게시글을 불러오는 중" className="mx-auto min-h-[70svh] w-full max-w-screen-md px-3 pb-8 pt-10">
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="space-y-3 py-12">
        <div className={`${bar} mx-auto h-9 w-4/5`} />
        <div className={`${bar} mx-auto h-9 w-1/2`} />
      </div>
      <div className="mb-6 flex justify-center gap-3"><div className={`${bar} h-4 w-20`} /><div className={`${bar} h-4 w-24`} /></div>
      <div className="border-y border-gray-100 py-3 dark:border-dark-800"><div className={`${bar} h-5 w-40`} /></div>
      <div className="space-y-4 py-10">
        {["w-full", "w-full", "w-4/5", "w-full", "w-full", "w-3/5"].map((width, index) => <div key={index} className={`${bar} h-4 ${width}`} />)}
        <div className={`${bar} !mt-8 h-36 w-full`} />
      </div>
    </div>
    <span className="sr-only">게시글을 불러오는 중입니다.</span>
  </div>;
}

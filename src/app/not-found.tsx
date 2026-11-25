import Link from "next/link";

const NotFound = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-20 text-gray-950 dark:bg-dark-950 dark:text-white">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="select-none text-[58vw] font-semibold leading-none tracking-normal text-gray-100 dark:text-white/[0.045] md:text-[52vw] lg:text-[34rem]">
          404
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
        <div className="max-w-md">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-dark-400">
            Not found
          </div>
          <h1 className="mt-4 text-2xl font-medium tracking-normal md:text-3xl">
            페이지를 찾을 수 없습니다.
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-dark-300">
            주소가 바뀌었거나 존재하지 않는 페이지입니다. 홈으로 이동한 뒤 다시 확인해주세요.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFound;

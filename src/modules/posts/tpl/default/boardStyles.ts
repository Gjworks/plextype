// 기본 게시판 스킨(목록·본문·글쓰기)이 함께 쓰는 모양. 표 위쪽의 굵은 선과 각진 버튼이 스킨의 기준이다.
export const boardTopLine = "border-t-2 border-gray-900 dark:border-dark-200";
export const boardRowLine = "border-b border-gray-200 dark:border-dark-800";
export const boardLabelCell = "bg-gray-50 text-[13px] font-medium text-gray-700 dark:bg-dark-900 dark:text-dark-200";

const buttonBase = "inline-flex h-9 min-w-16 items-center justify-center gap-1.5 rounded-sm border px-4 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-50";
export const boardButton = `${buttonBase} border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:text-gray-950 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-200 dark:hover:border-dark-500 dark:hover:text-white`;
export const boardPrimaryButton = `${buttonBase} border-gray-900 bg-gray-900 text-white hover:bg-gray-700 dark:border-dark-100 dark:bg-dark-100 dark:text-dark-950 dark:hover:bg-white`;
export const boardDangerButton = `${buttonBase} border-gray-300 bg-white text-red-600 hover:border-red-400 dark:border-dark-700 dark:bg-dark-900 dark:text-red-300 dark:hover:border-red-400/60`;

// 에디터와 첨부 상자는 여러 스킨이 함께 쓰는 컴포넌트라 그림자를 갖고 있다. 선으로만 구분하는 기본 스킨 안에서는 그림자를 끈다.
export const boardFlat = "[&_*]:!shadow-none";

export const boardInput = "h-10 w-full rounded-sm border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 dark:border-dark-700 dark:bg-dark-950 dark:text-dark-100 dark:placeholder:text-dark-500 dark:focus:border-dark-200";

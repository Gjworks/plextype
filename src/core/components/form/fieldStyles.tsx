// 코어 입력 컴포넌트(ComboboxField, MultiComboboxField, DateField, TextareaField)가 함께 쓰는 테두리·아이콘 스타일.
// InputField와 같은 톤을 유지한다.

export const fieldBoxClass = ({ disabled, hasError }: { disabled?: boolean; hasError?: boolean }) =>
  "group flex w-full items-center rounded-lg border transition-colors duration-200 " +
  (disabled
    ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-70 dark:border-white/10 dark:bg-white/[0.03] "
    : hasError
      ? "border-red-400 bg-white hover:border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/15 dark:border-red-400/70 dark:bg-white/[0.09] dark:focus-within:border-red-400 dark:focus-within:ring-red-500/20 "
      : "border-gray-300 bg-white hover:border-gray-400 focus-within:border-gray-950 focus-within:ring-4 focus-within:ring-gray-950/10 dark:border-white/25 dark:bg-white/[0.09] dark:hover:border-white/40 dark:focus-within:border-white/80 dark:focus-within:ring-white/10 ");

export const fieldIconClass = (disabled?: boolean) =>
  disabled
    ? "text-gray-300 dark:text-dark-500"
    : "text-gray-400 group-focus-within:text-gray-950 dark:text-dark-400 dark:group-focus-within:text-white";

export const fieldLabelClass = (disabled?: boolean) =>
  `mb-2 block text-sm font-medium ${disabled ? "text-gray-400 dark:text-dark-500" : "text-black dark:text-dark-200"}`;

// 띄우는 목록·달력 패널 공통 스타일. Modal(z-[120])보다 위에 보이도록 z-[130]을 쓴다.
export const floatingPanelClass =
  "fixed z-[130] rounded-lg border border-gray-200 bg-white shadow-xl shadow-gray-950/10 dark:border-dark-700 dark:bg-dark-900 dark:shadow-black/40";

// 띄어쓰기와 대소문자를 무시하고 비교한다. "objectivec"으로 "Objective C"를 찾을 수 있다.
export const normalizeSearchText = (text: string) => text.replace(/\s+/g, "").toLowerCase();

export const FieldError = ({ id, error }: { id: string; error?: string }) =>
  error ? (
    <div id={id} className="mt-1.5 text-xs leading-5 text-red-500">
      {error}
    </div>
  ) : null;

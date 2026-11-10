import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

type AlertType = "success" | "info" | "warning" | "error";

type AlertProps = {
  message?: string | null;
  // 서버 액션 응답의 type을 그대로 넘겨도 되도록 string을 받는다. 알 수 없는 값은 info로 보여준다.
  type?: AlertType | string | null;
  title?: string;
  className?: string;
};

const tones: Record<AlertType, { box: string; icon: string; Icon: typeof Info }> = {
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
  info: {
    box: "border-gray-200 bg-gray-50 text-gray-800 dark:border-dark-700 dark:bg-dark-800/60 dark:text-dark-100",
    icon: "text-gray-500 dark:text-dark-300",
    Icon: Info,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
    Icon: XCircle,
  },
};

/**
 * 화면에 남아 있어야 하는 안내 문구. 특정 입력칸에 붙일 수 없는 작업 결과나 권한·시스템 안내에 쓴다.
 * 입력값 오류는 각 필드의 error로, 잠깐 알리고 사라질 결과는 toast로 보여준다.
 */
const Alert = ({ message, type, title, className = "" }: AlertProps) => {
  if (!message && !title) return null;

  const key: AlertType = type && type in tones ? (type as AlertType) : "info";
  const { box, icon, Icon } = tones[key];

  return (
    <div className="py-2">
      <div
        role={key === "error" || key === "warning" ? "alert" : "status"}
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-6 ${box} ${className}`}
      >
        <Icon size={18} strokeWidth={2} className={`mt-[3px] shrink-0 ${icon}`} aria-hidden="true" />
        <div className="min-w-0">
          {title && <div className="font-semibold">{title}</div>}
          {message && <div className={title ? "opacity-80" : ""}>{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default Alert;

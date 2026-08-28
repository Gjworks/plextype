"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, RotateCcw, ShieldAlert } from "lucide-react";

import Button from "@components/button/Button";
import { unlockLoginUserAdminAction, type LoginLockInfo } from "@/modules/user/actions/user.action";
import { formatKstShortDateTime } from "@/core/utils/date/kst";
import { UserAdminTabs } from "./adminTabs";

type Props = {
  items: LoginLockInfo[];
};

const formatDate = (date: string) => {
  return formatKstShortDateTime(date);
};

const formatSeconds = (seconds: number) => {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes > 0 ? `${hours}시간 ${restMinutes}분` : `${hours}시간`;
};

const LoginLockList = ({ items }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUnlock = (lockId: string) => {
    if (!window.confirm("선택한 로그인 잠금을 해제하시겠습니까?")) return;

    startTransition(async () => {
      const result = await unlockLoginUserAdminAction(lockId);
      alert(result.message);
      if (result.success) router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
        <UserAdminTabs activePath="/admin/user/login-locks" />

        <div className="flex flex-col gap-4 px-5 py-7 xl:flex-row xl:items-end xl:justify-between md:px-8">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
              <ShieldAlert size={13} />
              User Security
            </div>
            <div className="mt-2 text-lg font-semibold text-gray-700 dark:text-dark-100">로그인 잠금</div>
            <div className="mt-1 text-sm text-gray-400">
              로그인 실패 제한에 걸린 계정과 IP 조합을 확인하고 즉시 해제할 수 있습니다.
            </div>
          </div>

          <Button
            type="button"
            onClick={() => router.refresh()}
            fullWidth={false}
            icon={<RotateCcw size={14} />}
          >
            새로고침
          </Button>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 dark:border-dark-800 dark:bg-dark-950/70">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Account</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">IP</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Locked</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Expires</th>
                <th className="w-32 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-primary-50/30 dark:border-dark-800 dark:hover:bg-white/[0.04]">
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">{item.accountId}</div>
                      <div className="mt-1 max-w-[220px] truncate text-[11px] font-medium text-gray-300">{item.id}</div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-500 dark:text-dark-300">{item.ip}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-dark-300">{formatDate(item.lockedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-700 dark:text-dark-200">{formatDate(item.expiresAt)}</div>
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-500">
                        <LockKeyhole size={11} />
                        남은 시간 {formatSeconds(item.retryAfter)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleUnlock(item.id)}
                        disabled={isPending}
                        className="inline-flex cursor-pointer items-center justify-center rounded-md bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-dark-800 dark:text-dark-300"
                      >
                        해제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                    현재 로그인 잠금 상태인 계정이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoginLockList;

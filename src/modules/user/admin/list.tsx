"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit3, Plus, Search, Trash2, UsersRound } from "lucide-react";

import { UserInfo, UserListResponseData } from "@/modules/user/actions/_type";
import { removeUserAction } from "@/modules/user/actions/user.action";
import PageNavigation from "@components/nav/PageNavigation";
import Button from "@components/button/Button";

type Props = {
  initialUserList: UserInfo[];
  initialNavigation: UserListResponseData["navigation"];
};

const checkboxClass =
  "h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500";

const AdminUserList = ({ initialUserList, initialNavigation }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const allChecked = initialUserList.length > 0 && selectedIds.length === initialUserList.length;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const target = formData.get("target") as string;
    const keyword = formData.get("keyword") as string;

    router.push(`?page=1&target=${target}&keyword=${keyword}`);
  };

  const handleCheck = (id: number, isChecked: boolean) => {
    setSelectedIds((prev) =>
      isChecked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id),
    );
  };

  const handleCheckAll = (isChecked: boolean) => {
    setSelectedIds(isChecked ? initialUserList.map((user) => user.id) : []);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("삭제할 회원을 선택해주세요.");
      return;
    }

    if (!window.confirm(`선택하신 ${selectedIds.length}명의 회원을 정말 삭제하시겠습니까?`)) return;

    startTransition(async () => {
      try {
        const results = await Promise.all(selectedIds.map((id) => removeUserAction(id)));
        const hasError = results.some((res) => !res.success);

        alert(hasError ? "일부 회원 삭제 중 오류가 발생했습니다." : "성공적으로 삭제되었습니다.");
        setSelectedIds([]);
        router.refresh();
      } catch {
        alert("서버 통신 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
            <UsersRound size={13} />
            User Control
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-700">회원 목록</div>
          <div className="mt-1 text-sm text-gray-400">
            전체 {initialNavigation.totalCount}명 중 {initialUserList.length}명을 표시하고 있습니다.
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center rounded-md border border-gray-200 bg-white px-3 shadow-sm shadow-gray-100 xl:w-[420px] xl:flex-none">
            <select
              name="target"
              defaultValue={searchParams.get("target") || "accountId"}
              className="shrink-0 bg-transparent py-2.5 pr-3 text-sm text-gray-500 outline-none"
            >
              <option value="accountId">아이디</option>
              <option value="nickName">닉네임</option>
              <option value="email_address">이메일</option>
            </select>
            <div className="h-4 w-px bg-gray-200" />
            <input
              type="text"
              name="keyword"
              defaultValue={searchParams.get("keyword") || ""}
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-300"
              placeholder="검색어 입력"
            />
            <button type="submit" className="cursor-pointer text-gray-400 transition-colors hover:text-gray-900" aria-label="검색">
              <Search size={17} />
            </button>
          </form>

          <Link href="/admin/user/create" className="inline-flex w-auto items-center justify-center gap-2 rounded bg-blue-100 px-5 py-2 text-xs font-medium text-blue-500 transition-colors duration-200 hover:bg-blue-600 hover:text-white">
            <Plus size={15} />
            회원추가
          </Link>
          <Button
            type="button"
            onClick={handleDelete}
            isLoading={isPending}
            disabled={selectedIds.length === 0 || isPending}
            fullWidth={false}
            icon={<Trash2 size={14} />}
          >
            삭제
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm shadow-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="w-16 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Account</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Nickname</th>
                <th className="w-28 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Edit</th>
                <th className="w-14 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={allChecked}
                    onChange={(e) => handleCheckAll(e.target.checked)}
                    aria-label="전체 선택"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {initialUserList.length > 0 ? (
                initialUserList.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-blue-50/40">
                    <td className="px-4 py-4 text-sm font-medium text-gray-400">{item.id}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-800">{item.accountId}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{item.email_address}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{item.nickName}</td>
                    <td className="px-4 py-4 text-center">
                      <Link href={`/admin/user/update/${item.id}`} className="inline-flex items-center justify-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-900 hover:text-white">
                        <Edit3 size={13} />
                        수정
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleCheck(item.id, e.target.checked)}
                        aria-label={`${item.accountId} 선택`}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">조회된 회원이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {initialNavigation.totalPages > 0 && (
        <div className="mt-6 flex justify-center">
          <PageNavigation page={initialNavigation.page} totalPages={initialNavigation.totalPages} />
        </div>
      )}
    </div>
  );
};

export default AdminUserList;

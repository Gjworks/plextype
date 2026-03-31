// src/app/(extentions)/admin/user/list/list.tsx (또는 index.tsx)
"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { UserInfo, UserListResponseData } from "@modules/user/_actions/_type";
import PageNavigation from "@components/nav/PageNavigation";
// 💡 검색 기능을 위해 라우터 추가
import { useRouter, useSearchParams } from "next/navigation";
import { removeUser } from "@modules/user/_actions/user.action";

import Button from "@components/button/Button"

type Props = {
  initialUserList: UserInfo[];
  initialNavigation: UserListResponseData["navigation"];
};

const AdminUserList = ({ initialUserList, initialNavigation }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 💡 2. 체크된 회원들의 ID를 담아둘 상태(State)와 로딩 상태 추가
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const target = formData.get("target") as string;
    const keyword = formData.get("keyword") as string;

    router.push(`?page=1&target=${target}&keyword=${keyword}`);
  };

  // 💡 3. 개별 체크박스 클릭 핸들러
  const handleCheck = (id: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedIds((prev) => [...prev, id]); // 체크하면 배열에 추가
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id)); // 해제하면 배열에서 제거
    }
  };

  // 💡 4. 전체 선택/해제 핸들러 (보너스 기능!)
  const handleCheckAll = (isChecked: boolean) => {
    if (isChecked) {
      // 현재 페이지의 모든 회원 ID를 배열에 넣음
      setSelectedIds(initialUserList.map((user) => user.id));
    } else {
      setSelectedIds([]); // 싹 비움
    }
  };

  // 💡 5. 삭제 버튼 클릭 핸들러
  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("삭제할 회원을 선택해주세요.");
      return;
    }

    if (!window.confirm(`선택하신 ${selectedIds.length}명의 회원을 정말 삭제하시겠습니까?`)) {
      return;
    }

    // 서버 통신 시작
    startTransition(async () => {
      try {
        // 🌟 Promise.all을 사용해 여러 개의 삭제 액션을 동시에 실행!
        const deletePromises = selectedIds.map((id) => removeUser(id));
        const results = await Promise.all(deletePromises);

        // 혹시라도 실패한 건이 있는지 확인
        const hasError = results.some((res) => !res.success);

        if (hasError) {
          alert("일부 회원 삭제 중 오류가 발생했습니다.");
        } else {
          alert("성공적으로 삭제되었습니다.");
        }

        setSelectedIds([]); // 삭제 완료 후 체크박스 초기화
        router.refresh(); // 화면 새로고침 (DB에서 다시 가져옴)
      } catch (error) {
        alert("서버 통신 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="">
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <div className="text-gray-700 text-lg font-semibold">
          회원 목록 ({initialNavigation.totalCount}명)
        </div>
        <div className="flex-1"></div>

        {/* 💡 검색 폼 추가 */}
        <div className="flex items-center w-full lg:w-auto">
          <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-md overflow-hidden w-full lg:w-auto px-3">
            <select name="target" defaultValue={searchParams.get("target") || "accountId"} className="bg-transparent py-2 text-slate-600 px-3 outline-none text-sm rounded-md">
              <option value="email_address">이메일</option>
              <option value="nickName">닉네임</option>
              <option value="accountId">아이디</option>
            </select>
            <input
              type="text"
              name="keyword"
              defaultValue={searchParams.get("keyword") || ""}
              className="bg-transparent py-2 text-gray-600 px-3 outline-none text-sm w-full lg:w-44"
              placeholder="검색어 입력"
            />
            <button type="submit" className="hover:text-black text-gray-500 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="">
        <table className="w-full">
          {/* ... (thead 부분은 기존과 완벽히 동일하므로 생략) ... */}
          <tbody>
          {initialUserList.length > 0 ? (
            initialUserList.map((item, index) => (
              <tr key={index} className="border-b border-slate-200 hover:bg-slate-200 hover:bg-opacity-50 odd:bg-white even:bg-gray-50">
                <td className="text-gray-500 text-sm py-3 px-3 text-center">{item.id}</td>
                <td className="text-gray-500 text-sm py-3 px-3">{item.accountId}</td>
                <td className="text-gray-500 text-sm py-3 px-3">{item.email_address}</td>
                <td className="text-gray-500 text-sm py-3 px-3 text-center">{item.nickName}</td>
                <td className="text-gray-500 text-sm py-3 px-3 text-center"></td>
                <td className="text-gray-500 text-sm py-3 px-3 text-center">
                  <Link href={`/admin/user/update/${item.id}`} className="text-cyan-500 underline">
                    조회/수정
                  </Link>
                </td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    className="checked:bg-lime-400"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => handleCheck(item.id, e.target.checked)}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="py-10 text-center text-gray-500">조회된 회원이 없습니다.</td>
            </tr>
          )}
          </tbody>
        </table>
      </div>

      {/* 하단 버튼 및 페이지네이션 */}
      <div className="grid grid-cols-2 gap-8 py-5">
        <div className="col-span-2 xl:col-span-1 flex items-center justify-center xl:justify-start"></div>
        <div className="col-span-2 xl:col-span-1 flex items-center justify-end gap-2 ">
          <Link className="py-2 px-5 text-blue-500 hover:text-white rounded text-xs bg-blue-100 hover:bg-blue-600" href="/admin/user/create">
            회원추가
          </Link>
          <Button
            type="button" // form submit이 아니므로 명시해줍니다.
            onClick={handleDelete}
            isLoading={isPending} // 통신 중일 때 스피너 돌고 클릭 방지!
            disabled={selectedIds.length === 0 || isPending} // 리스트가 비어있으면 클릭 불가
            fullWidth={false} // 버튼이 꽉 차지 않고 내용물 크기만 차지하게 설정

          >
            삭제
          </Button>
        </div>
      </div>

      {initialNavigation.totalPages > 0 && (
        <div className="flex justify-center mt-4">
          <PageNavigation page={initialNavigation.page} totalPages={initialNavigation.totalPages} />
        </div>
      )}
    </div>
  );
};

export default AdminUserList;
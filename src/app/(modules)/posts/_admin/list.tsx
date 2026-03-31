"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import dayjs from "dayjs";
import {removePostsAction} from "@modules/posts/_actions/posts.action"
import relativeTime from "dayjs/plugin/relativeTime";

import PageNavigation from "@components/nav/PageNavigation";
import Alert from "@components/message/Alert";
import Button from "@components/button/Button";

interface PostListInfo {
  id: number;
  mid: string;
  moduleName: string;
  moduleDesc: string;
  config: object;
  status: string;
  createdAt: string;
}
interface PageNavigationInfo {
  totalCount: number;
  totalPages: number;
  page: number;
  listCount: number;
}

dayjs.extend(relativeTime);
dayjs.locale("ko");

const AdminPostsList = ({ initialData, pagination }) => {
  const params = useSearchParams();
  const pathname = usePathname();
  const [postList, setPostList] = useState<PostListInfo[]>([]);
  const [page, setPage] = useState<number>(Number(params.get("page")) || 1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    type: string | null;
    message: string | null;
  } | null>(null);
  const [pageNavigation, setPageNavigation] = useState<PageNavigationInfo>(pagination);

  useEffect(() => {
    const newPage = Number(params.get("page")) || 1;
    setPage(newPage);
  }, [pathname, params]);

  const getRelativeTime = (date: string) => {
    return dayjs(date).fromNow();
  };

  const handleCheck = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (pagination) {
      setPageNavigation(pagination);
    }
  }, [pagination]);

  const handleAllCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = initialData.map((item: any) => item.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  // 삭제 실행 핸들러
  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`${selectedIds.length}개의 게시판을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await removePostsAction(selectedIds, "/admin/posts/list");

      if (res.success) {
        alert(res.message);
        setSelectedIds([]); // 선택 초기화
      } else {
        setError({ type: "error", message: res.message });
      }
    } catch (err) {
      setError({ type: "error", message: "시스템 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

        {error && <Alert message={error.message} type={error.type} />}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="text-gray-700 text-lg font-semibold">
            모듈 목록 ({pageNavigation.totalCount})
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center w-full lg:w-auto">
            <div className="flex items-center bg-gray-100 rounded-md overflow-hidden w-full lg:w-auto px-3">
              <select className="bg-transparent py-2 text-slate-600 px-3 outline-none text-sm rounded-md">
                <option value="">이메일</option>
                <option value="">닉네임</option>
              </select>
              <input
                type="text"
                className="bg-transparent py-2 text-gray-200 px-3 outline-none text-sm w-full lg:w-44"
              ></input>
              <button className="hover:text-white text-gray-200 rounded-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-200 bg-opacity-50 backdrop-blur-lg">
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3"
                >
                  No
                </th>
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3 text-left"
                >
                  모듈ID
                </th>
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3"
                >
                  게시판이름
                </th>
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3"
                >
                  등록일
                </th>
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3"
                >
                  편집
                </th>
                <th className="py-2 px-3 w-12">
                  <input
                    type="checkbox"
                    onChange={handleAllCheck}
                    checked={selectedIds.length === initialData?.length && initialData?.length > 0}
                    className="checked:bg-lime-400"
                  ></input>
                </th>
              </tr>
            </thead>
            <tbody>
              {initialData &&
                initialData?.map((item, index) => {
                  const timeAgo = getRelativeTime(item.createdAt);
                  return (
                    <tr
                      key={index}
                      className="border-b border-slate-200 hover:bg-slate-200 hover:bg-opacity-50 odd:bg-white even:bg-gray-50"
                    >
                      <td className="text-gray-500 text-sm py-3 px-3 text-center">
                        {item.id - 1}
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3">
                        {item.mid}
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3 text-center">
                        {item.moduleName}
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3 text-center">
                        {timeAgo}
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3 text-center">
                        <Link
                          href={`/admin/posts/${item.id}/update`}
                          className="text-cyan-500 underline"
                        >
                          조회/수정
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleCheck(item.id)}
                          className="checked:bg-lime-400"
                        ></input>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-8 py-5">
          <div className="col-span-2 xl:col-span-1 flex items-center justify-center xl:justify-start">
          </div>
          <div className="col-span-2 xl:col-span-1 flex items-center justify-end">
            <div className="flex items-center justify-end gap-2">
              {/* 1. 게시판 추가 (Link 연동) */}
              <Link href="/admin/posts/create">
                <Button
                  type="button"
                  className="!text-blue-500 hover:!text-white !bg-blue-100 hover:!bg-blue-600"
                >
                  추가
                </Button>
              </Link>

              {/* 2. 선택 삭제 (공통 컴포넌트 활용) */}
              <Button
                type="button"
                onClick={handleDelete}
                isLoading={loading} // 💡 로딩 상태를 컴포넌트가 직접 관리
                disabled={selectedIds.length === 0}
              >
                선택 삭제
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <PageNavigation {...pageNavigation} />
        </div>
    </>
  );
};

export default AdminPostsList;

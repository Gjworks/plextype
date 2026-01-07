"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { getUserList } from "@/extentions/user/scripts/userModel";
import PageNavigation from "@plextype/components/nav/PageNavigation";
import DefaultNav from "@plextype/components/nav/DefaultNav";

interface PageNavigationInfo {
  totalCount: number;
  totalPages: number;
  page: number;
  listCount: number;
}

const DashboardUserList = () => {
  const params = useSearchParams();
  const pathname = usePathname();
  const [userList, setUserList] = useState<{ [key: string]: any }>();
  const [page, setPage] = useState<number>(Number(params.get("page")) || 1);
  const [pageNavigation, setPageNavigation] = useState<PageNavigationInfo>({
    totalCount: 0,
    totalPages: 0,
    page: 1,
    listCount: 0,
  });
  const [userNav, setUserNav] = useState<object>([
    {
      title: "회원목록",
      route: "/dashboard/user/list",
    },
    {
      title: "그룹별 회원 목록",
      route: "/dashboard/user/groupUserlist",
    },
    {
      title: "관리자계정",
      route: "/dashboard/user/adminUserlist",
    },
  ]);

  useEffect(() => {
    const newPage = Number(params.get("page")) || 1;
    setPage(newPage);
  }, [pathname, params]);

  let items;
  const fetchData = useCallback(
    async ({
      page,
      target,
      keyword,
    }: {
      page: number | null;
      target: string | null;
      keyword: string | null;
    }) => {
      // 페이지가 null인 경우 1로 설정
      const currentPage = page ?? 1;
      const items = await getUserList({ page: currentPage, target, keyword });
      setUserList(items.userList);
      setPageNavigation({
        totalCount: items.navigation.totalCount,
        totalPages: items.navigation.totalPages,
        page: currentPage, // 현재 페이지가 null이 아니도록 처리
        listCount: items.navigation.listCount,
      });
    },
    [],
  );

  useEffect(() => {
    const data = {
      page: page,
      target: params.get("target") as string | null,
      keyword: params.get("keyword") as string | null,
    };
    fetchData(data);
  }, [page, params, fetchData]);

  return (
    <>
      <div className="">
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="text-gray-700 text-lg font-semibold">
            회원 목록 ({pageNavigation.totalCount}명)
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
                  className="text-xs text-gray-600 uppercase py-2 px-3 w-32"
                >
                  No
                </th>
                <th
                  scope="col"
                  className="w-auto text-xs text-gray-600 uppercase py-2 px-3 text-left"
                >
                  회원아이디
                </th>
                <th
                  scope="col"
                  className="w-auto text-xs text-gray-600 uppercase py-2 px-3 text-left"
                >
                  이메일
                </th>
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3 w-32"
                >
                  닉네임
                </th>
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3 w-32"
                >
                  그룹
                </th>
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3 w-32"
                >
                  최근접속일
                </th>
                <th
                  scope="col"
                  className="text-xs text-gray-600 uppercase py-2 px-3 w-32"
                >
                  조회/수정
                </th>
                <th className="py-2 px-3 w-12">
                  <input
                    type="checkbox"
                    className="checked:bg-lime-400"
                  ></input>
                </th>
              </tr>
            </thead>
            <tbody>
              {userList &&
                userList.map((item, index) => {
                  return (
                    <tr
                      key={index}
                      className="border-b border-slate-200 hover:bg-slate-200 hover:bg-opacity-50 odd:bg-white even:bg-gray-50"
                    >
                      <td className="text-gray-500 text-sm py-3 px-3 text-center">
                        {item.id - 1}
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3">
                        {item.accountId}
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3">
                        {item.email_address}
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3 text-center">
                        {item.nickName}
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3 text-center">
                        준회원
                      </td>
                      <td className="text-gray-500 text-sm py-3 px-3 text-center"></td>
                      <td className="text-gray-500 text-sm py-3 px-3 text-center">
                        <Link
                          href={`/dashboard/user/update/${item.id}`}
                          className="text-cyan-500 underline"
                        >
                          조회/수정
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
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
          <div className="col-span-2 xl:col-span-1 flex items-center justify-end gap-2 ">
            <Link
              className="py-2 px-5 text-white rounded text-sm bg-orange-500 hover:bg-orange-600"
              href="/dashboard/user/create"
            >
              회원추가
            </Link>
            <button
              className="py-2 px-5 text-white rounded text-sm bg-gray-800 hover:bg-red-600"
              // href="/dashboard/user/delete"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardUserList;

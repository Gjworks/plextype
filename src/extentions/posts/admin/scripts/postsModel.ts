"use server";

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { PrismaClient } from "@prisma/client";
import { parse } from "path";

import { getGroupList } from "@/extentions/user/scripts/groupModel";

interface PostsParams {
  id?: number | null;
}

interface LoggedParams {
  email: string;
  isAdmin?: boolean;
}

const prisma = new PrismaClient();

export const getPost = async (params: PostsParams) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  let response;
  let postInfo;
  let loggedInfo: LoggedParams = {
    email: "",
    isAdmin: false,
  };

  if (!accessToken) {
    return (response = {
      success: true,
      type: "error",
      message: "accessToken is required.",
      data: {},
    });
  }

  const decodeToken: { id: string; isAdmin: boolean } =
    await decodeJwt(accessToken);
  loggedInfo.email = decodeToken.id;
  loggedInfo.isAdmin = decodeToken.isAdmin;

  try {
    let postId = Number(params.id);
    console.log(typeof params.id);
    if (!isNaN(postId) && typeof postId === "number") {
      postInfo = await prisma.posts.findUnique({
        where: {
          id: postId,
        },
      });
    }

    const groupList = await getGroupList();
    console.log(groupList);

    postInfo.grant = groupList;
    response = {
      success: true,
      type: "success",
      message: "게시판 정보를 불러 왔습니다.",
      data: {
        postInfo: postInfo,
      },
    };
  } catch (e) {
    console.log("getUser error" + e);
    response = {
      success: true,
      type: "error",
      message: "게시판 정보를 불러 오는데 실패 했습니다.",
      data: {},
    };
  }
  return response;
};

export const getPostList = async (params) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  let response;
  let postList;
  let loggedInfo: LoggedParams = {
    email: "",
    isAdmin: false,
  };

  const { page, target, keyword } = params;

  const currentPage = page; // 현재 페이지
  const listCount = 20; // 페이지당 항목 수
  const skipAmount = currentPage && (currentPage - 1) * listCount;

  const totalItems = await prisma.posts.count();
  console.log("totalItems", totalItems);
  const totalPages = Math.ceil(totalItems / listCount);

  const where: any = {};
  if (target && keyword) {
    where[target as string] = { contains: keyword };
  }

  if (!accessToken) {
    return (response = {
      success: true,
      type: "error",
      message: "accessToken is required.",
      data: {},
    });
  }

  const decodeToken: { id: string; isAdmin: boolean } =
    await decodeJwt(accessToken);
  loggedInfo.email = decodeToken.id;
  loggedInfo.isAdmin = decodeToken.isAdmin;

  try {
    postList = await prisma.posts.findMany({
      skip: skipAmount && skipAmount >= 0 ? skipAmount : 0,
      take: listCount,
      where,
      orderBy: {
        id: "desc",
      },
    });
  } catch (e) {
    console.log("getUser error" + e);
    response = {
      success: true,
      type: "error",
      message: "회원정보가 없습니다.",
      data: {},
    };
  }

  const returnData = {
    success: true,
    type: "success",
    data: {
      postList: postList,
      navigation: {
        totalCount: totalItems,
        totalPages: totalPages,
        page: currentPage,
        listCount: listCount,
      },
    },
  };

  return returnData;
};

export const getDocument = async (params) => {
  let response;

  return response;
};

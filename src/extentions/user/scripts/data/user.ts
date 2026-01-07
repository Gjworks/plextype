"use server";

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { PrismaClient } from "@prisma/client";

interface UserListParams {
  page: number | null;
  keyword: string | null;
  target: string | null;
}

interface UserParams {
  id?: number | null;
  uuid?: string | null;
}

interface LoggedParams {
  id: number;
  accountId: string;
  isAdmin?: boolean;
}

interface UserSessionResponse {
  success: boolean;
  data: UserInfo | null;
  type?: string;
  message?: string;
}

const prisma = new PrismaClient();

export const getUserLogged = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  let tokenInfo: LoggedParams = {
    id: 0,
    accountId: "",
    isAdmin: false,
  };
  if (accessToken) {
    const decodeToken: { id: number; accountId: string; isAdmin: boolean } =
      await decodeJwt(accessToken);
    tokenInfo.accountId = decodeToken.accountId;
    tokenInfo.id = decodeToken.id;
    tokenInfo.isAdmin = decodeToken.isAdmin;
  }
  return tokenInfo;
};

export const getUserSession = async (): Promise<UserSessionResponse> => {
  const tokenInfo = await getUserLogged();

  let userInfo: UserInfo | null = null;
  let response: UserSessionResponse;
  console.log("tokenInfo", tokenInfo);
  if (tokenInfo) {
    try {
      const userInfo = await prisma.user.findUnique({
        where: { accountId: tokenInfo.accountId },
        include: {
          userGroups: {
            include: {
              group: {
                include: {
                  users: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      console.log(userInfo);
      response = {
        success: true,
        data: userInfo,
      };
    } catch (e) {
      console.log("getUser error" + e);
      response = {
        success: true,
        type: "error",
        message: "회원정보가 없습니다.",
        data: null,
      };
    }
  } else {
    response = {
      success: true,
      type: "error",
      message: "토큰 정보가 올바르지 않습니다.",
      data: null,
    };
  }

  console.log("response", response);
  return response;
};

export const getUser = async (params: UserParams) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  let obj: any = {};
  let loggedInfo: LoggedParams = {
    id: 0,
    accountId: "",
  };
  let userInfo: any = null;
  let response = {};
  if (accessToken) {
    const decodeToken: { id: number; accountid: string; isAdmin: boolean } =
      await decodeJwt(accessToken);
    loggedInfo.accountId = decodeToken.accountid;
  }
  params.id && (obj.id = params.id);
  params.uuid && (obj.uuid = params.uuid).trim();

  if (!obj.id && !obj.uuid && !obj.nickname && !obj.accountId) {
    obj.accountId = loggedInfo.accountId;
  }
  if (!obj) {
    return (response = {
      success: true,
      type: "error",
      message: "데이터가 없습니다.",
      data: {},
    });
  }
  try {
    if (obj.id || obj.uuid) {
      userInfo = await prisma.user.findUnique({
        where: obj,
        include: {
          userGroups: {
            include: {
              group: true,
            },
          },
        },
      });
    }
  } catch (e) {
    console.log("getUser error:", e);
    return {
      success: false,
      type: "error",
      message: "회원정보가 없습니다.",
      data: {},
    };
  }
  return (
    userInfo || { success: false, message: "회원정보가 없습니다.", data: {} }
  );
};

export const getUserList = async (params: UserListParams) => {
  const { page, target, keyword } = params;

  const currentPage = page; // 현재 페이지
  const listCount = 20; // 페이지당 항목 수
  const skipAmount = currentPage && (currentPage - 1) * listCount;

  const totalItems = await prisma.user.count();
  const totalPages = Math.ceil(totalItems / listCount);

  const where: any = {};
  if (target && keyword) {
    where[target as string] = { contains: keyword };
  }

  const userList = await prisma.user.findMany({
    skip: skipAmount && skipAmount >= 0 ? skipAmount : 0,
    take: listCount,
    where,
    orderBy: {
      id: "desc",
    },
  });
  const returnData = {
    userList: userList,
    navigation: {
      totalCount: totalItems,
      totalPages: totalPages,
      page: currentPage,
      listCount: listCount,
    },
  };
  // const result = await userList?.json()
  return returnData;
};

export const getUserById = async (id: number) => {
  try {
    const userInfo = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!userInfo) {
      return false;
    }

    return userInfo;
  } catch (e) {}
};

export const getUserByAccountId = async (accountId: string) => {
  let userInfo;
  let response;
  try {
    console.log(accountId);
    userInfo = await prisma.user.findUnique({
      where: { accountId: accountId },
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
  response = userInfo;
  return response;
};

export const getUserByNickname = async (nickName: string) => {
  let userInfo;
  let response;
  try {
    userInfo = await prisma.user.findUnique({
      where: { nickName: nickName },
    });
  } catch (e) {
    console.log("getUser error" + e);
    response = {
      success: true,
      code: "error",
      message: "회원정보가 없습니다.",
      data: {},
    };
  }
  response = userInfo;
  return response;
};

export const getUserByToken = async (token) => {
  let userInfo;
  let response;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    response = NextResponse.json(
      {
        success: true,
        type: "error",
        message: "accessToken Error",
        data: {},
      },
      {
        status: 200,
      },
    );
  } else {
    const decodeToken: { id: string; accountId: string; isAdmin: boolean } =
      await decodeJwt(accessToken);
    if (!decodeToken || !decodeToken.id) {
      response = NextResponse.json(
        {
          success: true,
          type: "error",
          message: "Invalid accessToken",
          data: {},
        },
        {
          status: 200,
        },
      );
    } else {
      userInfo = await prisma.user.findUnique({
        where: { accountId: decodeToken.accountId },
      });

      if (!userInfo) {
        response = NextResponse.json({
          success: true,
          type: "error",
          message: "회원정보가 없습니다.",
          data: {},
        });
      } else {
        response = NextResponse.json(
          {
            success: true,
            data: userInfo,
          },
          {
            status: 200,
          },
        );
      }
    }
  }
  response = NextResponse.json(
    {
      success: true,
      data: userInfo,
    },
    {
      status: 200,
    },
  );
  // const nowPasswordValue = request.get('nowPasswordValue') as string;
  // console.log(nowPasswordValue)
  return response;
};

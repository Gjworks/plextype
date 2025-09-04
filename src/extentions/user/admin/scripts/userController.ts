"use server";

import { cookies, headers } from "next/headers";
import { decodeJwt } from "jose";
import {
  getUser,
  getUserByAccountId,
  getUserByNickname,
} from "@/extentions/user/scripts/userModel";
import {
  deleteUser,
  updateUser,
} from "@/extentions/user/scripts/userController";
import {
  updateUserGroup,
  deleteUserGroup,
} from "@/extentions/user/scripts/groupController";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface UserParams {
  id?: number;
  uuid?: string | null;
  accountId?: string;
  accessToken?: string | null;
  nickName?: string;
  group?: { groupId: string }[];
}

interface LoggedParams {
  id: number;
  accountId: string;
  isAdmin?: boolean | null;
}

export const insertUser = async () => {};

export const updateAdminUser = async (params: UserParams) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  let obj: any = {};
  let loggedInfo: LoggedParams = {
    id: 0,
    accountId: "",
    isAdmin: false,
  };
  let userInfo;
  let response;

  //토큰 정보를 확인하여 로그인한 사용자 정보를 가져온다.
  if (accessToken) {
    const decodeToken: { id: number; accountId: string; isAdmin: boolean } =
      await decodeJwt(accessToken);
    loggedInfo.id = decodeToken.id;
    loggedInfo.accountId = decodeToken.accountId;
    loggedInfo.isAdmin = decodeToken.isAdmin;
  } else {
    return (response = {
      success: true,
      type: "error",
      message: "토큰 정보가 잘못되었습니다.",
      data: {},
    });
  }
  if (!loggedInfo.isAdmin) {
    return (response = {
      success: true,
      type: "error",
      message: "권한이 없습니다.",
      data: {},
    });
  }
  console.log(params);
  const output = await updateUser(params);
  console.log(output);
};

export const deleteAdminUser = async (id: number) => {
  if (!id) {
    return {
      success: false,
      code: "error",
      element: "id",
      message: "사용자 ID 값은 필수입니다.",
      data: {},
    };
  }
  const output = await deleteUser({ id: id });
  console.log(output);
  return output;
};

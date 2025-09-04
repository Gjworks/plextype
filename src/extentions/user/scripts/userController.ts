"use server";
import { cookies, headers } from "next/headers";

import { decodeJwt } from "jose";
import { PrismaClient } from "@prisma/client";
import { hashedPassword, verifyPassword } from "@plextype/utils/auth/password";
import {
  getUser,
  getUserByNickname,
  getUserByAccountId,
} from "@/extentions/user/scripts/userModel";
import {
  updateUserGroup,
  deleteUserGroup,
} from "@/extentions/user/scripts/groupController";

const prisma = new PrismaClient();

interface UserParams {
  id?: number;
  uuid?: string | null;
  accountId?: string;
  email_address?: string;
  accessToken?: string | null;
  nickName?: string | undefined;
  password?: string | undefined;
  isAdmin?: boolean | null;
  group?: { groupId: string }[];
}

interface LoggedParams {
  id: number;
  accountId: string;
  isAdmin?: boolean | null;
}

export const createUser = async (formData: FormData) => {
  let userInfo;
  let response;

  const accountId = formData.get("accountId") as string;
  const password = formData.get("password") as string;
  const nickName = formData.get("nickName") as string;

  if (!accountId) {
    return (response = {
      success: true,
      type: "error",
      element: "accountId",
      message: "계정 아이디 값은 필수입니다.",
      data: {},
    });
  }

  if (!password) {
    return (response = {
      success: true,
      type: "error",
      element: "password",
      message: "패스워드 값은 필수입니다.",
      data: {},
    });
  }
  if (!nickName) {
    return (response = {
      success: true,
      type: "error",
      element: "nickname",
      message: "닉네임 값은 필수입니다.",
      data: {},
    });
  }

  const getUserAccountId = await getUserByAccountId(accountId);
  if (getUserAccountId) {
    return (response = {
      success: true,
      type: "error",
      message: "An account with this username or email already exists.",
      data: {},
    });
  }

  const getUserNickname = await getUserByNickname(nickName);
  if (getUserNickname) {
    return (response = {
      success: true,
      type: "error",
      message: "The nickname is already taken.",
      data: {},
    });
  }

  try {
    userInfo = await prisma.user.create({
      data: {
        accountId: accountId,
        password: await hashedPassword(password),
        email_address: accountId,
        nickName: nickName,
      },
    });
  } catch (e) {
    console.log("register error" + e);
    throw {
      success: false,
      type: "error",
      message: "An error occurred during the registration process. ",
      data: {},
    };
  }
};
export const updateUser = async (params: UserParams) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

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

  //토큰 사용자 정보로 실제 회원 정보를 DB에서 가져온다.
  userInfo = await getUser(loggedInfo);

  if (!userInfo) {
    response = {
      success: true,
      type: "error",
      message: "회원정보가 없습니다.",
      data: {},
    };
  }

  //관리자가 아닐경우 본인 계정만 삭제 가능
  if (!loggedInfo.isAdmin) {
    if (userInfo?.email !== loggedInfo.accountId) {
      return (response = {
        success: true,
        type: "error",
        message: "권한이 없습니다.",
        data: {},
      });
    }
  }

  if (userInfo.accountId !== params.accountId && params.accountId) {
    const getUserAccountId = await getUserByAccountId(params.accountId);
    if (getUserAccountId) {
      return (response = {
        success: true,
        type: "error",
        message: "이미 사용중인 아이디입니다.",
        data: {},
      });
    }
  }
  if (userInfo.nickName !== params.nickName && params.nickName) {
    const getUserNickname = await getUserByNickname(params.nickName);
    if (getUserNickname) {
      return (response = {
        success: true,
        type: "error",
        message: "이미 사용중인 닉네임입니다.",
        data: {},
      });
    }
  }

  // 만약 그룹 정보가 온다면 그룹 정보를 업데이트 한다.
  if (params.group) {
    console.log("Group: " + params.group);
    let groupId: number[] = [];
    console.log(typeof params.group);
    for (const key in params.group) {
      const groupItem = params.group[key];
      if (
        typeof groupItem === "object" &&
        groupItem !== null &&
        "groupId" in groupItem
      ) {
        console.log(groupItem);
        groupId.push(Number(groupItem.groupId));
      } else {
        console.error("Invalid groupItem:", groupItem); // 오류가 발생한 데이터를 로그에 출력
      }
    }
    console.log(groupId);
    await updateUserGroup(userInfo.id, groupId);
  }
  console.log("update user access token", params);
  try {
    const updateUserInfo = await prisma.user.update({
      where: {
        id: userInfo.id,
      },
      data: {
        accountId: params.accountId ?? params.accountId,
        email_address: params.email_address ?? params.email_address,
        nickName: params.nickName ?? params.nickName,
        password: params.password ?? params.password,
        isAdmin: params.isAdmin ?? params.isAdmin,
      },
    });
    console.log(updateUserInfo);
    userInfo.nickName = updateUserInfo.nickName;

    return (response = {
      success: true,
      type: "success",
      message: "회원정보가 성공적으로 변경되었습니다.",
      data: {
        userInfo: userInfo,
      },
    });
  } catch (error) {
    console.error("userInfo update error" + error);
  }
};

export const deleteUser = async (params: UserParams) => {
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
  if (accessToken) {
    const decodeToken: { id: number; accountId: string; isAdmin: boolean } =
      await decodeJwt(accessToken);
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
  params.id && (obj.id = params.id);
  params.uuid && (obj.uuid = params.uuid).trim();
  params.nickName && (obj.nickName = params.nickName).trim();
  params.accountId && (obj.accountId = params.accountId).trim();

  if (!obj.id && !obj.uuid && !obj.nickname && !obj.accountId) {
    obj.accountId = loggedInfo.accountId;
  }

  userInfo = await getUser(params);

  if (!userInfo) {
    response = {
      success: true,
      type: "error",
      message: "회원정보가 없습니다.",
      data: {},
    };
  }
  //관리자가 아닐경우 본인 계정만 삭제 가능
  if (!loggedInfo.isAdmin) {
    if (userInfo?.data?.accountId !== loggedInfo.accountId) {
      return (response = {
        success: true,
        type: "error",
        message: "권한이 없습니다.",
        data: {},
      });
    }
  }

  //회원 그룹 정보 삭제
  await deleteUserGroup(userInfo.id);

  const deleteUser = await prisma.user.delete({
    where: obj,
  });

  if (deleteUser) {
    if (loggedInfo.isAdmin === false) {
      cookieStore.delete("refreshToken");
      cookieStore.delete("accessToken");
    }
    response = {
      success: true,
      type: "success",
      message: "회원 계정정보가 모두 삭제되었습니다.",
      data: {},
    };
  } else {
    response = {
      success: true,
      type: "error",
      message: "회원정보가 없습니다.",
      data: {},
    };
  }

  // await getUser({nickname:nickname})

  // const nowPasswordValue = request.get('nowPasswordValue') as string;
  // console.log(nowPasswordValue)
  return response;
};

export const PasswordChange = async (formData: FormData) => {
  let userInfo;
  let response;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return {
      success: true,
      type: "error",
      message: "아이디 혹은 비밀번호가 맞지 않거나 존재 하지 않은 계정입니다.",
      data: {},
      accessToken: null,
    };
  }

  const nowPasswordValue = formData.get("nowPasswordValue") as string;
  const newPasswordValue = formData.get("newPasswordValue") as string;
  const renewPasswordValue = formData.get("renewPasswordValue") as string;

  const decodeToken: { id: number; accountId: string; isAdmin: boolean } =
    await decodeJwt(accessToken);
  if (decodeToken && decodeToken.id) {
    userInfo = await prisma.user.findUnique({
      where: { accountId: decodeToken.accountId },
    });
  }

  if (!userInfo) {
    response = {
      success: true,
      type: "error",
      message: "회원정보가 없습니다.",
      data: {},
    };
  }
  if (
    userInfo! &&
    (await verifyPassword(nowPasswordValue, userInfo!.password))
  ) {
    response = {
      success: true,
      type: "success",
      message: "현재 비밀번호와 일치 합니다.",
      data: {},
    };
    if (
      newPasswordValue &&
      renewPasswordValue &&
      newPasswordValue === renewPasswordValue
    ) {
      try {
        await prisma.user.update({
          where: {
            accountId: decodeToken.accountId,
          },
          data: {
            password: await hashedPassword(newPasswordValue),
          },
        });
        response = {
          success: true,
          type: "success",
          message: "비밀번호가 변경되었습니다.",
          data: {},
        };
      } catch (error) {
        console.error(error);
      }
    } else {
      if (newPasswordValue !== renewPasswordValue) {
        response = {
          success: true,
          type: "warning",
          message: "변경할 비밀번호가 서로 맞지 않습니다.",
          data: {},
        };
      }
      if (!newPasswordValue || !renewPasswordValue) {
        response = {
          success: true,
          type: "info",
          message: "변경할 비밀번호를 입력해주세요.",
          data: {},
        };
      }
    }
  } else {
    if (!nowPasswordValue) {
      response = {
        success: true,
        type: "warning",
        message: "현재 비밀번호를 입력해주세요.",
        data: {},
      };
    } else {
      response = {
        success: true,
        type: "error",
        message: "현재 비밀번호와 맞지 않습니다.",
        data: {},
      };
    }
  }
  return response;
};

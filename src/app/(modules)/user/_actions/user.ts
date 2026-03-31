"use server"

import prisma from "@utils/db/prisma";
import { hashedPassword } from "@utils/auth/password";
import {
  ActionState,
  UserParams,
  UserListParams,
  UserInfo,
  LoggedParams
} from "./_type";
import {cookies} from "next/headers";
import {decodeJwt} from "jose";

export async function upsertUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. 데이터 추출
  const rawId = formData.get("id")?.toString();
  const accountId = formData.get("accountId")?.toString();
  const password = formData.get("password")?.toString();
  const nickname = formData.get("nickname")?.toString();
  const isAdmin = formData.get("isAdmin") === "true" || formData.get("isAdmin") === "on";

  // 그룹 ID 배열 추출 (updateUserAction에서 가져온 로직)
  const groupsRaw = formData.getAll("groups[]");
  const groups = groupsRaw.map((g) => parseInt(g as string, 10));

  // 2. 기본 유효성 검사
  if (!accountId || !nickname) {
    return { success: false, message: "아이디와 닉네임은 필수입니다." };
  }

  try {
    // 3. 트랜잭션 시작 (모든 작업이 성공하거나, 모두 실패하거나)
    await prisma.$transaction(async (tx) => {
      let targetId: number;

      if (!rawId) {
        // --- [CREATE] 회원 생성 모드 ---
        if (!password) throw new Error("신규 회원 생성 시 비밀번호는 필수입니다.");

        // 아이디/닉네임 중복 체크
        const existing = await tx.user.findFirst({
          where: { OR: [{ accountId }, { nickName: nickname }] }
        });
        if (existing) throw new Error("이미 사용 중인 아이디 또는 닉네임입니다.");

        const newUser = await tx.user.create({
          data: {
            accountId,
            password: await hashedPassword(password),
            email_address: accountId,
            nickName: nickname,
            isAdmin,
          },
        });
        targetId = newUser.id;
      } else {
        // --- [UPDATE] 회원 수정 모드 ---
        targetId = Number(rawId);

        // 닉네임 중복 체크 (본인 제외)
        const nickCheck = await tx.user.findFirst({
          where: { nickName: nickname, NOT: { id: targetId } },
        });
        if (nickCheck) throw new Error("다른 회원이 사용 중인 닉네임입니다.");

        const updateData: any = {
          nickName: nickname,
          isAdmin,
          accountId
        };

        // 비밀번호가 입력된 경우에만 해싱하여 업데이트
        if (password?.trim()) {
          updateData.password = await hashedPassword(password);
        }

        await tx.user.update({
          where: { id: targetId },
          data: updateData,
        });

        // 기존 그룹 관계 삭제 후 재등록 (핵심 기능 통합)
        await tx.userGroupUser.deleteMany({ where: { userId: targetId } });
      }

      // 공통: 그룹 관계 생성 (생성이든 수정이든 선택된 그룹이 있다면 등록)
      if (groups.length > 0) {
        await tx.userGroupUser.createMany({
          data: groups.map((groupId) => ({ groupId, userId: targetId })),
        });
      }
    });

    return { success: true, message: "이동 중..." };
  } catch (error: any) {
    console.error("Upsert User Error:", error);
    return { success: false, message: error.message || "데이터베이스 처리 중 오류가 발생했습니다." };
  }

}


/**
 * ID로 사용자 조회 (기본 정보만)
 */
export async function findUserById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * UUID로 사용자 조회
 */
export async function findUserByUUID(uuid: string) {
  return prisma.user.findUnique({
    where: { uuid },
  });
}

/**
 * accountId 또는 email로 사용자 조회
 */
export async function findUserByAccount(accountIdOrEmail: string) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { accountId: accountIdOrEmail },
        { email_address: accountIdOrEmail },
      ],
    },
  });
}

/**
 * 사용자 + 프로필 + 그룹 정보 포함 조회
 */
export async function findUserFullById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userGroups: {
        include: {
          group: true,
        },
      },
    },
  });
}

/**
 * 사용자 목록 조회 (페이징, 검색)
 */
export async function findUsers(params: {
  skip?: number;
  take?: number;
  keyword?: string;
}) {
  const { skip = 0, take = 20, keyword } = params;

  return prisma.user.findMany({
    skip,
    take,
    where: keyword
      ? {
        OR: [
          { accountId: { contains: keyword, mode: "insensitive" } },
          { email_address: { contains: keyword, mode: "insensitive" } },
          { nickName: { contains: keyword, mode: "insensitive" } },
        ],
      }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
    },
  });
}

/**
 * 사용자 삭제 (Soft delete가 아니라면 실제 삭제)
 */

export const deleteUser = async (params: UserParams) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // 1. 토큰 검증 및 로그 정보 추출
  if (!accessToken) {
    return { success: false, type: "error", message: "토큰 정보가 없습니다." };
  }

  const decodeToken: any = await decodeJwt(accessToken);
  const loggedInfo = {
    id: decodeToken.id,
    accountId: decodeToken.accountId,
    isAdmin: decodeToken.isAdmin,
  };

  // 2. 검색 조건 구성 (대소문자 주의: nickName)
  let obj: any = {};
  if (params.id) obj.id = params.id;
  if (params.uuid) obj.uuid = params.uuid.trim();
  if (params.nickName) obj.nickName = params.nickName.trim();
  if (params.accountId) obj.accountId = params.accountId.trim();

  // 조건이 없으면 본인 계정으로 설정
  if (Object.keys(obj).length === 0) {
    obj.accountId = loggedInfo.accountId;
  }

  try {
    // 3. 대상 유저 존재 확인
    const targetUser = await getUser(params);
    if (!targetUser || targetUser.success === false) {
      return { success: false, type: "error", message: "삭제할 회원 정보를 찾을 수 없습니다." };
    }

    // 4. 권한 체크 (관리자가 아니면 본인만 삭제 가능)
    const targetAccountId = targetUser.accountId || targetUser.data?.accountId;
    if (!loggedInfo.isAdmin && targetAccountId !== loggedInfo.accountId) {
      return { success: false, type: "error", message: "권한이 없습니다." };
    }

    // 5. 트랜잭션 실행 (그룹 삭제 + 유저 삭제)
    await prisma.$transaction(async (tx) => {
      // 그룹 관계 먼저 삭제
      await tx.userGroupUser.deleteMany({
        where: { userId: targetUser.id },
      });

      // 유저 본체 삭제
      await tx.user.delete({
        where: { id: targetUser.id }, // 가장 확실한 id로 삭제
      });
    });

    // 6. 본인 삭제 시 쿠키 정리
    if (!loggedInfo.isAdmin) {
      cookieStore.delete("refreshToken");
      cookieStore.delete("accessToken");
    }

    return { success: true, type: "success", message: "회원 계정정보가 모두 삭제되었습니다." };

  } catch (error: any) {
    console.error("Delete User Error:", error);
    return { success: false, type: "error", message: "삭제 중 오류가 발생했습니다." };
  }
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

export const getUserSession = async (): Promise<ActionState> => {
  const tokenInfo = await getUserLogged();

  let userInfo: UserInfo | null = null;
  let response: ActionState;
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
        message: "사용자 정보를 성공적으로 가져왔습니다.", // 필수 속성 추가
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



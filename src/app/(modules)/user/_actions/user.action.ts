// src/app/(extentions)/users/_actions/user.action.ts
"use server";

import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { hashedPassword, verifyPassword } from "@utils/auth/password";

import { ActionState, UserUpsertSchema, PasswordChangeSchema, UserListParams, UserListSchema, UserListResponseData, LoggedParams, UserInfo, UserParams, PasswordVerifySchema } from "./_type";
import * as query from "./user.query"; // 분리된 쿼리 함수 임포트
import { validateForm } from "@/utils/validation/formValidator";
/**
 * 💡 공통 유틸: Prisma 결과물에서 민감한 정보(비밀번호 등) 제외하기
 */
function excludeSensitiveData(user: any): UserInfo {
  const { password, refreshToken, ...safeUser } = user;
  return safeUser as UserInfo;
}

// ==========================================
// [ACTION] 유저 등록 / 수정 (Zod 파싱 적용)
// ==========================================
export async function saveUser(formData: FormData): Promise<ActionState<null>> {
  const isProfileUpdate = formData.get("isProfileUpdate") === "true";
  const formPayload = {
    id: formData.get("id"),
    accountId: formData.get("accountId"),
    email_address: formData.get("email_address"),
    nickName: formData.get("nickName"),
    password: formData.get("password"),
    isAdmin: formData.get("isAdmin"),
    group: formData.getAll("groups[]").map(g => ({ groupId: g })),
  };

  // 🛡️ [1차 방어선] Zod 형식 검사
  const validation = validateForm(UserUpsertSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;
  const data = validation.data;

  try {
    // 🛡️ [2차 방어선] DB 중복 검사 (단일 쿼리로 통합!)
    // CREATE일 땐 data.id가 undefined라서 전체 검사, UPDATE일 땐 본인 제외 검사
    const duplicates = await query.findUser(data.accountId, data.email_address, data.nickName, data.id);

    if (duplicates.length > 0) {
      const fieldErrors: Record<string, string> = {};

      duplicates.forEach(dup => {
        if (dup.accountId === data.accountId) fieldErrors.accountId = "이미 사용 중인 아이디입니다.";
        if (dup.email_address === data.email_address) fieldErrors.email_address = "이미 사용 중인 이메일입니다.";
        if (dup.nickName === data.nickName) fieldErrors.nickName = "이미 사용 중인 닉네임입니다.";
      });

      // 🎯 핵심: fieldErrors에 담긴 값들 중 첫 번째 메시지를 메인 문구로 꺼내옵니다.
      const firstErrorMessage = Object.values(fieldErrors)[0] || "중복된 정보가 있습니다.";

      return {
        success: false,
        type: "error",
        message: firstErrorMessage, // 👉 이제 "이미 사용 중인 이메일입니다."가 Alert 창에 예쁘게 뜹니다!
        fieldErrors
      };
    }

    // 🌟 모든 검문소 통과 완료! 이제 맘 편하게 DB에 저장만 하면 됩니다.
    if (!data.id) {
      // --- [CREATE] ---
      if (!data.password) {
        return { success: false, type: "error", message: "비밀번호는 필수입니다.", fieldErrors: { password: "비밀번호는 필수입니다." } };
      }

      const pw = await hashedPassword(data.password);
      const insertData = {
        accountId: data.accountId,
        password: pw,
        email_address: data.email_address,
        nickName: data.nickName,
        isAdmin: data.isAdmin
      };

      await query.upsertUser(false, null, insertData, data.group?.map(g => Number(g.groupId)) || []);
    } else {
      // --- [UPDATE] ---
      const updateData: any = {
        nickName: data.nickName,
        email_address: data.email_address,
        isAdmin: data.isAdmin,
        accountId: data.accountId
      };

      if (data.password?.trim()) {
        updateData.password = await hashedPassword(data.password);
      }

      const groupsToUpdate = isProfileUpdate
        ? undefined
        : (data.group?.map(g => Number(g.groupId)) || []);

      await query.upsertUser(true, data.id, updateData, groupsToUpdate);
    }

    return { success: true, type: "success", message: "저장되었습니다." };
  } catch (error: any) {
    console.error(error);
    return { success: false, type: "error", message: "데이터베이스 처리 중 오류가 발생했습니다." };
  }
}

// ==========================================
// [ACTION] 목록 조회 (getUserListAction -> getUserList 로 이름 변경)
// ==========================================
export async function getUserList(params: UserListParams): Promise<ActionState<UserListResponseData>> {
  try {
    const validatedParams = UserListSchema.parse(params);
    validatedParams.listCount = 20;

    // 💡 query.findUserList 호출로 명확한 규칙 적용!
    const result = await query.findUserList(validatedParams);

    const safeUserList = result.userList.map(excludeSensitiveData);

    return {
      success: true,
      message: "조회 성공",
      data: { userList: safeUserList, navigation: result.navigation }
    };
  } catch (error) {
    return { success: false, type: "error", message: "목록을 불러오지 못했습니다." };
  }
}

// 💡 파라미터를 (id: number) 로 아주 직관적으로 바꿉니다!
export const removeUser = async (id: number): Promise<ActionState<null>> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return { success: false, type: "error", message: "토큰 정보가 없습니다." };

  const decodeToken: any = await decodeJwt(accessToken);
  const loggedInfo = { id: decodeToken.id, accountId: decodeToken.accountId, isAdmin: decodeToken.isAdmin };

  try {
    // 💡 getUser에는 임시로 우회(as any)해서 id만 객체로 감싸서 던져줍니다.
    const targetRes = await getUser({ id } as any);

    if (!targetRes.success || !targetRes.data || !targetRes.data.id) {
      return { success: false, type: "error", message: "삭제할 회원 정보를 찾을 수 없습니다." };
    }

    const targetUser = targetRes.data;

    if (!loggedInfo.isAdmin && targetUser.accountId !== loggedInfo.accountId) {
      return { success: false, type: "error", message: "권한이 없습니다." };
    }

    // 트랜잭션 쿼리 실행
    await query.deleteUser(targetUser.id);

    if (targetUser.id === loggedInfo.id) {
      cookieStore.delete("refreshToken");
      cookieStore.delete("accessToken");
    }

    return { success: true, type: "success", message: "회원 계정정보가 모두 삭제되었습니다." };
  } catch (error: any) {
    console.error("Delete User Error:", error);
    return { success: false, type: "error", message: "삭제 중 오류가 발생했습니다." };
  }
};

export const getUserLogged = async (): Promise<LoggedParams> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  let tokenInfo: LoggedParams = { id: 0, accountId: "", isAdmin: false };

  if (accessToken) {
    const decodeToken: any = await decodeJwt(accessToken);
    tokenInfo.accountId = decodeToken.accountId;
    tokenInfo.id = decodeToken.id;
    tokenInfo.isAdmin = decodeToken.isAdmin;
  }
  return tokenInfo;
};
// ==========================================
// [ACTION] 단일 유저 조회 (get 통일)
// ==========================================
export const getLoggedUser = async (): Promise<LoggedParams> => { // 💡 getUserLogged -> getLoggedUser 로 변경
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  let tokenInfo: LoggedParams = { id: 0, accountId: "", isAdmin: false };

  if (accessToken) {
    const decodeToken: any = await decodeJwt(accessToken);
    tokenInfo.accountId = decodeToken.accountId;
    tokenInfo.id = decodeToken.id;
    tokenInfo.isAdmin = decodeToken.isAdmin;
  }
  return tokenInfo;
};

export const getUserSession = async (): Promise<ActionState<UserInfo>> => {
  const tokenInfo = await getLoggedUser(); // 이름 바뀐 함수 호출

  if (tokenInfo && tokenInfo.accountId) {
    try {
      // 💡 query.findUserSessionData 호출!
      const userInfo = await query.findUserSessionData(tokenInfo.accountId);
      if (!userInfo) throw new Error("Not Found");

      return {
        success: true,
        message: "사용자 정보를 성공적으로 가져왔습니다.",
        data: excludeSensitiveData(userInfo)
      };
    } catch (e) {
      return { success: false, type: "error", message: "회원정보가 없습니다." };
    }
  }
  return { success: false, type: "error", message: "토큰 정보가 올바르지 않습니다." };
};

export const getUser = async (params: UserParams): Promise<ActionState<UserInfo>> => {
  const tokenInfo = await getLoggedUser();
  let obj: any = {};

  if (params.id) obj.id = params.id;
  if (params.uuid) obj.uuid = params.uuid.trim();

  if (!obj.id && !obj.uuid && !params.nickName && !params.accountId) {
    obj.accountId = tokenInfo.accountId;
  }

  if (Object.keys(obj).length === 0) {
    return { success: false, type: "error", message: "조회할 데이터가 없습니다." };
  }

  try {
    // 💡 query.findUserByCondition 호출!
    const userInfo = await query.findUserByCondition(obj);

    if (!userInfo) return { success: false, type: "error", message: "회원정보가 없습니다." };

    return { success: true, message: "조회 성공", data: excludeSensitiveData(userInfo) };
  } catch (e) {
    return { success: false, type: "error", message: "회원정보 조회 중 오류가 발생했습니다." };
  }
};

export const getUserFullById = async (id: number) => { // 💡 findUserFullById -> getUserFullById 로 변경
  if (!id) return null;

  try {
    // 💡 query.findUserFullById 호출!
    const user = await query.findUserFullById(id);
    if (!user) return null;

    return excludeSensitiveData(user);
  } catch (error) {
    return null;
  }
};


// ==========================================
// [ACTION] 비밀번호 변경
// ==========================================
export async function changePassword(formData: FormData): Promise<ActionState<null>> {
  // 💡 1. 폼 데이터 추출 (클라이언트에서 넘어온 값)
  const formPayload = {
    nowPassword: formData.get("nowPassword") || formData.get("now_password") || "",
    newPassword: formData.get("newPassword") || formData.get("new_password") || "",
  };

  // 🛡️ [1차 방어선] Zod 형식 검사 (우리가 만든 모듈화 스키마 적용!)
  const validation = validateForm(PasswordChangeSchema, formPayload);

  // Zod 룰(8자 이상 등)을 통과 못하면 프론트엔드로 fieldErrors와 함께 즉시 빠꾸!
  if (!validation.isValid) return validation.errorResponse;

  // 검증을 통과한 안전하고 깔끔한 데이터
  const data = validation.data;

  try {
    // 💡 2. 현재 로그인한 내 정보 가져오기
    const loggedInfo = await getLoggedUser();
    if (!loggedInfo || !loggedInfo.id) {
      return { success: false, type: "error", message: "로그인 정보가 없습니다. 다시 로그인해주세요." };
    }

    // 💡 3. DB에서 내 계정 정보(기존 암호화된 비밀번호) 가져오기
    const user = await query.findUserFullById(loggedInfo.id); // 기존에 만들어두신 함수 활용
    if (!user) {
      return { success: false, type: "error", message: "사용자를 찾을 수 없습니다." };
    }

    // 🛡️ [2차 방어선] 기존 비밀번호가 맞는지 검증!
    const isMatch = await verifyPassword(data.nowPassword, user.password);
    if (!isMatch) {
      // 🎯 핵심: 틀렸을 때 now_password 필드 밑에 빨간 글씨를 띄우도록 fieldErrors를 던져줍니다.
      return {
        success: false,
        type: "error",
        message: "현재 비밀번호가 일치하지 않습니다.",
        fieldErrors: { nowPassword: "현재 비밀번호가 일치하지 않습니다." }
      };
    }

    // 🌟 모든 방어선 통과! 새 비밀번호 암호화 후 DB 업데이트
    const newHashedPassword = await hashedPassword(data.newPassword);

    // (이 부분은 user.query.ts에 updatePassword 쿼리가 없다면 추가해야 합니다)
    await query.updatePassword(user.id, newHashedPassword);

    return { success: true, type: "success", message: "비밀번호가 성공적으로 변경되었습니다." };
  } catch (error: any) {
    console.error("changePassword Error:", error);
    return { success: false, type: "error", message: "비밀번호 변경 중 서버 오류가 발생했습니다." };
  }
}


export async function removeMyAccount(formData: FormData): Promise<ActionState<null>> {
  const formPayload = {
    password: formData.get("password") || "",
  };

  // 🛡️ [1차 방어선] Zod 검사 (값이 비어있는지만 체크)
  const validation = validateForm(PasswordVerifySchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  const data = validation.data;

  try {
    const loggedInfo = await getLoggedUser();
    if (!loggedInfo || !loggedInfo.id) {
      return { success: false, type: "error", message: "로그인 정보가 없습니다." };
    }

    // DB에서 내 계정 정보 가져오기
    const user = await query.findUserFullById(loggedInfo.id);
    if (!user) {
      return { success: false, type: "error", message: "사용자를 찾을 수 없습니다." };
    }

    // 🛡️ [2차 방어선] 비밀번호 일치 여부 확인!
    const isMatch = await verifyPassword(data.password, user.password);
    if (!isMatch) {
      // 🎯 비밀번호가 틀리면 인풋창으로 포커스를 보내기 위해 fieldErrors를 쏴줍니다!
      return {
        success: false,
        type: "error",
        message: "비밀번호가 일치하지 않습니다.",
        fieldErrors: { password: "비밀번호가 일치하지 않습니다." }
      };
    }

    // 🌟 모든 검증 통과! DB에서 삭제 처리 (기존에 만들어두신 query.deleteUser 재활용!)
    await query.deleteUser(user.id);

    // 🌟 안전하게 로그아웃 (쿠키 파기)
    const cookieStore = await cookies();
    cookieStore.delete("refreshToken");
    cookieStore.delete("accessToken");

    return { success: true, type: "success", message: "회원 탈퇴가 완료되었습니다." };
  } catch (error: any) {
    console.error("deleteMyAccount Error:", error);
    return { success: false, type: "error", message: "탈퇴 처리 중 서버 오류가 발생했습니다." };
  }
}

export async function verifyMyPassword(password: string): Promise<ActionState<null>> {
  // 💡 1. 빈 값일 때도 fieldErrors를 던져주도록 수정했습니다!
  if (!password) {
    return {
      success: false,
      type: "error",
      message: "비밀번호를 입력해주세요.",
      fieldErrors: { password: "비밀번호를 입력해주세요." } // 🎯 프론트 포커스용!
    };
  }

  try {
    const loggedInfo = await getLoggedUser();
    if (!loggedInfo || !loggedInfo.id) {
      return { success: false, type: "error", message: "로그인 정보가 없습니다." };
    }

    const user = await query.findUserFullById(loggedInfo.id);
    if (!user) return { success: false, type: "error", message: "사용자를 찾을 수 없습니다." };

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return {
        success: false,
        type: "error",
        message: "비밀번호가 일치하지 않습니다.",
        fieldErrors: { password: "비밀번호가 일치하지 않습니다." } // 🎯 텍스트 통일
      };
    }

    return { success: true, type: "success", message: "비밀번호가 확인되었습니다. 탈퇴를 진행하실 수 있습니다." };
  } catch (error: any) {
    return { success: false, type: "error", message: "서버 오류가 발생했습니다." };
  }
}
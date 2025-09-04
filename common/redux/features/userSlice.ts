import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
// import { signin } from "@/extentions/user/scripts/authController";
import { updateUser } from "@/extentions/user/scripts/userController";

interface DataInfo {
  // 사용자 정보에 해당하는 인터페이스를 정의합니다.
  type: string;
  element: string;
  message: string;
  data: {
    userInfo: UserInfo;
  };
  accessToken: string;
}

const initialState = {
  session: {} as UserInfo,
  loading: false,
  error: "",
  type: "",
  element: "",
  message: "",
};

interface FetchSignInPayload {
  formData: FormData;
}

interface FetchUserInfoPayload {
  accessToken: string;
  formData: FormData;
}

interface FetchSignInResponse {
  result: DataInfo;
  accessToken: string;
}

export const fetchSignIn = createAsyncThunk<
  FetchSignInResponse,
  FetchSignInPayload
>(
  "userInfo/fetchSignIn",
  async ({
    formData,
  }: {
    formData: FormData;
  }): Promise<{ result: DataInfo; accessToken: string }> => {
    let result;
    const response = await fetch("/api/auth/Signin", {
      method: "POST",
      body: formData,
    });
    result = await response.json();
    return { result: result, accessToken: result.accessToken };
  },
);

export const fetchUserInfo = createAsyncThunk<DataInfo, FetchUserInfoPayload>(
  "userInfo/fetchUserInfo",
  async ({ formData }: { formData: FormData }): Promise<DataInfo> => {
    let result;
    const params = {
      nickName: formData.get("nickName") as string,
    };
    await updateUser(params).then((response) => {
      result = response;
    });
    return result;
  },
);

export const userSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    resetUserInfo: (state) => {
      state.session = {} as UserInfo;
    },
    updateInfo: (
      state,
      action: PayloadAction<{ type: string; element: string; message: string }>,
    ) => {
      state.type = action.payload.type;
      state.element = action.payload.element;
      state.message = action.payload.message;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.type !== "error") {
          if (action.payload.data.userInfo) {
            state.session = action.payload.data.userInfo as UserInfo;
          }
        }
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        if (state !== null) {
          state.loading = false;
          (action.error?.message as string | null) ?? null;
        }
      })
      .addCase(fetchSignIn.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSignIn.fulfilled, (state, action) => {
        state.loading = false;
        // 사용자 정보와 accessToken 받아오기
        const { data, accessToken } = action.payload.result;
        // fetchSignIn에서 받아온 사용자 정보로 덮어쓰기
        if (data.userInfo) {
          state.session = data.userInfo as UserInfo;
        }
        // localStorage에 accessToken 저장
        localStorage.setItem("accessToken", accessToken);
      })
      .addCase(fetchSignIn.rejected, (state, action) => {
        if (state !== null) {
          state.loading = false;
          state.error = action.error?.message ?? "Unknown error occurred";
        }
      });
  },
});

export const { resetUserInfo, updateInfo } = userSlice.actions;
export default userSlice.reducer;

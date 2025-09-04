"use client";

import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { persistReducer, persistStore, PersistConfig } from "redux-persist";
// import storage from "redux-persist/lib/storage";
import { userSlice } from "./features/userSlice";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const userInfoTransform = {
  in: (state, key) => {
    return { session: state.session };
  },
  out: (state, key) => {
    // 보관된 상태를 로드할 때는 변환하지 않습니다.
    return state;
  },
};

const createNoopStorage = () => {
  return {
    getItem(_key: any) {
      return Promise.resolve(null);
    },
    setItem(_key: any, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: any) {
      return Promise.resolve();
    },
  };
};
const storage =
  typeof window === "undefined"
    ? createNoopStorage()
    : createWebStorage("local");

const rootReducer = combineReducers({
  userInfo: userSlice.reducer,
});

const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: "userInfo",
  storage,
  // serialize: false, // Disable serialization
  // serialize: data => JSON.stringify(data), // 객체를 문자열로 변환
  // whitelist: ['userInfo'],
  transforms: [userInfoTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  // reducer: {
  //   userInfo: userSlice.reducer,
  // },
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

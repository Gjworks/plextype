"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, KeyRound, Mail, Save, UserRound } from "lucide-react";

import Alert from "@components/message/Alert";
import Button from "@components/button/Button";
import InputField from "@components/form/InputField";
import Popup from "@components/modal/Popup";
import HeaderUser from "@/modules/user/tpl/default/header";
import ChangePassword from "./changePassword";
import UploadFileManager from "@components/editor/UploadFileManager";
import MyFiles from "@/modules/attachment/tpl/default/myFiles";
import { saveUserAction, updateProfileImageAction } from "@/modules/user/actions/user.action";
import { UserInfo } from "@/modules/user/actions/_type";
import type { Attachment } from "@/modules/attachment/actions/_type";

type Props = {
  initialUser: UserInfo;
};

const UpdateUser = ({ initialUser }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profileImage, setProfileImage] = useState(initialUser.profile?.profileImage || "");
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      formData.append("id", initialUser.id.toString());
      formData.append("accountId", initialUser.accountId);
      formData.append("email_address", initialUser.email_address);
      formData.append("isAdmin", initialUser.isAdmin?.toString() || "false");
      formData.append("isProfileUpdate", "true");
      if (!formData.has("password")) formData.append("password", "");
      return await saveUserAction(formData);
    },
    onSuccess: async (res) => {
      if (!res.success) {
        setMessage({ type: res.type || "error", text: res.message });
        return;
      }
      setMessage({ type: "success", text: "회원 정보가 저장되었습니다." });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      router.refresh();
    },
    onError: () => setMessage({ type: "error", text: "회원 정보 수정 중 오류가 발생했습니다." }),
  });

  const profileMutation = useMutation({
    mutationFn: async (nextProfileImage: string | null) => await updateProfileImageAction(nextProfileImage),
    onSuccess: async (res) => {
      if (!res.success) {
        setMessage({ type: res.type || "error", text: res.message });
        return;
      }

      setProfileImage(res.data?.profileImage || "");
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      router.refresh();
      setShowProfilePopup(false);
    },
    onError: () => setMessage({ type: "error", text: "프로필 이미지 변경 중 오류가 발생했습니다." }),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    mutation.mutate(new FormData(event.currentTarget));
  };

  const handleProfileImageSelect = (file: Attachment) => {
    if (!file.mimeType?.startsWith("image/")) {
      setMessage({ type: "error", text: "이미지 파일만 프로필 이미지로 사용할 수 있습니다." });
      return;
    }

    profileMutation.mutate(file.path);
  };

  return (
    <>
      <HeaderUser />
      <div className="min-h-screen bg-white dark:bg-dark-950">
        <div className="mx-auto max-w-screen-lg px-4 py-10 md:py-14">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-900 md:p-8">
            <div className="flex flex-col gap-5 border-b border-gray-200 pb-6 dark:border-dark-800 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">Account</div>
                <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-gray-950 dark:text-dark-100">회원 정보</h1>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-400">계정에 표시되는 기본 정보를 관리합니다.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200 dark:bg-dark-800 dark:ring-dark-700">
                  {profileImage ? (
                    <img src={profileImage} alt="프로필 이미지" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <UserRound size={24} />
                    </div>
                  )}
                </div>
                <Button type="button" icon={<Camera size={15} />} onClick={() => setShowProfilePopup(true)}>
                  이미지 변경
                </Button>
              </div>
            </div>

            {message && (
              <div className="mt-5">
                <Alert message={message.text} type={message.type} />
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-800 dark:bg-dark-950/40">
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-dark-300">
                  <UserRound size={16} />
                  계정 ID
                </div>
                <div className="text-base text-gray-950 dark:text-dark-100">{initialUser.accountId}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-800 dark:bg-dark-950/40">
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-dark-300">
                  <Mail size={16} />
                  이메일
                </div>
                <div className="break-all text-base text-gray-950 dark:text-dark-100">{initialUser.email_address}</div>
              </div>
              <div className="md:col-span-2">
                <InputField
                  inputTitle="닉네임"
                  type="text"
                  name="nickName"
                  placeholder="닉네임"
                  defaultValue={initialUser.nickName}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-800 dark:bg-dark-950/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-950 dark:text-dark-100">
                    <KeyRound size={16} />
                    비밀번호
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-dark-400">현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>
                </div>
                <Button type="button" onClick={() => setShowPasswordPopup(true)}>
                  비밀번호 변경
                </Button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" isLoading={mutation.isPending} icon={<Save size={15} />}>
                저장하기
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Popup id="change-password-popup" state={showPasswordPopup} title="비밀번호 변경" close={setShowPasswordPopup} showFooter={false}>
        <ChangePassword close={setShowPasswordPopup} />
      </Popup>

      <Popup id="profile-image-popup" state={showProfilePopup} title="프로필 이미지 변경" close={setShowProfilePopup} showFooter={false}>
        <div className="space-y-6">
          {profileMutation.isPending && (
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300">
              프로필 이미지를 저장하고 있습니다.
            </div>
          )}
          <UploadFileManager onUploadSuccess={() => {}} onFileClick={handleProfileImageSelect} />
          <MyFiles imagesOnly selectedPath={profileImage} onFileSelect={handleProfileImageSelect} />
        </div>
      </Popup>
    </>
  );
};

export default UpdateUser;

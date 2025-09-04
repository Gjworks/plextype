"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@plextype/components/message/Alert";

import { updateUserAction } from "@/extentions/user/admin/scripts/actions/updateUser";

const UpdateFormClient = ({ user, groupList }) => {
  const router = useRouter();
  const [error, setError] = useState(null);
  const initialGroups = user?.userGroups?.map((ug) => ug.group.id) ?? [];
  const [selectedGroups, setSelectedGroups] = useState(initialGroups);
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin ?? false);
  const [isPending, startTransition] = useTransition();

  const handleGroupChange = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append("isAdmin", isAdmin.toString());
    selectedGroups.forEach((id) => formData.append("groups[]", id));

    startTransition(async () => {
      const res = await updateUserAction(formData);
      if (res.success) {
        alert("저장 완료");
      }
    });
  };

  return (
    <form onSubmit={submitHandler}>
      {/*{error && <Alert type={error.type} message={error.message} />}*/}
      <input type="hidden" name="id" value={user.id} />
      {/* 회원 기본설정 */}
      <div className="grid grid-cols-4 gap-8 py-10">
        <div className="col-span-1">
          <div className="text-lg font-semibold text-gray-600 mb-3">
            회원 기본설정
          </div>
          <div className="text-gray-400 text-sm">
            회원의 기본설정을 변경합니다.
          </div>
        </div>
        <div className="col-span-3">
          <div className="grid gap-8">
            <div>
              <label className="block mb-3 text-sm text-black">아이디</label>
              <input
                type="text"
                name="accountId"
                defaultValue={user.accountId}
                className="border w-full py-2 px-3 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block mb-3 text-sm text-black">닉네임</label>
              <input
                type="text"
                name="nickname"
                defaultValue={user.nickName}
                className="border w-full py-2 px-3 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block mb-3 text-sm text-black">비밀번호</label>
              <input
                type="password"
                name="password"
                placeholder="변경 시에만 입력"
                className="border w-full py-2 px-3 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 추가설정 */}
      <div className="grid grid-cols-4 gap-8 py-10 border-t border-gray-200">
        <div className="col-span-1">
          <div className="text-lg font-semibold text-gray-600 mb-3">
            추가설정
          </div>
          <div className="text-gray-400 text-sm">
            회원가입시 입력한 내용 이외의 정보를 기입합니다.
          </div>
        </div>
        <div className="col-span-3">
          <div className="grid gap-8">
            <div>
              <label className="block mb-3 text-sm text-black">
                관리자 설정
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <span>관리자 권한</span>
              </label>
            </div>

            <div>
              <label className="block mb-3 text-sm text-black">그룹 설정</label>
              <div className="flex flex-wrap gap-4">
                {groupList.map((group) => (
                  <label key={group.id} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => handleGroupChange(group.id)}
                    />
                    <span className="text-sm">{group.groupTitle}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm text-black">메모</label>
              <textarea
                name="memo"
                defaultValue={user.memo}
                className="w-full border rounded-md py-2 px-4 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 justify-center bg-slate-100/50 pt-5 pb-10 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm text-white bg-dark-500 rounded-md"
        >
          뒤로가기
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-sm text-white bg-orange-500 hover:bg-cyan-600 rounded-md"
        >
          저장하기
        </button>
      </div>
    </form>
  );
};

export default UpdateFormClient;

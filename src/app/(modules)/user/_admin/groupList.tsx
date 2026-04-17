"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/core/components/message/Alert";
import Modal from "@/core/components/modal/Modal";
// 💡 InputField 가져오기
import InputField from "@/core/components/form/InputField";

import { GroupInfo } from "@modules/user/_actions/_type";
import { upsertGroup, deleteGroup } from "@modules/user/_actions/group.action";

// 🎨 그룹 폼에 어울리는 아이콘 정의
const GroupTitleIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const GroupIdIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
  </svg>
);

const GroupDescIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

type Props = {
  initialGroupList: GroupInfo[];
};

const DashboardUserGroupList = ({ initialGroupList }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [groupUpdate, setGroupUpdate] = useState<GroupInfo | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const closeModal = (close: boolean) => {
    setShowModal(close);
  };

  const handleGroupInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const response = await upsertGroup(formData);

        if (response.success || response.type === "success") {
          setShowModal(false);
          setMessage({ type: "success", message: response.message });
          router.refresh();
        } else {
          setMessage({ type: "error", message: response.message });
        }
      } catch (error) {
        setMessage({ type: "error", message: "처리 중 오류가 발생했습니다." });
      }
    });
  };

  const handleGroupDelete = async (groupId: number | undefined | null) => {
    if (!groupId) return;

    if (confirm("정말 삭제하시겠습니까?")) {
      startTransition(async () => {
        try {
          const response = await deleteGroup(groupId);
          if (response.success || response.type === "success") {
            setMessage({ type: "success", message: response.message });
            router.refresh();
          } else {
            setMessage({ type: "error", message: response.message });
          }
        } catch (error) {
          setMessage({ type: "error", message: "삭제 중 오류가 발생했습니다." });
        }
      });
    }
  };

  const handleGroupUpdate = (group: GroupInfo) => {
    setGroupUpdate(group);
    setShowModal(true);
    setMessage(null);
  };

  return (
    <>
      <div className="max-w-screen-2xl mx-auto px-3">
        {/* ... (테이블 영역은 이전과 완전히 동일하므로 생략 없이 그대로 유지) ... */}
        {message && <Alert message={message.message} type={message.type} />}

        <table className="w-full">
          <thead>
          <tr>
            <th className="text-sm bg-gray-100 py-1.5">그룹명</th>
            <th className="text-sm bg-gray-100 py-1.5">그룹ID</th>
            <th className="text-sm bg-gray-100 py-1.5">그룹소개</th>
            <th className="text-sm bg-gray-100 py-1.5">기본 그룹</th>
            <th className="text-sm bg-gray-100 py-1.5">조회/수정/삭제</th>
          </tr>
          </thead>
          <tbody>
          {initialGroupList && initialGroupList.length > 0 ? (
            initialGroupList.map((group, index) => (
              <tr key={group.id || index} className="odd:bg-white even:bg-gray-50 border-b border-gray-100">
                <td className="py-3 px-2">
                  <div className="text-gray-500 text-sm text-center">{group.groupTitle}</div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-gray-500 text-sm text-center">{group.groupName}</div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-gray-500 text-sm text-center">{group.groupDesc}</div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="text-gray-500 text-sm text-center">{group.groupDefault ? "Y" : "N"}</div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleGroupUpdate(group)} className="text-sm text-cyan-600 underline" disabled={isPending}>
                      수정
                    </button>
                    <button onClick={() => handleGroupDelete(group.id)} className="text-sm text-red-500 underline ml-2" disabled={isPending}>
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-10 text-center text-gray-500">등록된 그룹이 없습니다.</td>
            </tr>
          )}
          </tbody>
        </table>

        <div className="flex justify-end pt-4 pb-8">
          <button
            onClick={() => {
              setMessage(null);
              setGroupUpdate(null);
              setShowModal(true);
            }}
            className="text-sm text-white bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-md"
          >
            추가하기
          </button>
        </div>
      </div>

      {/* 💡 모달 창 영역 수정됨 */}
      <Modal state={showModal} close={closeModal} size="sm" position="center" escClose={true} overlay={true} overlayClose={true}>
        <div className="bg-white">
          <div className="flex gap-8 px-3 py-3 border-b border-gray-100">
            <div className="flex items-center flex-1">
              <div className="text-base font-medium text-gray-950 px-3">
                {groupUpdate ? "그룹수정" : "그룹추가"}
              </div>
            </div>
            <div>
              <button onClick={() => setShowModal(!showModal)} className="rounded-full p-1 z-10 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-5 text-gray-900">
            <form onSubmit={handleGroupInfo} key={groupUpdate?.id || "new"}>
              <input type="hidden" name="groupId" defaultValue={groupUpdate?.id?.toString() || ""} />

              {/* 💡 기존의 보기 싫던 가로형 라벨 + 인풋 구조를 InputField 하나로 깔끔하게 통일! */}
              <div className="flex flex-col gap-4">

                <InputField
                  inputTitle="그룹명"
                  name="groupTitle"
                  type="text"
                  defaultValue={groupUpdate?.groupTitle || ""}
                  icon={GroupTitleIcon}
                  placeholder="예: 정회원, VVIP 회원"
                />

                <div>
                  <InputField
                    inputTitle="그룹ID"
                    name="groupName"
                    type="text"
                    defaultValue={groupUpdate?.groupName || ""}
                    icon={GroupIdIcon}
                    placeholder="예: vvip_member"
                    readOnly={!!groupUpdate} // 수정 모드일 때는 ID 변경 불가!
                  />
                  {/* 안내 문구는 InputField 바로 아래에 자연스럽게 배치 */}
                  <div className="bg-gray-50 text-xs text-gray-500 py-2 px-3 rounded-md mt-2">
                    영문으로 작성해주세요. 한 번 정한 ID는 변경이 불가능합니다.
                  </div>
                </div>

                <InputField
                  inputTitle="그룹소개"
                  name="groupDesc"
                  type="text"
                  defaultValue={groupUpdate?.groupDesc || ""}
                  icon={GroupDescIcon}
                  placeholder="그룹에 대한 간단한 설명을 적어주세요."
                />

              </div>

              <div className="flex justify-end pt-5 mt-5 border-t border-gray-100">
                <button type="submit" disabled={isPending} className="text-sm text-white bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-md disabled:bg-gray-400">
                  {isPending ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DashboardUserGroupList;
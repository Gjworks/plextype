"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Alert from "@plextype/components/message/Alert";
import Modal from "@plextype/components/modal/Modal";

import {
  upsertGroup,
  deleteGroup,
} from "@/extentions/user/admin/scripts/groupController";

import { GroupInfo } from "@/extentions/user/admin/scripts/groupModel";

interface GroupInfo {
  id?: number | null;
  groupTitle: string | undefined;
  groupName: string | undefined;
  groupDesc: string | undefined;
  groupDefault: boolean;
  // 필요한 다른 속성들도 여기에 추가할 수 있습니다.
}
const DashboardUserGroupList = () => {
  const [groupList, setGroupList] = useState<GroupInfo[]>([]); // groupList: [{groupId, groupName, groupTitle, groupDesc, groupDefault}
  const [groupUpdate, setGroupUpdate] = useState<GroupInfo | null>(null);

  const [message, setMessage] = useState<{
    type: string;
    message: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const closeModal = (close) => {
    setShowModal(close);
  };

  const groupListData = () => {
    GroupInfo().then((response) => {
      console.log(response);
      if (response.success) {
        setGroupList(response.data);
      }
    });
  };

  useEffect(() => {
    groupListData();
  }, []);

  const handleGroupInfo = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("groupId", e.target.groupId.value);
    formData.append("groupName", e.target.groupName.value);
    formData.append("groupTitle", e.target.groupTitle.value);
    formData.append("groupDesc", e.target.groupDesc.value);

    await upsertGroup(formData)
      .then((response) => {
        if (response.code === "error") {
          console.error(response.message);
        } else {
          setShowModal(false);
          response.type === "success" &&
            setMessage({ type: response.type, message: response.message });
          groupListData();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleGroupUpdate = async (
    groupId,
    groupTitle,
    groupName,
    groupDesc,
    groupDefault,
  ) => {
    setGroupUpdate({
      id: groupId,
      groupTitle: groupTitle,
      groupName: groupName,
      groupDesc: groupDesc,
      groupDefault: groupDefault,
    });
    setShowModal(true);
    setMessage(null);
  };

  const handleGroupDelete = async (groupId) => {
    confirm("정말 삭제하시겠습니까?") &&
      (await deleteGroup(groupId).then((response) => {
        if (response.type === "error") {
          console.error(response.message);
        } else {
          response.type === "success" &&
            setMessage({ type: response.type, message: response.message });
          groupListData();
        }
      }));
  };

  return (
    <>
      <div className="max-w-screen-2xl mx-auto px-3">
        {message && <Alert message={message.message} type={message.type} />}
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-sm bg-gray-100 py-1.5">그룹명</th>
              <th className="text-sm bg-gray-100 py-1.5">그룹ID</th>
              <th className="text-sm bg-gray-100 py-1.5">그룹소개</th>
              <th className="text-sm bg-gray-100 py-1.5">기본 그룹</th>
              <th className="text-sm bg-gray-100 py-1.5">삭제</th>
            </tr>
          </thead>
          <tbody>
            {groupList &&
              groupList.map((group, index) => (
                <tr
                  key={index}
                  className="odd:bg-white even:bg-gray-50 border-b border-gray-100"
                >
                  <td className="py-3 px-2">
                    <input
                      type="hidden"
                      name="groupId"
                      defaultValue={group.id != null ? group.id : undefined}
                    />
                    <div className="text-gray-500 text-sm text-center">
                      {group.groupTitle}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-gray-500 text-sm text-center">
                      {group.groupName}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-gray-500 text-sm text-center">
                      {group.groupDesc}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="text-gray-500 text-sm text-center">
                      {group.groupDefault}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          handleGroupUpdate(
                            group.id,
                            group.groupTitle,
                            group.groupName,
                            group.groupDesc,
                            group.groupDefault,
                          )
                        }
                        className="text-sm text-cyan-600 underline"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleGroupDelete(group.id)}
                        className="text-sm text-cyan-600 underline"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="flex justify-end pt-4 pb-8">
          <button
            onClick={() => {
              setMessage(null);
              setGroupUpdate({
                groupTitle: "",
                groupName: "",
                groupDesc: "",
                groupDefault: false,
              });
              setShowModal(true);
            }}
            className="text-sm text-white bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-md"
          >
            추가하기
          </button>
        </div>
      </div>
      <Modal
        state={showModal}
        close={closeModal}
        size="sm"
        position="center"
        escClose={true}
        overlay={true}
        overlayClose={true}
      >
        <div className="bg-white">
          <div className="flex gap-8 px-3 py-3 border-b border-gray-100">
            <div className="flex items-center flex-1">
              <div className="text-base font-medium text-gray-950 line-clamp-1 px-3">
                그룹추가
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowModal(!showModal)}
                className="rounded-full bg-gray-200 hover:bg-gray-200 transition hover:duration-300 hover:scale-125 p-1 z-10"
              >
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1"
                    stroke="currentColor"
                    className="w-5 h-5 text-black dark:text-white "
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </span>
              </button>
            </div>
          </div>
          <div>
            <form onSubmit={handleGroupInfo}>
              <div className="p-3 text-gray-900">
                {message && (
                  <Alert message={message.message} type={message.type} />
                )}
                <input
                  type="hidden"
                  name="groupId"
                  defaultValue={
                    groupUpdate?.id != null ? groupUpdate.id.toString() : ""
                  }
                />
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-center py-2">
                    <label
                      htmlFor="groupTitle"
                      className="w-32 text-center block text-sm font-medium text-gray-700"
                    >
                      그룹명
                    </label>
                    <input
                      type="text"
                      name="groupTitle"
                      id="groupTitle"
                      className="border border-gray-200 hover:border-gray-950 focus:border-gray-950 w-2/3 py-2 px-3 outline-none rounded-md text-sm shadow-sm shadow-gray-100"
                      placeholder="그룹 이름"
                      defaultValue={groupUpdate?.groupTitle}
                    />
                  </div>
                  <div className="flex gap-4 py-2">
                    <label
                      htmlFor="groupName"
                      className="w-32 text-center block text-sm font-medium text-gray-700 pt-2"
                    >
                      그룹ID
                    </label>
                    <div className="w-2/3">
                      <input
                        type="text"
                        name="groupName"
                        id="groupName"
                        className="border border-gray-200 hover:border-gray-950 focus:border-gray-950 w-full py-2 px-3 outline-none rounded-md text-sm shadow-sm shadow-gray-100 mb-2"
                        placeholder="그룹 아이디"
                        defaultValue={groupUpdate?.groupName}
                      />
                      <div className="bg-gray-50 text-sm text-gray-600 py-1 px-3 rounded-md">
                        영문으로 작성해주세요. 고유한 값이어야 합니다. 한번 정한
                        값은 변경이 불가능합니다.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center py-2">
                    <label
                      htmlFor="groupDesc"
                      className="w-32 text-center block text-sm font-medium text-gray-700"
                    >
                      그룹소개
                    </label>
                    <input
                      type="text"
                      name="groupDesc"
                      id="groupDesc"
                      className="border border-gray-200 hover:border-gray-950 focus:border-gray-950 w-2/3 py-2 px-3 outline-none rounded-md text-sm shadow-sm shadow-gray-100"
                      placeholder="그룹 설명"
                      defaultValue={groupUpdate?.groupDesc}
                    />
                  </div>
                  <div className="hidden gap-4 items-center py-2">
                    <label
                      htmlFor="groupDefault"
                      className="w-32 text-center block text-sm font-medium text-gray-700"
                    >
                      기본 그룹
                    </label>
                    <div className="px-3">
                      <label className="m-0">
                        <input
                          type="checkbox"
                          name="groupDefault"
                          className="peer hidden"
                          id="groupDefault"
                          // checked={}
                          // onChange={}
                        />
                        <div className="block relative rounded-full cursor-pointer bg-gray-200 w-12 h-6 after:content-[''] after:absolute top-[1px] after:rounded-full after:h-6 after:w-6 after:shadow-md after:bg-white dark:after:bg-white after:transition-all peer-checked:bg-cyan-500 after:peer-checked:translate-x-6 "></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-3 bg-gray-100">
                <button className="text-sm text-white bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-md">
                  저장하기
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

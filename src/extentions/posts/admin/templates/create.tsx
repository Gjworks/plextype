"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { getPostInfo } from "@/extentions/posts/admin/scripts/actions/getPostInfo";
import { upsertPostInfo } from "@/extentions/posts/admin/scripts/actions/upsertPostInfo";
import { getGroups } from "@/extentions/posts/admin/scripts/actions/getGroups";

import type { PostInfoData } from "@/extentions/posts/admin/scripts/data/post";

// components
import PostInfo from "./components/postInfo";
import PostPermissions from "./components/postPermissions";

interface Group {
  id: number;
  groupName: string;
  groupTitle: string;
  groupDesc?: string;
}

interface Permission {
  subjectType: string;
  subjectId?: number;
}

interface FormData {
  postInfo: PostInfoData;
}

const DashboardPostCreate = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    postInfo: {
      id: 0,
      pid: "",
      postName: "",
      postDesc: "",
      listCount: 20,
      pageCount: 10,
      documentLike: false,
      consultingState: false,
      permissions: {
        listPermissions: [],
        readPermissions: [],
        writePermissions: [],
        commentPermissions: [],
      },
    },
  });

  useEffect(() => {
    (async () => {
      const fetchedGroups = await getGroups();
      const mappedGroups: Group[] = fetchedGroups.map((g) => ({
        id: g.id,
        groupName: g.groupName,
        groupTitle: g.groupTitle,
        groupDesc: g.groupDesc ?? undefined,
      }));
      setGroups(mappedGroups);

      if (id) {
        const data = await getPostInfo(id);
        if (data) {
          // permissions 없으면 초기값 사용
          console.log(data);
          setFormData({
            postInfo: {
              ...data,
              permissions: data.permissions ?? formData.postInfo.permissions,
            },
          });
        }
      }

      setLoading(false);
    })();
  }, [id]);

  if (loading) return null;

  // postInfo 변경 처리
  const handlePostInfoChange = (val: Partial<PostInfoData>) => {
    setFormData((prev) => ({
      postInfo: {
        ...prev.postInfo,
        ...val,
        permissions: val.permissions ?? prev.postInfo.permissions, // 안전하게
      },
    }));
  };

  const handlePermissionsChange = (val: PostInfoData["permissions"]) => {
    setFormData((prev) => ({
      postInfo: {
        ...prev.postInfo,
        permissions: val,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      await upsertPostInfo(Number(id), formData.postInfo);
      console.log("저장 성공!");
      // router.push("/dashboard/posts/list");
    } catch (error) {
      console.error("저장 실패:", error);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-3">
      <PostInfo
        id={id}
        value={formData.postInfo}
        onChange={handlePostInfoChange}
      />
      <div className="w-full h-px border-b border-gray-200"></div>

      {groups.length > 0 && (
        <PostPermissions
          id={id}
          value={formData.postInfo.permissions}
          onChange={handlePermissionsChange}
          groups={groups}
        />
      )}

      <div className="flex gap-4 justify-center pt-5 pb-10 border-t border-slate-200">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-5 py-2 text-sm text-white bg-orange-500 hover:bg-cyan-600 rounded-md"
        >
          저장하기
        </button>
      </div>
    </div>
  );
};

export default DashboardPostCreate;

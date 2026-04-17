// DashboardPostCreate.tsx (Client Component)
"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePostsInfo } from "@modules/posts/_actions/posts.action";
import type { PostInfoData } from "@modules/posts/_actions/_type";

import PostInfo from "./components/postInfo";
import PostPermissions from "./components/postPermissions";
import Button from "@/core/components/button/Button";
import Alert from "@/core/components/message/Alert";

const DashboardPostCreate = ({ initialData, groupList, mid }: {
  initialData: any;
  groupList: any[];
  mid: string;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<{
    type: string;
    message: string;
    fields?: Record<string, string>; // 👈 필드별 에러 저장용
  } | null>(null);

  // 💡 유저 UpsertForm처럼 서버에서 받은 데이터로 즉시 상태 초기화!
  const [formData, setFormData] = useState<{ postInfo: PostInfoData }>({
    postInfo: {
      ...initialData,
      config: initialData.config || { listCount: 20, pageCount: 10, documentLike: false, consultingState: false },
      permissions: initialData.permissions || { listPermissions: [], readPermissions: [], writePermissions: [], commentPermissions: [] }
    },
  });

  const isUpdateMode = mid !== "create";

  // 통합 핸들러 (config 내부 값 자동 판별)
  const handlePostInfoChange = (val: Partial<PostInfoData> | any) => {
    setFormData((prev) => {
      const nextInfo = { ...prev.postInfo };
      const configKeys = ["listCount", "pageCount", "documentLike", "consultingState"];

      Object.entries(val).forEach(([key, value]) => {
        if (configKeys.includes(key)) {
          nextInfo.config = { ...nextInfo.config, [key]: value };
        } else {
          (nextInfo as any)[key] = value;
        }
      });
      return { ...prev, postInfo: nextInfo };
    });
  };

  const handlePermissionsChange = (val: PostInfoData["permissions"]) => {
    setFormData((prev) => ({ ...prev, postInfo: { ...prev.postInfo, permissions: val } }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const info = formData.postInfo;
    const fd = new FormData();

    if (info.id) fd.append("id", String(info.id));
    fd.append("mid", info.mid);
    fd.append("moduleName", info.moduleName);
    fd.append("moduleDesc", info.moduleDesc || "");
    fd.append("config", JSON.stringify(info.config));
    fd.append("permissions", JSON.stringify(info.permissions));

    try {
      const res = await savePostsInfo(fd, "/admin/posts/list");

      if (!res.success) {
        // 1. 에러 상태 저장 (Alert 출력용)
        setError({
          type: res.type || "error",
          message: res.message,
          fields: res.fieldErrors
        });

        // 💡 2. 포커싱 로직 추가
        if (res.fieldErrors) {
          // 첫 번째 에러가 발생한 필드명을 가져옵니다 (예: "mid")
          const firstErrorField = Object.keys(res.fieldErrors)[0];

          // 렌더링 타이밍을 위해 setTimeout을 살짝 주어 요소가 확실히 존재할 때 실행합니다.
          setTimeout(() => {
            const element = document.getElementById(firstErrorField);
            if (element) {
              element.focus();
              // 필요하다면 해당 위치로 스크롤
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 100);
        }

        setLoading(false);
        return;
      }

      // 💡 3. 성공 시: 로딩을 먼저 끄거나 알림창 직후에 조절
      alert(isUpdateMode ? "게시판 설정이 수정되었습니다." : "게시판이 등록되었습니다.");

      // 페이지 이동은 백그라운드에서 부드럽게 처리
      router.push("/admin/posts/list");
      // router.refresh();

      // 이동을 시작했으므로 로딩을 꺼줍니다.
      setLoading(false);
    } catch (err) {
      setError({ type: "error", message: "시스템 오류가 발생했습니다." });
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && <div className="mb-6"><Alert message={error.message} type={error.type} /></div>}

      <PostInfo
        id={mid}
        value={formData.postInfo}
        onChange={handlePostInfoChange}
      />

      <div className="w-full h-px border-b border-gray-100 my-8"></div>

      <PostPermissions
        id={mid}
        value={formData.postInfo.permissions}
        onChange={handlePermissionsChange}
        groups={groupList}
      />

      <div className="flex gap-4 justify-center pt-10 pb-20 border-t border-slate-200 mt-10">
        <Button
          type="button"
          onClick={handleSubmit}
          isLoading={loading}
          fullWidth={false}
          className="px-12 py-3 text-white bg-orange-500 hover:bg-orange-600 rounded-md"
        >
          {isUpdateMode ? "저장하기" : "생성하기"}
        </Button>
      </div>
    </div>
  );
};

export default DashboardPostCreate;
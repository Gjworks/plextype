"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

import type { Attachment as IAttachment } from "@modules/attachment/_actions/_type";

// 그리고 컴포넌트는 원래대로 가져옵니다.
import { Attachment } from "@modules/attachment";
import { usePostContext } from "./PostProvider";
import PostNotPermission from "@modules/posts/_tpl/default/notPermission";
import ExtraFieldRenderer from "@modules/posts/_tpl/default/ExtraFieldRenderer";
import TiptapEditor from "@components/editor/tiptap/tiptapEditor";
import Button from "@components/button/Button";
import InputField from "@components/form/InputField";

// 1. 프롭 타입 정의 (이게 빠지면 에러 납니다)
interface PostWriteProps {
  savePost: (formData: FormData) => Promise<any>;
  existingPost?: {
    id: number;
    categoryId: number | null;
    title: string | null;
    content: string | null;
    extraFieldData?: any;
  } | null;
}

const PostWrite: React.FC<PostWriteProps> = ({ savePost, existingPost }) => {
  const { postInfo, permissions } = usePostContext();
  const router = useRouter();

  // 2. 필수 상태 및 Ref 선언
  const formRef = useRef<HTMLFormElement | null>(null);
  const editorRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(existingPost?.title || "");
  const [content, setContent] = useState(existingPost?.content || "");
  const [extraData, setExtraData] = useState<any>(existingPost?.extraFieldData || {});

  // 🌟 1. tempId 상태를 추가합니다. (신규 글 작성용)


  // 권한 체크
  if (!permissions.doWrite) return <PostNotPermission />;

  // 3. 저장 함수 (이게 정의되어 있어야 합니다)
  const handleSubmit = async (form: HTMLFormElement | null) => {
    if (!form || loading || !editorRef.current) return;

    setLoading(true);
    try {
      const formData = new FormData(form);

      // Tiptap 에디터에서 JSON 추출 (혹은 getHTML())
      const jsonContent = editorRef.current.getJSON();
      formData.append("content", JSON.stringify(jsonContent));
      if (extraData) {
        Object.entries(extraData).forEach(([key, value]) => {
          // 만약 서버가 'extraData__필드명' 형식을 기대한다면 아래처럼 보냅니다.
          formData.append(`extraData__${key}`, value as string);

          // 만약 서버가 그냥 '필드명' 그대로를 기대한다면 아래처럼 보냅니다.
          // formData.append(key, value as string);
        });
      }



      const res = await savePost(formData);

      if (res.success) {
        alert(res.message || "저장되었습니다.");
        router.push(`/posts/${postInfo.mid}`);
        router.refresh(); // 목록 갱신
      } else {
        alert(res.message || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("시스템 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = (file: IAttachment) => {
    const editor = editorRef.current;
    if (!editor) return;

    // 🌟 Tiptap 에디터에서 해당 경로를 가진 이미지를 찾아 삭제하는 마법의 코드
    editor.commands.command(({ tr, state }) => {
      const { doc } = state;
      let posToDelete: number[] = [];

      // 본문을 훑으며 이미지 노드 중 src가 일치하는 위치(pos)를 모두 찾습니다.
      doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === file.path) {
          posToDelete.push(pos);
        }
      });

      // 찾은 위치를 뒤에서부터 지웁니다 (앞에서 지우면 뒤쪽 인덱스가 밀리기 때문)
      posToDelete.reverse().forEach((pos) => {
        tr.delete(pos, pos + 1);
      });

      return true;
    });

    // 에디터 상태를 강제로 업데이트해서 usedFiles가 다시 계산되게 함
    setContent(editor.getHTML());
  };

  return (
    <form ref={formRef} className="space-y-6">
      {/* 4. 수정 모드일 때 ID 전송 */}
      {existingPost && <input type="hidden" name="id" value={existingPost.id} />}

      {/* 카테고리 선택 (데이터가 있을 때만) */}
      {postInfo.categories && postInfo.categories.length > 0 && (
        <select
          name="categoryId"
          defaultValue={existingPost?.categoryId ?? ""}
          className="w-full border p-2 rounded-lg"
        >
          <option value="">카테고리 선택</option>
          {postInfo.categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.title}</option>
          ))}
        </select>
      )}

      <div className="text-center text-2xl font-semibold py-8">{postInfo.moduleName}</div>
      <InputField
        inputTitle="제목"
        type="text"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력해주세요."
        className="w-full border-b-2 py-3 text-xl outline-none focus:border-blue-500 font-semibold"
        // 혹시 label이 필요한 구조라면 아래 주석을 해제하세요.
        // label="제목"
      />

      {/* 🌟 [추가] 확장 필드 렌더러 */}
      {postInfo.extraFields && postInfo.extraFields.length > 0 && (
        <div className="">
          <ExtraFieldRenderer
            fields={postInfo.extraFields}
            value={extraData}
            onChange={(newData) => setExtraData(newData)}
          />
        </div>
      )}

      {/* 에디터 (Tiptap) */}
      <div className="min-h-[400px]">
        <TiptapEditor
          ref={editorRef}
          initialContent={existingPost?.content || ""}
          // 🌟 빈 함수를 추가해서 에러를 해결합니다.
          onChange={(html: string) => {
            setContent(html);
          }}
        />
      </div>

      {/* 🌟 [핵심 조립] 첨부파일 엔진 */}
      <div className="">

        <Attachment.Box
          content={content}
          onFileClick={(file) => {
            const editor = editorRef.current;
            if (!editor) return;

            if (file.mimeType.startsWith("image/")) {
              // 🌟 [수정] setImage 대신 insertContent를 사용합니다.
              editor.chain()
                .focus() // 에디터에 다시 집중!
                .insertContent([
                  {
                    type: 'image',
                    attrs: {
                      src: file.path,
                      alt: file.name
                    }
                  },
                  {
                    type: 'paragraph' // 💡 센스 있게 이미지 다음에 빈 줄(문단) 하나 추가!
                  }
                ])
                .run();
            } else {
              // 링크 삽입은 기존과 동일하게 유지해도 됩니다 (이미 insertContent를 쓰고 계셨네요!)
              editor.chain().focus().insertContent(
                `<a href="${file.path}" target="_blank" class="text-blue-600 underline">${file.name}</a> `
              ).run();
            }
          }}
          onFileDelete={handleFileDelete}
        />
      </div>

      {/* 하단 버튼 바 */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-100 text-gray-600"
        >
          취소
        </Button>
        <Button
          type="button"
          isLoading={loading}
          onClick={() => handleSubmit(formRef.current)}
          className="!bg-blue-100 !text-blue-500 hover:!bg-blue-500 hover:!text-white px-10"
        >
          저장하기
        </Button>
      </div>
    </form>
  );
};

export default PostWrite;
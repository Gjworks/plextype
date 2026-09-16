export type BroadcastDraft = {
  audience: "users" | "groups" | "all";
  ids: number[];
  title: string;
  content: string;
  linkUrl: string;
  channels: { notification: boolean; web: boolean; app: boolean };
};
export type BroadcastJob = {
  id: string;
  actorId: number;
  draft: BroadcastDraft;
  createdAt: string;
  total: number;
  pending: number;
  sending: number;
  done: number;
  failed: number;
  skipped: number;
  unknown: number;
};
export type RecipientOption = { id: number; label: string; detail: string };
export type BroadcastPreview = { count: number; webUsers: number; appUsers: number };
export type BroadcastResult<T> = { success: true; data: T } | { success: false; message: string };

export function validateBroadcast(value: unknown): BroadcastDraft {
  if (!value || typeof value !== "object") throw new Error("발송 내용을 확인해 주세요.");
  const data = value as BroadcastDraft;
  if (!["users", "groups", "all"].includes(data.audience)) throw new Error("발송 대상을 선택해 주세요.");
  if (!Array.isArray(data.ids) || data.ids.length > 500 || data.ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error("대상 선택이 올바르지 않습니다.");
  const ids = [...new Set(data.ids)];
  if (data.audience !== "all" && ids.length === 0) throw new Error("회원 또는 그룹을 선택해 주세요.");
  if (data.audience === "all" && ids.length) throw new Error("전체 발송의 개별 선택을 지워 주세요.");
  if (typeof data.title !== "string" || !data.title.trim() || data.title.trim().length > 100) throw new Error("제목은 1~100자로 입력해 주세요.");
  if (typeof data.content !== "string" || !data.content.trim() || data.content.trim().length > 2000) throw new Error("내용은 1~2,000자로 입력해 주세요.");
  if (typeof data.linkUrl !== "string" || data.linkUrl.length > 500 || !/^\/(?!\/)/.test(data.linkUrl) || /[\\\s\u0000-\u001f]/.test(data.linkUrl)) throw new Error("이동 주소는 /로 시작하는 사이트 내부 경로여야 합니다.");
  try {
    if (new URL(data.linkUrl, "https://local.invalid").origin !== "https://local.invalid") throw new Error();
  } catch { throw new Error("이동 주소가 올바르지 않습니다."); }
  if (!data.channels || [data.channels.notification, data.channels.web, data.channels.app].some(item => typeof item !== "boolean") || !Object.values(data.channels).some(item => item === true)) throw new Error("발송 채널을 선택해 주세요.");
  const channels = { notification: data.channels.notification, web: data.channels.web, app: data.channels.app };
  if (!channels.notification && !channels.web && !channels.app) throw new Error("발송 채널을 선택해 주세요.");
  return { audience: data.audience, ids, title: data.title.trim(), content: data.content.trim(), linkUrl: data.linkUrl, channels };
}

export function validateBroadcastId(value: string) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error("발송 요청 ID가 올바르지 않습니다.");
  return value;
}

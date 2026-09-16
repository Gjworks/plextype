"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { getNotificationSettingsRuntimeAction } from "@/modules/admin/actions/settings.action";
import { notificationEvents } from "@/core/utils/trigger/notificationEvents";
import { sendPushNotificationAction } from "./push.action";
import { sendWebPushNotificationAction } from "./web-push.action";
import * as query from "./broadcast.query";
import { validateBroadcast, validateBroadcastId, type BroadcastDraft, type BroadcastJob, type BroadcastPreview, type BroadcastResult, type RecipientOption } from "../broadcast";

async function admin() {
  const session = await getUserSessionAction();
  return session.success && session.data?.isAdmin ? session.data.id : null;
}
const denied = { success: false as const, message: "관리자 권한이 필요합니다." };
const unavailable = { success: false as const, message: "발송 데이터를 처리하지 못했습니다. DB 마이그레이션 적용 여부와 서버 로그를 확인해 주세요." };

export async function getBroadcastOverviewAdminAction() {
  if (!await admin()) return denied;
  try {
    const ready = await query.broadcastTablesReadyQuery();
    const settings = await getNotificationSettingsRuntimeAction();
    return { success: true as const, data: { ready, webEnabled: settings.webPushEnabled, appEnabled: settings.fcmPushEnabled, groups: await query.listBroadcastGroupsQuery(), jobs: ready ? await query.listBroadcastsQuery() : [] } };
  } catch { return unavailable; }
}

export async function searchBroadcastRecipientsAdminAction(kind: "users" | "groups", text: string): Promise<BroadcastResult<RecipientOption[]>> {
  if (!await admin()) return denied;
  if (!["users", "groups"].includes(kind) || typeof text !== "string" || text.length > 100) return { success: false, message: "검색어를 확인해 주세요." };
  try { return { success: true, data: await query.searchBroadcastRecipientsQuery(kind, text.trim()) }; }
  catch { return unavailable; }
}

export async function previewBroadcastAdminAction(input: unknown): Promise<BroadcastResult<BroadcastPreview>> {
  if (!await admin()) return denied;
  let draft: BroadcastDraft;
  try { draft = validateBroadcast(input); } catch (e) { return { success: false, message: (e as Error).message }; }
  try {
    if (!await query.broadcastTablesReadyQuery()) return unavailable;
    return { success: true, data: await query.previewBroadcastQuery(draft) };
  } catch { return unavailable; }
}

export async function createBroadcastAdminAction(id: string, input: unknown, expectedCount: number): Promise<BroadcastResult<BroadcastJob>> {
  const actorId = await admin();
  if (!actorId) return denied;
  let draft: BroadcastDraft;
  try {
    validateBroadcastId(id);
    draft = validateBroadcast(input);
    if (!Number.isSafeInteger(expectedCount) || expectedCount <= 0) throw new Error("발송 대상을 먼저 확인해 주세요.");
  } catch (e) { return { success: false, message: (e as Error).message }; }
  try {
    await query.createBroadcastQuery(id, actorId, draft, expectedCount);
    return { success: true, data: (await query.listBroadcastsQuery(id))[0] };
  } catch (error) {
    console.error("createBroadcastAdminAction failed", error);
    return { success: false, message: "발송 등록에 실패했습니다. 대상 수 변경 또는 DB 상태를 확인해 주세요. 응답 유실 시 같은 요청으로 재시도할 수 있습니다." };
  }
}

export async function processBroadcastBatchAdminAction(id: string): Promise<BroadcastResult<BroadcastJob>> {
  if (!await admin()) return denied;
  try { validateBroadcastId(id); } catch { return { success: false, message: "발송 ID가 올바르지 않습니다." }; }
  try {
    const [job] = await query.listBroadcastsQuery(id);
    if (!job) return { success: false, message: "발송 내역을 찾을 수 없습니다." };
    const draft = validateBroadcast(job.draft);
    const settings = await getNotificationSettingsRuntimeAction();
    const rows = await query.claimBroadcastRecipientsQuery(id);
    await Promise.all(rows.map(async row => {
      try {
        if (!await query.recipientStillEligibleQuery(row.userId)) {
          await query.finishBroadcastRecipientQuery(row.id, "skipped", { reason: "수신 거부 또는 비활성 회원" });
          return;
        }
        let delivered = 0;
        let failures = 0;
        let uncertain = false;
        const result: Record<string, unknown> = {};
        if (draft.channels.notification) {
          try {
          const notification = await query.saveBroadcastNotificationQuery(id, row.userId, draft);
          result.notification = "알림센터 저장 완료";
          delivered++;
          if (settings.realtimeNotificationsEnabled) {
            try { notificationEvents.emit("new-notification", { ...notification, showToast: settings.toastNotificationsEnabled }); }
            catch (error) { console.error("broadcast realtime event failed", error); }
          }
          } catch (error) { console.error("broadcast notification save failed", error); result.notification = "저장 결과 확인 필요"; uncertain = true; }
        }
        const payload = { userId: row.userId, uuid: draft.channels.notification ? `${id}:${row.userId}` : "", type: "info", title: draft.title, content: draft.content, linkUrl: draft.linkUrl };
        if (draft.channels.web) {
          try {
          const sent = await sendWebPushNotificationAction(payload);
          result.web = sent;
          delivered += "sent" in sent ? sent.sent || 0 : 0;
          failures += "failed" in sent ? sent.failed || 0 : 0;
          } catch (error) { console.error("broadcast web push failed", error); result.web = { reason: "발송 결과 확인 필요" }; uncertain = true; }
        }
        if (draft.channels.app) {
          try {
          const sent = await sendPushNotificationAction(payload);
          result.app = sent;
          delivered += "sent" in sent ? sent.sent || 0 : 0;
          failures += "failed" in sent ? sent.failed || 0 : 0;
          } catch (error) { console.error("broadcast app push failed", error); result.app = { reason: "발송 결과 확인 필요" }; uncertain = true; }
        }
        await query.finishBroadcastRecipientQuery(row.id, uncertain ? "unknown" : failures ? "failed" : delivered ? "done" : "skipped", result);
      } catch (error) {
        console.error("broadcast delivery outcome uncertain", { id, userId: row.userId, error });
        await query.finishBroadcastRecipientQuery(row.id, "unknown", { reason: "일부 채널의 결과를 확인할 수 없습니다. 중복 방지를 위해 자동 재발송하지 않습니다." });
      }
    }));
    return { success: true, data: (await query.listBroadcastsQuery(id))[0] };
  } catch (error) {
    console.error("processBroadcastBatchAdminAction failed", error);
    return { success: false, message: "발송 처리가 중단되었습니다. 발송 내역에서 상태를 확인하고 남은 대상을 이어서 처리해 주세요." };
  }
}

export async function getBroadcastResultsAdminAction(id: string) {
  if (!await admin()) return denied;
  try {
    validateBroadcastId(id);
    return { success: true as const, data: await query.broadcastResultsQuery(id) };
  } catch { return unavailable; }
}

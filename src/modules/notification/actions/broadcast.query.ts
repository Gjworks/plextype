import prisma, { Prisma } from "@/core/utils/db/prisma";
import type { BroadcastDraft, BroadcastJob, BroadcastPreview, RecipientOption } from "../broadcast";

const eligible = Prisma.sql`(u."status" IS NULL OR u."status" = 'active') AND NOT EXISTS (
  SELECT 1 FROM "UserPreference" p WHERE p."userId" = u.id AND p."notifyAdmin" = false
)`;
function audienceWhere(draft: BroadcastDraft) {
  if (draft.audience === "all") return eligible;
  if (draft.audience === "users") return Prisma.sql`${eligible} AND u.id IN (${Prisma.join(draft.ids)})`;
  return Prisma.sql`${eligible} AND EXISTS (SELECT 1 FROM "UserGroupUser" g WHERE g."userId" = u.id AND g."groupId" IN (${Prisma.join(draft.ids)}))`;
}

export async function broadcastTablesReadyQuery() {
  const [row] = await prisma.$queryRaw<{ ready: boolean }[]>`SELECT to_regclass('public."NotificationBroadcast"') IS NOT NULL AND to_regclass('public."NotificationBroadcastRecipient"') IS NOT NULL AS ready`;
  return row.ready;
}

export async function listBroadcastGroupsQuery(): Promise<RecipientOption[]> {
  const rows = await prisma.userGroup.findMany({ orderBy: { id: "asc" }, select: { id: true, groupTitle: true, groupName: true } });
  return rows.map(row => ({ id: row.id, label: row.groupTitle, detail: row.groupName }));
}

export async function searchBroadcastRecipientsQuery(kind: "users" | "groups", text: string): Promise<RecipientOption[]> {
  if (kind === "groups") {
    const rows = await prisma.userGroup.findMany({ where: { OR: [{ groupTitle: { contains: text, mode: "insensitive" } }, { groupName: { contains: text, mode: "insensitive" } }] }, take: 30, orderBy: { id: "asc" }, select: { id: true, groupTitle: true, groupName: true } });
    return rows.map(row => ({ id: row.id, label: row.groupTitle, detail: row.groupName }));
  }
  const rows = await prisma.user.findMany({ where: { AND: [{ OR: [{ status: null }, { status: "active" }] }, { OR: [{ nickName: { contains: text, mode: "insensitive" } }, { accountId: { contains: text, mode: "insensitive" } }, { email_address: { contains: text, mode: "insensitive" } }] }] }, take: 30, orderBy: { id: "asc" }, select: { id: true, nickName: true, accountId: true } });
  return rows.map(row => ({ id: row.id, label: row.nickName, detail: row.accountId }));
}

export async function previewBroadcastQuery(draft: BroadcastDraft): Promise<BroadcastPreview> {
  const [row] = await prisma.$queryRaw<BroadcastPreview[]>(Prisma.sql`SELECT count(*)::int AS count,
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM "WebPushSubscription" w WHERE w."userId" = u.id AND w."isActive"))::int AS "webUsers",
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM "PushToken" t WHERE t."userId" = u.id AND t."isActive"))::int AS "appUsers"
    FROM "User" u WHERE ${audienceWhere(draft)}`);
  return row;
}

export async function createBroadcastQuery(id: string, actorId: number, draft: BroadcastDraft, expectedCount: number) {
  await prisma.$transaction(async tx => {
    const inserted = await tx.$queryRaw<{ id: string }[]>`INSERT INTO "NotificationBroadcast" (id, "actorId", draft)
      VALUES (${id}, ${actorId}, ${JSON.stringify(draft)}::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id`;
    if (!inserted.length) {
      const [existing] = await tx.$queryRaw<{ matches: boolean }[]>`SELECT ("actorId" = ${actorId} AND draft = ${JSON.stringify(draft)}::jsonb) AS matches FROM "NotificationBroadcast" WHERE id = ${id}`;
      if (!existing?.matches) throw new Error("같은 요청 ID에 다른 발송 내용을 사용할 수 없습니다.");
      return;
    }
    const insertedCount = await tx.$executeRaw(Prisma.sql`INSERT INTO "NotificationBroadcastRecipient" ("broadcastId", "userId")
      SELECT ${id}, u.id FROM "User" u WHERE ${audienceWhere(draft)}`);
    if (!insertedCount || insertedCount !== expectedCount) throw new Error("대상 회원 수가 변경되었습니다. 발송 대상을 다시 확인해 주세요.");
  });
}

const totals = Prisma.sql`count(r.id)::int AS total,
  count(r.id) FILTER (WHERE r.status = 'pending')::int AS pending,
  count(r.id) FILTER (WHERE r.status = 'sending')::int AS sending,
  count(r.id) FILTER (WHERE r.status = 'done')::int AS done,
  count(r.id) FILTER (WHERE r.status = 'failed')::int AS failed,
  count(r.id) FILTER (WHERE r.status = 'skipped')::int AS skipped,
  count(r.id) FILTER (WHERE r.status = 'unknown')::int AS unknown`;
export async function listBroadcastsQuery(id?: string): Promise<BroadcastJob[]> {
  const rows = await prisma.$queryRaw<(Omit<BroadcastJob, "createdAt"> & { createdAt: Date })[]>(Prisma.sql`SELECT b.id, b."actorId", b.draft, b."createdAt", ${totals}
    FROM "NotificationBroadcast" b LEFT JOIN "NotificationBroadcastRecipient" r ON r."broadcastId" = b.id
    ${id ? Prisma.sql`WHERE b.id = ${id}` : Prisma.empty}
    GROUP BY b.id ORDER BY b."createdAt" DESC LIMIT 50`);
  return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function claimBroadcastRecipientsQuery(id: string) {
  // Never retry an ambiguous push after an interrupted request.
  await prisma.$executeRaw`UPDATE "NotificationBroadcastRecipient" SET status = 'unknown', "updatedAt" = CURRENT_TIMESTAMP
    WHERE "broadcastId" = ${id} AND status = 'sending' AND "updatedAt" < CURRENT_TIMESTAMP - interval '10 minutes'`;
  return prisma.$queryRaw<{ id: number; userId: number }[]>`WITH candidates AS (
    SELECT id FROM "NotificationBroadcastRecipient" WHERE "broadcastId" = ${id} AND status = 'pending'
    ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 5
  ) UPDATE "NotificationBroadcastRecipient" r SET status = 'sending', "updatedAt" = CURRENT_TIMESTAMP
    FROM candidates c WHERE r.id = c.id RETURNING r.id, r."userId"`;
}

export async function recipientStillEligibleQuery(userId: number) {
  const rows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`SELECT u.id FROM "User" u WHERE u.id = ${userId} AND ${eligible}`);
  return rows.length > 0;
}

export async function saveBroadcastNotificationQuery(id: string, userId: number, draft: BroadcastDraft) {
  return prisma.notification.upsert({
    where: { uuid: `${id}:${userId}` }, update: {},
    create: { uuid: `${id}:${userId}`, userId, type: "info", title: draft.title, content: draft.content, linkUrl: draft.linkUrl, metadata: { subType: "admin-broadcast", broadcastId: id } },
  });
}

export async function finishBroadcastRecipientQuery(id: number, status: "done" | "failed" | "skipped" | "unknown", result: Record<string, unknown>) {
  await prisma.$executeRaw`UPDATE "NotificationBroadcastRecipient" SET status = ${status}, result = ${JSON.stringify(result)}::jsonb, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${id} AND status = 'sending'`;
}

export async function broadcastResultsQuery(id: string) {
  return prisma.$queryRaw<{ userId: number; status: string; result: Record<string, unknown> | null }[]>`SELECT "userId", status, result FROM "NotificationBroadcastRecipient" WHERE "broadcastId" = ${id} ORDER BY id DESC LIMIT 100`;
}

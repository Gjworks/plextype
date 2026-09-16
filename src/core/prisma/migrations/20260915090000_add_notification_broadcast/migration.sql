CREATE TABLE "NotificationBroadcast" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" INTEGER NOT NULL,
  "draft" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "idx_notification_broadcast_created" ON "NotificationBroadcast"("createdAt");

CREATE TABLE "NotificationBroadcastRecipient" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "broadcastId" TEXT NOT NULL REFERENCES "NotificationBroadcast"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "result" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uniq_broadcast_recipient" UNIQUE ("broadcastId", "userId")
);
CREATE INDEX "idx_broadcast_recipient_status" ON "NotificationBroadcastRecipient"("broadcastId", "status");

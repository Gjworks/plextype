CREATE TABLE "ApiToken" (
  "id" SERIAL NOT NULL,
  "tokenId" VARCHAR(32) NOT NULL,
  "secretHash" VARCHAR(64) NOT NULL,
  "userId" INTEGER NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "scopes" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiToken_tokenId_key" ON "ApiToken"("tokenId");
CREATE INDEX "idx_api_token_user" ON "ApiToken"("userId", "createdAt");

ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

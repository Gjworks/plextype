CREATE TABLE "social_login_account" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "provider" VARCHAR(32) NOT NULL,
  "providerUserId" VARCHAR(191) NOT NULL,
  "email" VARCHAR(191),
  "createdAccount" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "social_login_account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "social_login_account_provider_user_key" ON "social_login_account"("provider", "providerUserId");
CREATE UNIQUE INDEX "social_login_account_user_provider_key" ON "social_login_account"("userId", "provider");

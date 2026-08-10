CREATE TABLE "ServiceDeployInstance" (
  "id" SERIAL NOT NULL,
  "uuid" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "installType" VARCHAR(45) NOT NULL DEFAULT 'plextype',
  "status" VARCHAR(45) NOT NULL DEFAULT 'draft',
  "serviceName" VARCHAR(120) NOT NULL,
  "domain" VARCHAR(255) NOT NULL,
  "projectPath" TEXT NOT NULL,
  "containerName" VARCHAR(160) NOT NULL,
  "hostPort" INTEGER,
  "originRepository" TEXT NOT NULL,
  "upstreamRepository" TEXT,
  "deployBranch" VARCHAR(120) NOT NULL DEFAULT 'main',
  "appName" VARCHAR(120) NOT NULL,
  "appTitle" VARCHAR(160) NOT NULL,
  "adminAccountId" VARCHAR(120) NOT NULL DEFAULT 'admin',
  "adminEmail" VARCHAR(255) NOT NULL,
  "adminNickname" VARCHAR(120) NOT NULL DEFAULT '관리자',
  "dbEngine" VARCHAR(45) NOT NULL DEFAULT 'postgres',
  "dbHost" VARCHAR(120) NOT NULL DEFAULT 'postgres',
  "dbPort" INTEGER NOT NULL DEFAULT 5432,
  "dbName" VARCHAR(120) NOT NULL,
  "dbUser" VARCHAR(120) NOT NULL,
  "dbPasswordManaged" BOOLEAN NOT NULL DEFAULT true,
  "dbPasswordSecretKey" TEXT,
  "redisHost" VARCHAR(120) DEFAULT 'redis',
  "redisPort" INTEGER DEFAULT 6379,
  "useWebPush" BOOLEAN NOT NULL DEFAULT false,
  "useFcm" BOOLEAN NOT NULL DEFAULT false,
  "setupSnapshot" JSONB DEFAULT '{}',
  "note" TEXT,
  "lastError" TEXT,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "ServiceDeployInstance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceDeployJob" (
  "id" SERIAL NOT NULL,
  "uuid" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "instanceId" INTEGER,
  "requestedByUserId" INTEGER,
  "type" VARCHAR(45) NOT NULL DEFAULT 'install',
  "status" VARCHAR(45) NOT NULL DEFAULT 'queued',
  "step" VARCHAR(120),
  "payload" JSONB DEFAULT '{}',
  "logs" JSONB DEFAULT '[]',
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "ServiceDeployJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceDeployInstance_uuid_key" ON "ServiceDeployInstance"("uuid");
CREATE UNIQUE INDEX "ServiceDeployInstance_serviceName_key" ON "ServiceDeployInstance"("serviceName");
CREATE UNIQUE INDEX "ServiceDeployInstance_domain_key" ON "ServiceDeployInstance"("domain");
CREATE INDEX "idx_service_deploy_instance_type" ON "ServiceDeployInstance"("installType");
CREATE INDEX "idx_service_deploy_instance_status" ON "ServiceDeployInstance"("status");
CREATE INDEX "idx_service_deploy_instance_created" ON "ServiceDeployInstance"("createdAt");

CREATE UNIQUE INDEX "ServiceDeployJob_uuid_key" ON "ServiceDeployJob"("uuid");
CREATE INDEX "idx_service_deploy_job_instance" ON "ServiceDeployJob"("instanceId");
CREATE INDEX "idx_service_deploy_job_requested_user" ON "ServiceDeployJob"("requestedByUserId");
CREATE INDEX "idx_service_deploy_job_status" ON "ServiceDeployJob"("status");
CREATE INDEX "idx_service_deploy_job_created" ON "ServiceDeployJob"("createdAt");

ALTER TABLE "ServiceDeployJob"
ADD CONSTRAINT "ServiceDeployJob_instanceId_fkey"
FOREIGN KEY ("instanceId") REFERENCES "ServiceDeployInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

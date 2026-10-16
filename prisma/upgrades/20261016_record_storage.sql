-- AlterTable
ALTER TABLE "AppUser" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WorkspaceRecord" (
    "collection" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceRecord_pkey" PRIMARY KEY ("collection","recordId")
);

-- CreateTable
CREATE TABLE "WorkspaceChange" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceBackup" (
    "id" TEXT NOT NULL,
    "payload" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceAsset" (
    "collection" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "digest" TEXT NOT NULL,

    CONSTRAINT "WorkspaceAsset_pkey" PRIMARY KEY ("collection","recordId","digest")
);

-- CreateIndex
CREATE INDEX "WorkspaceAsset_digest_idx" ON "WorkspaceAsset"("digest");


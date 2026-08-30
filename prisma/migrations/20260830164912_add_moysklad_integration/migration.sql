-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "moySkladCode" TEXT,
ADD COLUMN     "moySkladId" TEXT,
ADD COLUMN     "moySkladUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "IntegrationSettings" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiToken" TEXT,
    "priceTypeName" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "lastSyncSummary" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationSettings_provider_key" ON "IntegrationSettings"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Product_moySkladId_key" ON "Product"("moySkladId");


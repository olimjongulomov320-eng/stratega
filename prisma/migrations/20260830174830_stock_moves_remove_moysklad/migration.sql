-- CreateEnum
CREATE TYPE "StockMoveReason" AS ENUM ('MANUAL', 'IMPORT', 'ORDER');

-- DropIndex
DROP INDEX "Product_moySkladId_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "lastSyncedAt",
DROP COLUMN "moySkladCode",
DROP COLUMN "moySkladId",
DROP COLUMN "moySkladUpdatedAt";

-- DropTable
DROP TABLE "IntegrationSettings";

-- CreateTable
CREATE TABLE "StockMove" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "reason" "StockMoveReason" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMove_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StockMove" ADD CONSTRAINT "StockMove_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;


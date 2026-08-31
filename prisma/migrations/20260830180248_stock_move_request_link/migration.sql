-- AlterTable
ALTER TABLE "StockMove" ADD COLUMN     "requestId" TEXT;

-- CreateIndex
CREATE INDEX "StockMove_productId_idx" ON "StockMove"("productId");

-- CreateIndex
CREATE INDEX "StockMove_requestId_idx" ON "StockMove"("requestId");


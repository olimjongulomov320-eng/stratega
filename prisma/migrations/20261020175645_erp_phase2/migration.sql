-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stockDeductedAt" TIMESTAMP(3),
ADD COLUMN     "stockReservedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OtpCode" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "receivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "responsibleId" TEXT;

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Alert_entity_entityId_idx" ON "Alert"("entity", "entityId");

-- CreateIndex
CREATE INDEX "Payment_receivedAt_idx" ON "Payment"("receivedAt");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "RfqRequest_status_idx" ON "RfqRequest"("status");

-- CreateIndex
CREATE INDEX "RfqRequest_createdAt_idx" ON "RfqRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Shipment_createdAt_idx" ON "Shipment"("createdAt");

-- CreateIndex
CREATE INDEX "StockMove_warehouseId_createdAt_idx" ON "StockMove"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMove_reason_idx" ON "StockMove"("reason");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

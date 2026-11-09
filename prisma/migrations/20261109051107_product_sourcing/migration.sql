-- CreateEnum
CREATE TYPE "ProductSourcing" AS ENUM ('OWN_STOCK', 'SUPPLIER_STOCK');

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "purchaseCost" INTEGER,
ADD COLUMN     "purchasedAt" TIMESTAMP(3),
ADD COLUMN     "sourcing" "ProductSourcing" NOT NULL DEFAULT 'OWN_STOCK',
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sourcing" "ProductSourcing" NOT NULL DEFAULT 'OWN_STOCK';

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

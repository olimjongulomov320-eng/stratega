-- Spare parts section and OLX export
ALTER TABLE "Category" ADD COLUMN "isSparePart" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Category" ADD COLUMN "olxCategory" TEXT;
ALTER TABLE "Product" ADD COLUMN "compatibleWith" TEXT;

-- Categories created by the BISON catalogue import that hold spare parts
UPDATE "Category" SET "isSparePart" = true WHERE "slug" LIKE '%ehtiyot-qism%';

-- Product specs for catalogue filters, spec table, datasheet, video and delivery time.
ALTER TABLE "Product" ADD COLUMN "capacityKg" DOUBLE PRECISION,
ADD COLUMN "liftHeightMm" INTEGER,
ADD COLUMN "workingWidthMm" INTEGER,
ADD COLUMN "powerKw" DOUBLE PRECISION,
ADD COLUMN "specs" JSONB,
ADD COLUMN "datasheetUrl" TEXT,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "leadTimeDays" INTEGER;

ALTER TABLE "Product" ADD CONSTRAINT "Product_specs_nonnegative" CHECK (
  ("capacityKg" IS NULL OR "capacityKg" >= 0) AND ("liftHeightMm" IS NULL OR "liftHeightMm" >= 0) AND
  ("workingWidthMm" IS NULL OR "workingWidthMm" >= 0) AND ("powerKw" IS NULL OR "powerKw" >= 0) AND
  ("leadTimeDays" IS NULL OR "leadTimeDays" >= 0)
);

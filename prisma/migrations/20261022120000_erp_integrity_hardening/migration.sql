-- ============================================================================
-- ERP integritet mustahkamlash (integrity hardening)
--
-- 1) Ombor qoldig'i invarianslarini bazada majburlash (trigger orqali).
-- 2) Qoldiqni o'zgartirish konkurentsiyasini yo'qotishning oldini olish uchun
--    biznes raqamlari uchun sequence'lar.
-- 3) Jo'natma uchun idempotentlik belgisi (stockAppliedAt).
-- 4) Analitika agregatsiyalari uchun indekslar.
--
-- Bu migratsiya mavjud ma'lumotni o'chirmaydi — faqat buzilgan qoldiqlarni
-- tuzatadi va kelgusi yozuvlarni qat'iy tekshiradi.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Mavjud ma'lumotni tuzatish (migratsiya qayta ishga tushsa ham xavfsiz)
-- ---------------------------------------------------------------------------

-- Zaxira qoldiqdan oshgan qatorlar: zaxirani qoldiq chegarasiga tushiramiz.
UPDATE "Stock"
SET "reserved" = "quantity"
WHERE "reserved" > "quantity";

-- Manfiy qoldiqni tuzatish (manfiy qoldiqga ruxsat yoqilgan bo'lsa ham).
UPDATE "Stock"
SET "quantity" = 0
WHERE "quantity" < 0;

-- Nolg'a teng o'zgarishlar jurnalda ma'nosiz — ular hisobni buzadi.
DELETE FROM "StockMove" WHERE "change" = 0;

-- ---------------------------------------------------------------------------
-- 2) Trigger: ombor qoldig'i invarianslari
--
--    * reserved >= 0            — doimiy
--    * reserved <= quantity     — doimiy (available = quantity - reserved >= 0)
--    * quantity >= 0            — administrator "stock.allowNegative"
--                                 sozlamasini yoqgan bo'lsa istisno
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "stock_invariant_guard"() RETURNS trigger AS $$
BEGIN
  IF NEW."reserved" < 0 THEN
    RAISE EXCEPTION 'Zaxira manfiy bo''lishi mumkin emas (reserved=%)', NEW."reserved"
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW."quantity" < 0 THEN
    -- Faqat administrator tomondan aniq yoqilgan override holatida ruxsat.
    IF EXISTS (
      SELECT 1 FROM "Setting" WHERE "key" = 'stock.allowNegative' AND "value" = 'true'
    ) THEN
      IF NEW."reserved" > 0 THEN
        RAISE EXCEPTION 'Manfiy qoldiqda zaxira 0 bo''lishi shart (reserved=%)', NEW."reserved"
          USING ERRCODE = 'check_violation';
      END IF;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Ombor qoldig''i manfiy bo''lishi mumkin emas (quantity=%)', NEW."quantity"
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW."reserved" > NEW."quantity" THEN
    RAISE EXCEPTION 'Zaxira qoldiqdan oshishi mumkin emas (reserved=%, quantity=%)',
      NEW."reserved", NEW."quantity"
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "stock_invariant_guard_trigger" ON "Stock";
CREATE TRIGGER "stock_invariant_guard_trigger"
  BEFORE INSERT OR UPDATE ON "Stock"
  FOR EACH ROW
  EXECUTE FUNCTION "stock_invariant_guard"();

-- Jurnal qatorida o'zgarish hech qachon nolga teng bo'lmasligi kerak.
ALTER TABLE "StockMove"
  DROP CONSTRAINT IF EXISTS "StockMove_change_not_zero";
ALTER TABLE "StockMove"
  ADD CONSTRAINT "StockMove_change_not_zero" CHECK ("change" <> 0);

-- ---------------------------------------------------------------------------
-- 3) Jo'natma uchun idempotentlik belgisi
-- ---------------------------------------------------------------------------

ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "stockAppliedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Shipment_stockAppliedAt_idx" ON "Shipment"("stockAppliedAt");

-- ---------------------------------------------------------------------------
-- 4) Biznes raqamlari uchun sequence'lar
--
--    Avval raqam `count()+1` dan hisoblanardi — bu o'chirilgan yozuvlar
--    yuzaga kelganda raqamni qayta ishlatishga va parallel so'rovlarda
--    to'qnashuvga olib kelardi. Endi sequence raqamlar hech qachon
--    takrorlanmaydi va parallel yaratishda xavfsiz.
-- ---------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS "order_number_seq"      START 1;
CREATE SEQUENCE IF NOT EXISTS "stock_document_seq"    START 1;
CREATE SEQUENCE IF NOT EXISTS "shipment_number_seq"   START 1;
CREATE SEQUENCE IF NOT EXISTS "quotation_number_seq"  START 1;

-- Mavcut ma'lumotning raqamlarini sequence'ga bo'g'lash (keyingi qiymat
-- har doim mavjud eng katta raqamdan keyin bo'lsin).
-- setval(seq, 0) Postgres'da xato (sequence minimal qiymati 1), shuning uchun
-- 0 holatida `is_called = false` bilan 1 dan boshlanadi.
DO $$
DECLARE
  m bigint;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING("number" FROM 6)::int), 0) INTO m
    FROM "Order" WHERE "number" ~ '^ORD-[0-9]+$';
  PERFORM setval('order_number_seq', GREATEST(m, 1), m >= 1);

  SELECT COALESCE(MAX(SUBSTRING("number" FROM 5)::int), 0) INTO m
    FROM "StockDocument" WHERE "number" ~ '^[A-Z]+-[0-9]+$';
  PERFORM setval('stock_document_seq', GREATEST(m, 1), m >= 1);

  SELECT COALESCE(MAX(SUBSTRING("number" FROM 5)::int), 0) INTO m
    FROM "Shipment" WHERE "number" ~ '^SHP-[0-9]+$';
  PERFORM setval('shipment_number_seq', GREATEST(m, 1), m >= 1);

  SELECT COALESCE(MAX(SUBSTRING("number" FROM 5)::int), 0) INTO m
    FROM "Quotation" WHERE "number" ~ '^QUO-[0-9]+$';
  PERFORM setval('quotation_number_seq', GREATEST(m, 1), m >= 1);
END $$;

-- ---------------------------------------------------------------------------
-- 5) Analitika uchun indekslar
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "StockMove_productId_createdAt_idx" ON "StockMove"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "StockMove_reason_createdAt_idx" ON "StockMove"("reason", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");

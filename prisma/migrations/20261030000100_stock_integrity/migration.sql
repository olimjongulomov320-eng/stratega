-- Database-level guards for the stock ledger (idea taken from Website 2's
-- "integrity hardening"). The app already checks these, the database now
-- refuses bad rows even if a bug or a manual SQL edit slips through.
-- Negative on-hand stock stays possible on purpose (inventory counts and the
-- "allow negative stock" setting), so only the always-true rules are enforced.

-- Reserved quantity can never be negative.
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_reserved_not_negative" CHECK ("reserved" >= 0);

-- A ledger row must change something.
ALTER TABLE "StockMove" ADD CONSTRAINT "StockMove_delta_not_zero" CHECK ("delta" <> 0);

-- Quantities on documents and order lines are positive.
ALTER TABLE "StockDocumentLine" ADD CONSTRAINT "StockDocumentLine_quantity_positive" CHECK ("quantity" >= 0);
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_quantity_positive" CHECK ("quantity" > 0);

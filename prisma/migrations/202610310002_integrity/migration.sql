ALTER TABLE "InventoryBalance" ADD CONSTRAINT "balance_nonnegative" CHECK ("onHand" >= 0 AND "reserved" >= 0 AND "reserved" <= "onHand");
ALTER TABLE "UnallocatedStock" ADD CONSTRAINT "unallocated_nonnegative" CHECK ("quantity" >= 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_values" CHECK ("widthCm" > 0 AND "lengthCm" > 0 AND ("heightCm" IS NULL OR "heightCm" > 0) AND ("priceKzt" IS NULL OR "priceKzt" > 0));
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_values" CHECK ("quantity" > 0 AND "unitPriceKzt" > 0);
ALTER TABLE "StockReservation" ADD CONSTRAINT "reservation_positive" CHECK ("quantity" > 0);
ALTER TABLE "StockMovement" ADD CONSTRAINT "movement_target" CHECK (("variantId" IS NOT NULL)::int + ("unallocatedStockId" IS NOT NULL)::int = 1);
ALTER TABLE "StockMovement" ADD CONSTRAINT "movement_delta" CHECK ("quantityDelta" <> 0);
ALTER TABLE "StockMovement" ADD CONSTRAINT "movement_sign" CHECK (
  ("type" = 'SALE' AND "quantityDelta" < 0 AND "unitPriceKzt" > 0)
  OR ("type" = 'RETURN' AND "quantityDelta" > 0 AND "unitPriceKzt" > 0)
  OR ("type" IN ('OPENING', 'RECEIPT') AND "quantityDelta" > 0)
  OR "type" IN ('ADJUSTMENT', 'ALLOCATION')
);
ALTER TABLE "StockCountZone" ADD CONSTRAINT "count_zone_nonnegative" CHECK ("quantity" >= 0);
ALTER TABLE "StockCountLine" ADD CONSTRAINT "count_line_nonnegative" CHECK ("expectedQuantity" >= 0 AND "actualQuantity" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "delivery_fee_nonnegative" CHECK ("deliveryFeeKzt" IS NULL OR "deliveryFeeKzt" >= 0);
CREATE FUNCTION prevent_journal_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'StockMovement is append-only'; END;
$$;
CREATE TRIGGER stock_journal_immutable BEFORE UPDATE OR DELETE ON "StockMovement" FOR EACH ROW EXECUTE FUNCTION prevent_journal_change();

BEGIN;
ALTER TABLE "StockMovement" DROP CONSTRAINT "movement_sign";
ALTER TABLE "StockMovement" ADD CONSTRAINT "movement_sign" CHECK (
  ("type" = 'SALE' AND "quantityDelta" < 0 AND "unitPriceKzt" IS NOT NULL AND "unitPriceKzt" > 0)
  OR ("type" = 'RETURN' AND "quantityDelta" > 0 AND "unitPriceKzt" IS NOT NULL AND "unitPriceKzt" > 0)
  OR ("type" IN ('OPENING', 'RECEIPT') AND "quantityDelta" > 0)
  OR "type" IN ('ADJUSTMENT', 'ALLOCATION')
);
COMMIT;

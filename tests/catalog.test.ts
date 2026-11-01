import assert from "node:assert/strict";
import test from "node:test";
import { products, variants, variantSchema, localeSchema, formatPrice } from "../src/lib/catalog";
import { initialInventory, unallocatedInventory, physicalCount } from "../src/lib/inventory-snapshot";

test("Excel retail prices are preserved for all twelve variants", () => {
  assert.deepEqual(Object.fromEntries(variants.map(v => [v.sku, v.priceKzt])), {
    "CK2601-90x200":99990, "CK2601-160x200":149990, "CK2601-180x200":156990,
    "CK2602-160x200":152990, "CK2602-180x200":158990,
    "CK2603-90x200":99990, "CK2603-160x200":147990, "CK2603-180x200":149990,
    "CK2605-160x200":181990, "CK2605-180x200":187990,
    "CK2606-160x200":199990, "CK2606-180x200":206990,
  });
});

test("only 2601 and 2603 have 90 cm catalog variants", () => {
  assert.deepEqual(variants.filter(v => v.width === 90).map(v => v.model), ["2601", "2603"]);
  assert.equal(new Set(variants.map(v => v.sku)).size, 12);
});

test("known inventory is 89, with ten unallocated and no fabricated SKU balances", () => {
  assert.equal(initialInventory.reduce((sum, b) => sum + b.quantity, 0), 89);
  assert.equal(unallocatedInventory.quantity, 10);
  assert.equal(84 + 10 - 25 + 30, 99);
  assert.equal(initialInventory.reduce((sum, b) => sum + b.quantity, unallocatedInventory.quantity), 99);
  for (const balance of initialInventory) {
    assert(variants.some(v => v.model === balance.model && v.width === balance.width));
    assert(balance.quantity >= 0);
  }
});

test("inventory agrees with owner-supplied model totals and physical zone counts", () => {
  assert.deepEqual(products.map(p => initialInventory.filter(b => b.model === p.model).reduce((s,b) => s+b.quantity,0)), [18,19,27,13,12]);
  assert.equal(physicalCount.reduce((s,z) => s+z.quantity,0),99);
  assert.equal(initialInventory.filter(b => b.width === 160).reduce((s,b) => s+b.quantity,0),33);
  assert.equal(initialInventory.filter(b => b.width === 180).reduce((s,b) => s+b.quantity,0),56);
});

test("invalid prices, sizes and unsupported locales are rejected", () => {
  assert(!variantSchema.safeParse({...variants[0],priceKzt:-1}).success);
  assert(!variantSchema.safeParse({...variants[0],priceKzt:99.5}).success);
  assert(!variantSchema.safeParse({...variants[0],width:140}).success);
  assert(!localeSchema.safeParse("en").success);
});

test("both languages include descriptions and only confirmed model heights", () => {
  assert.deepEqual(products.map(p => p.height),[25,27,25,28,30]);
  for(const p of products) {
    assert(p.description.ru && p.description.kk);
    assert(p.features.ru.length && p.features.kk.length);
    assert(p.variants.every(v => v.height === p.height && v.length === 200));
  }
});

test("KZT grouping is deterministic across server and browser ICU versions", () => {
  assert.equal(formatPrice(156990), "156\u00a0990 ₸");
  assert.equal(formatPrice(0), "0 ₸");
  assert.throws(() => formatPrice(12.5));
  assert.throws(() => formatPrice(-1));
});

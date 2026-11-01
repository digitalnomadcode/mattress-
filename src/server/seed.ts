import { products, productTitle } from "@/lib/catalog";
import { brandName } from "@/lib/brand";
import { initialInventory, physicalCount } from "@/lib/inventory-snapshot";
import { storeContacts } from "@/lib/homepage-content";
import { operation, warehouseLock } from "./operations";

export async function seedStore() {
  return operation("OPENING_IMPORT", "velora-opening-snapshot-v1", { version: 1 }, async tx => {
    await warehouseLock(tx);
    for (const product of products) {
      const saved = await tx.product.create({ data: {
        model: product.model, name: product.name, brand: brandName, published: true, features: product.features,
        translations: { create: (["ru", "kk"] as const).map(locale => ({ locale, title: productTitle(product), description: product.description[locale] })) },
      } });
      for (const variant of product.variants) {
        const quantity = initialInventory.find(b => b.model === product.model && b.width === variant.width)?.quantity || 0;
        const v = await tx.productVariant.create({ data: {
          sku: variant.sku, productId: saved.id, widthCm: variant.width, lengthCm: variant.length, heightCm: variant.height, priceKzt: variant.priceKzt,
          balance: { create: { onHand: quantity, reserved: 0 } },
        } });
        if (quantity) await tx.stockMovement.create({ data: {
          operationKey: `opening:${variant.sku}`, variantId: v.id, type: "OPENING", quantityDelta: quantity,
          reason: "Owner-confirmed opening snapshot; historical sales and receipts already included", occurredAt: null,
        } });
      }
    }
    const unknown = await tx.unallocatedStock.create({ data: {
      reference: "opening-90cm-unallocated", widthCm: 90, lengthCm: 200, quantity: 10, candidateModels: ["2601", "2603"],
      note: "10 items; model distribution between 2601 and 2603 is not yet known",
    } });
    await tx.stockMovement.create({ data: { operationKey: "opening:unallocated-90cm", unallocatedStockId: unknown.id, type: "OPENING", quantityDelta: 10, reason: unknown.note } });
    const names: Record<string, [string,string]> = {
      "rear-right": ["Правая задняя зона", "Артқы оң жақ"], "rear-left": ["Левая задняя зона", "Артқы сол жақ"],
      "front-left": ["Левая передняя зона", "Алдыңғы сол жақ"], "front-right": ["Правая передняя зона", "Алдыңғы оң жақ"],
    };
    const zones = [];
    for (const count of physicalCount) {
      const zone = await tx.warehouseZone.create({ data: { code: count.code, nameRu: names[count.code][0], nameKk: names[count.code][1] } });
      zones.push({ zoneId: zone.id, quantity: count.quantity });
    }
    await tx.stockCount.create({ data: { reference: "owner-opening-physical-count", status: "COMPLETED", accountingSnapshot: 99, zones: { create: zones } } });
    await tx.storeSettings.create({ data: { id: "store", storeName: brandName, ...storeContacts } });
    return { total: 99, allocated: 89, unallocated: 10 };
  });
}

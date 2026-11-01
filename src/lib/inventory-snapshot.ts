import type { ModelCode } from "./catalog";

// Current snapshot supplied by the owner. Historical timestamps/prices unknown.
export const initialInventory: { model: ModelCode; width: 160 | 180; quantity: number }[] = [
  { model: "2601", width: 160, quantity: 6 }, { model: "2601", width: 180, quantity: 12 },
  { model: "2602", width: 160, quantity: 7 }, { model: "2602", width: 180, quantity: 12 },
  { model: "2603", width: 160, quantity: 11 }, { model: "2603", width: 180, quantity: 16 },
  { model: "2605", width: 160, quantity: 5 }, { model: "2605", width: 180, quantity: 8 },
  { model: "2606", width: 160, quantity: 4 }, { model: "2606", width: 180, quantity: 8 },
];
// Not assigned to either sellable SKU until the physical allocation is known.
export const unallocatedInventory = { width: 90, length: 200, quantity: 10, candidateModels: ["2601", "2603"] as const };
export const physicalCount = [
  { code: "rear-right", quantity: 20 }, { code: "rear-left", quantity: 15 },
  { code: "front-left", quantity: 28 }, { code: "front-right", quantity: 36 },
] as const;

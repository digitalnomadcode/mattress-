import type { Locale, ModelCode } from "./catalog";

export type MattressLayer = {
  id: string;
  name: Record<Locale, string>;
  detail: Record<Locale, string>;
  material: "knit" | "knit-dark" | "fabric" | "foam" | "core" | "memory" | "gel" | "profile" | "felt" | "springs";
  // Illustrative geometry only; unknown physical thicknesses are not inferred.
  visualDepth: number;
};

function layer(id: string, ru: string, kk: string, detailRu: string, detailKk: string, material: MattressLayer["material"], visualDepth: number): MattressLayer {
  return { id, name: { ru, kk }, detail: { ru: detailRu, kk: detailKk }, material, visualDepth };
}

const knit = () => layer("cover", "Трикотажная ткань", "Трикотаж мата", "Верхний текстильный слой", "Үстіңгі тоқыма қабаты", "knit", 3);
const polyester = (id: string) => layer(id, "Полиэстер", "Полиэстер", "Одинарный трикотаж, кулирка", "Бір қабатты трикотаж (кулирка)", "fabric", 2);
const base = () => layer("base", "Тканый материал", "Тоқылған мата", "Нижний текстильный слой", "Астыңғы тоқыма қабаты", "fabric", 2);
const filler = () => layer("filler", "3D волокнистый наполнитель", "3D талшықты толтырғыш", "180 г — по схеме состава", "Сызбада көрсетілгені: 180 г", "fabric", 3);
const nonwoven = () => layer("nonwoven", "Нетканый материал", "Тоқылмаған материал", "30 г — по схеме состава", "Сызбада көрсетілгені: 30 г", "fabric", 2);
const felt = (id: string) => layer(id, "Мягкий войлок", "Жұмсақ киіз", "400 г — по схеме состава", "Сызбада көрсетілгені: 400 г", "felt", 3);
const springs = () => layer("springs", "Независимые пружины", "Тәуелсіз серіппелер", "Pocket Spring · периметр из пены 3570", "Pocket Spring · жиектерін күшейтетін көбік: 3570", "springs", 46);

function premiumLayers(dark: boolean): MattressLayer[] {
  return [
    dark ? layer("cover", "Трикотажная ткань", "Трикотаж мата", "Верхний текстильный слой", "Үстіңгі тоқыма қабаты", "knit-dark", 3)
      : layer("cover", "Трикотажная ткань", "Трикотаж мата", "350 г — по схеме состава", "Сызбада көрсетілгені: 350 г", "knit", 3),
    filler(),
    layer("profile", "Рельефная пена", "Бедерлі көбік", "3 см · 2040", "3 см · 2040", "profile", 10),
    nonwoven(),
    layer("gel", "Гелевая пена с памятью", "Дене пішініне бейімделетін гельді көбік", "2 см · 40#", "2 см · 40#", "gel", 7),
    layer("foam", "Пена высокой плотности", "Тығыздығы жоғары көбік", "3 см · 2550", "3 см · 2550", "foam", 10),
    felt("upper-felt"), springs(), felt("lower-felt"), base(),
  ];
}

// Source: the five model-specific cutaway diagrams supplied by the owner.
// Preserve the foam codes without interpreting them as certified densities.
export const mattressLayers: Record<ModelCode, MattressLayer[]> = {
  "2601": [
    knit(), polyester("upper-polyester"),
    layer("foam", "Пена высокой плотности", "Тығыздығы жоғары көбік", "5 см · 2525", "5 см · 2525", "foam", 14),
    layer("core", "Пенная основа", "Көбіктен жасалған негіз", "20 см · 2560", "20 см · 2560", "core", 56),
    polyester("lower-polyester"), base(),
  ],
  "2602": [
    knit(),
    layer("memory", "Пена с эффектом памяти", "Дене пішініне бейімделетін көбік", "2 см · 40#", "2 см · 40#", "memory", 7),
    layer("foam", "Пена высокой плотности", "Тығыздығы жоғары көбік", "5 см · 2525", "5 см · 2525", "foam", 14),
    layer("core", "Пенная основа", "Көбіктен жасалған негіз", "20 см · 2560", "20 см · 2560", "core", 56), base(),
  ],
  "2603": [
    layer("cover", "Жаккардовая трикотажная ткань", "Жаккард өрнекті трикотаж", "Верхний текстильный слой", "Үстіңгі тоқыма қабаты", "knit", 3), filler(),
    layer("foam-2020", "Пена высокой плотности", "Тығыздығы жоғары көбік", "2 см · 2020", "2 см · 2020", "foam", 7), nonwoven(),
    layer("foam-2550-2", "Пена высокой плотности", "Тығыздығы жоғары көбік", "2 см · 2550", "2 см · 2550", "foam", 7),
    layer("foam-2550-1", "Пена высокой плотности", "Тығыздығы жоғары көбік", "1 см · 2550", "1 см · 2550", "foam", 4),
    felt("upper-felt"), springs(), felt("lower-felt"), base(),
  ],
  "2605": premiumLayers(false),
  "2606": premiumLayers(true),
};

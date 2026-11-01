import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(`${base}/ru`);
  await page.waitForFunction(() => document.querySelector(".cutaway-root")?.dataset.progress === "0.000");
  const before = await page.locator(".cutaway-layer").first().evaluate(el => getComputedStyle(el).transform);
  if (process.env.CUTAWAY_SCREENSHOT_PREFIX) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${process.env.CUTAWAY_SCREENSHOT_PREFIX}-closed.png` });
  }
  await page.locator(".hero-scroll").evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + 420, behavior: "instant" }));
  await page.waitForFunction(() => Number(document.querySelector(".cutaway-root").dataset.progress) > .8);
  const after = await page.locator(".cutaway-layer").first().evaluate(el => getComputedStyle(el).transform);
  assert.notEqual(before, after, "scroll must change layer depth");
  for (const [name, model, count, material] of [
    ["Luna", "2601", 6, "core"], ["Aria", "2602", 5, "memory"],
    ["Vita", "2603", 10, "springs"], ["Alba", "2605", 10, "gel"], ["Oro", "2606", 10, "gel"],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForFunction(code => document.querySelector(".cutaway-root").dataset.model === code, model);
    assert.equal(await page.locator(".cutaway-layer").count(), count);
    assert.equal(await page.locator(`.material-${material}`).count(), 1);
    assert.equal(await page.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"), "true");
  }
  await page.getByRole("button", { name: "Luna", exact: true }).click();
  await page.getByRole("button", { name: "Следующий слой", exact: true }).click();
  assert.equal(await page.locator(".cutaway-info strong").textContent(), "Полиэстер");
  await page.locator("#cutaway-explode").evaluate(el => el.focus({ preventScroll: true }));
  await page.keyboard.press("Home");
  await page.waitForFunction(() => Number(document.querySelector(".cutaway-root").dataset.progress) === 0);
  await page.keyboard.press("End");
  await page.waitForFunction(() => Number(document.querySelector(".cutaway-root").dataset.progress) === 1);
  if (process.env.CUTAWAY_SCREENSHOT_PREFIX) {
    await page.locator("#cutaway-explode").evaluate(el => el.blur());
    await page.screenshot({ path: `${process.env.CUTAWAY_SCREENSHOT_PREFIX}-open.png` });
  }

  await page.locator(".language-link").click();
  await page.waitForURL("**/kk");
  assert.equal(await page.locator("html").getAttribute("lang"), "kk");
  assert((await page.title()).includes("жайлы ұйқыға арналған матрастар"));
  assert((await page.locator('meta[name="description"]').getAttribute("content")).includes("модельдерінің құрамын"));
  assert((await page.locator(".brand-logo").first().getAttribute("src")).endsWith("velora-logo-kk.svg"));
  await page.getByRole("button", { name: "Luna", exact: true }).click();
  assert.equal(await page.locator(".cutaway-info strong").textContent(), "Трикотаж мата");
  await page.getByRole("button", { name: "Келесі қабат", exact: true }).click();
  assert.equal(await page.locator(".cutaway-info strong").textContent(), "Полиэстер");
  if (process.env.CUTAWAY_SCREENSHOT_PREFIX) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${process.env.CUTAWAY_SCREENSHOT_PREFIX}-kk.png` });
  }

  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 } });
  const staticPage = await context.newPage();
  staticPage.on("pageerror", e => errors.push(e.message));
  await staticPage.goto(`${base}/ru`);
  await staticPage.waitForFunction(() => Number(document.querySelector(".cutaway-root").dataset.progress) === 1);
  assert.equal(await staticPage.locator(".hero-grid").evaluate(el => getComputedStyle(el).position), "static");
  await context.close();
  assert.deepEqual(errors, []);
  console.log("PASS: scroll changes 3D layer depth; five compositions match source diagrams; model switching, layer navigation, keyboard slider, Kazakh metadata/logo/labels and reduced-motion fallback work.");
} finally {
  await browser.close();
}

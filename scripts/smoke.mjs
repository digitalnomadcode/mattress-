import { chromium } from "playwright";
import assert from "node:assert/strict";

async function main() {
  const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
  const external=!["127.0.0.1","localhost","[::1]"].includes(new URL(base).hostname);
  const proxy=external&&process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    ...(proxy?{proxy:{server:proxy.origin,...(proxy.username?{username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)}:{})}}:{}),
  });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    const home = await page.goto(base);
    assert.equal(home.status(), 200);
    assert.equal(new URL(page.url()).pathname, "/ru");
    assert.equal(await page.locator("html").getAttribute("lang"), "ru");
    assert.equal(await page.locator("#about").count(), 1);
    assert.equal(await page.locator("#product").count(), 1);
    assert.equal(await page.locator(".collection-line").count(), 5);
    assert.equal(await page.locator(".product-card").count(), 0);
    assert.equal(await page.locator("#videos").count(), 0);
    assert.equal(await page.locator("#reviews").count(), 1);
    assert.equal(await page.locator("#reviews .reviews-empty").count(), 1);
    assert.equal(await page.locator("#reviews blockquote").count(), 0);
    assert.equal(await page.locator("main > :last-child").getAttribute("id"), "contacts");
    assert.equal(await page.locator("#contacts .contact-card").count(), 3);
    assert.equal(await page.locator('[data-contact="instagram"] a').getAttribute("href"), "https://www.instagram.com/matt.resskz/");
    assert.equal(await page.locator('[data-contact="whatsapp"] a').getAttribute("href"), "https://wa.me/77058216103");
    assert.equal(await page.locator('[data-contact="phone"] a').getAttribute("href"), "tel:+77058216103");
    assert.equal(await page.locator(".city-card").count(), 2);
    const maps = await page.locator(".city-map-link").evaluateAll(links => links.map(a => a.href));
    assert(maps[0].includes("query=Almaty"));
    assert(maps[1].includes("query=Astana"));
    await page.locator(".hero-actions .primary").click();
    await page.waitForURL("**/ru/catalog");
    await page.locator(".filter").first().waitFor();
    assert.equal(await page.locator(".product-card").count(), 5);
    await page.getByRole("button", { name: "Без пружин", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll(".product-card").length === 2);
    await page.getByRole("button", { name: "Независимые пружины", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll(".product-card").length === 3);
    await page.getByRole("button", { name: "Все модели", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll(".product-card").length === 5);

    for (const lang of ["ru", "kk"]) {
      const catalog = await page.goto(`${base}/${lang}/catalog`);
      assert.equal(catalog.status(), 200);
      assert.equal(await page.locator(".product-card").count(), 5);
      assert.deepEqual(await page.locator(".product-title").allTextContents(), ["Велора Luna", "Велора Aria", "Велора Vita", "Велора Alba", "Велора Oro"]);
      await page.waitForFunction(()=>Array.from(document.querySelectorAll(".product-visual img")).every(img=>img.complete&&img.naturalWidth>0));
      for (const model of ["2601", "2602", "2603", "2605", "2606"]) {
        const response = await page.goto(`${base}/${lang}/catalog/${model}`);
        assert.equal(response.status(),200);
        const names = { "2601": "Luna", "2602": "Aria", "2603": "Vita", "2605": "Alba", "2606": "Oro" };
        assert.equal(await page.locator("h1").textContent(), names[model]);
        assert.equal(await page.locator("html").getAttribute("lang"),lang);
        await page.waitForFunction(()=>{const img=document.querySelector(".product-photo-plane img");return img?.complete&&img.naturalWidth>0;});
        if(["2602","2603","2605"].includes(model)){
          const before=await page.locator(".product-photo-plane img").getAttribute("src");
          await page.locator(".product-photo-thumbs button").nth(1).click();
          await page.waitForFunction(previous=>document.querySelector(".product-photo-plane img")?.getAttribute("src")!==previous,before);
          await page.waitForFunction(()=>{const img=document.querySelector(".product-photo-plane img");return img?.complete&&img.naturalWidth>0;});
          assert.equal(await page.locator(".product-photo-thumbs button").nth(1).getAttribute("aria-pressed"),"true");
        }
      }
    }
    await page.goto(`${base}/ru/catalog/2601`);
    await page.getByText("180 × 200 см", { exact: true }).click();
    assert(await page.getByRole("radio", { name: "180 × 200 см" }).isChecked());
    await page.waitForFunction(() => document.querySelector(".detail-price strong").textContent.replace(/\s/g, "") === "156990₸");
    await page.locator(".language-link").click();
    await page.waitForURL("**/kk/catalog/2601");
    assert.equal(await page.locator("html").getAttribute("lang"),"kk");
    await page.locator(".back-link").click();
    await page.waitForURL("**/kk/catalog");
    await page.locator(".language-link").click();
    await page.waitForURL("**/ru/catalog");

    for (const path of ["/en", "/ru/catalog/9999", "/ru/unknown"]) {
      const response = await page.goto(`${base}${path}`);
      assert.equal(response.status(),404,`${path} must not expose a page`);
    }
    await page.goto(`${base}/admin`);
    await page.waitForURL("**/admin/login");
    assert.equal((await page.request.get(`${base}/api/admin`)).status(),401);
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const path of ["/ru", "/kk", "/ru/catalog", "/kk/catalog", "/ru/catalog/2603", "/kk/catalog/2606"]) {
        await page.goto(`${base}${path}`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${path} overflows at ${width}px`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/ru`);
    if (process.env.SMOKE_SCREENSHOT) await page.screenshot({ path: process.env.SMOKE_SCREENSHOT, fullPage: true });
    if (process.env.SMOKE_MOBILE_SCREENSHOT) {
      await page.setViewportSize({ width: 375, height: 1000 });
      await page.screenshot({ path: process.env.SMOKE_MOBILE_SCREENSHOT, fullPage: true });
    }
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("PASS: landing-to-catalog navigation, city-map links, reviews empty state at end of landing, hidden empty video section, RU/KZ catalogs, 10 product pages, filters, size-price updates, language switches, 404s, and viewport overflow checks.");
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

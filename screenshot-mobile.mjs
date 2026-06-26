import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2];
const label = process.argv[3];

const dir = path.join(process.cwd(), "temporary screenshots");
fs.mkdirSync(dir, { recursive: true });
const existing = fs.readdirSync(dir).map((f) => {
  const m = f.match(/^screenshot-(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
});
const next = (existing.length ? Math.max(...existing) : 0) + 1;
const outPath = path.join(dir, `screenshot-${next}-${label || "mobile"}.png`);

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: "networkidle0" });
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < scrollHeight; y += 300) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 40));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`Saved ${outPath}`);

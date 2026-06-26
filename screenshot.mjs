import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error("Usage: node screenshot.mjs <url> [label]");
  process.exit(1);
}

const dir = path.join(process.cwd(), "temporary screenshots");
fs.mkdirSync(dir, { recursive: true });

const existing = fs
  .readdirSync(dir)
  .map((f) => {
    const m = f.match(/^screenshot-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
const next = (existing.length ? Math.max(...existing) : 0) + 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath = path.join(dir, filename);

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle0" });

// Scroll through the full page first so IntersectionObserver-based
// reveal animations fire before the full-page screenshot is taken.
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < scrollHeight; y += 400) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 40));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 200));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved ${outPath}`);

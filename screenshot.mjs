import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "temporary screenshots");

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error("Usage: node screenshot.mjs <url> [label]");
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function nextScreenshotPath() {
  const existing = fs
    .readdirSync(OUT_DIR)
    .map((f) => f.match(/^screenshot-(\d+)/))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const n = existing.length ? Math.max(...existing) + 1 : 1;
  const suffix = label ? `-${label}` : "";
  return path.join(OUT_DIR, `screenshot-${n}${suffix}.png`);
}

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle0" });

const outPath = nextScreenshotPath();
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved screenshot to ${outPath}`);

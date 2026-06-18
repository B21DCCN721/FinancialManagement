// Script để generate PWA icons từ icon gốc
// Chạy: node scripts/generate-icons.mjs
// Cần cài: npm i -D sharp

import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceIcon = join(__dirname, "../src/app/icon.png");
const outputDir = join(__dirname, "../public/icons");

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(sourceIcon)
    .resize(size, size, { fit: "contain", background: { r: 10, g: 10, b: 15, alpha: 1 } })
    .png()
    .toFile(join(outputDir, `icon-${size}x${size}.png`));
  console.log(`✅ Generated ${size}x${size}`);
}

console.log("🎉 All icons generated!");

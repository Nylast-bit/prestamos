import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const SRC = path.join(repoRoot, "Logo.jfif");
const PUB = path.resolve(__dirname, "..", "public");
const APP = path.resolve(__dirname, "..", "app");

const BRAND_BG = "#ffffff";

async function main() {
  const meta = await sharp(SRC).metadata();
  const { width: W, height: H } = meta;
  console.log(`Fuente: ${path.basename(SRC)} ${W}x${H}`);

  // Recorte cuadrado del simbolo (sin el texto CREDITWAY PRESTAMOS)
  const side = Math.round(0.62 * H);
  const left = Math.round(0.19 * W);
  const top = Math.round(0.055 * H);
  const crop = { left, top, width: Math.min(side, W - left), height: Math.min(side, H - top) };

  const symbol = () => sharp(SRC).extract(crop);

  await mkdir(path.join(PUB, "icons"), { recursive: true });

  // --- Iconos PWA ---
  const i192 = await symbol().resize(192, 192).png().toBuffer();
  const i512 = await symbol().resize(512, 512).png().toBuffer();

  // Maskable: simbolo al 70% sobre fondo blanco (zona segura del 80%)
  const inner = await symbol().resize(358, 358).png().toBuffer();
  const maskable = await sharp({
    create: { width: 512, height: 512, channels: 3, background: BRAND_BG },
  })
    .composite([{ input: inner, gravity: "centre" }])
    .png()
    .toBuffer();

  await writeFile(path.join(PUB, "icons", "icon-192.png"), i192);
  await writeFile(path.join(PUB, "icons", "icon-512.png"), i512);
  await writeFile(path.join(PUB, "icons", "icon-maskable-512.png"), maskable);

  // --- Apple touch icon (Next lo inyecta desde app/apple-icon.png) ---
  const apple = await symbol().resize(180, 180).png().toBuffer();
  await writeFile(path.join(APP, "apple-icon.png"), apple);

  // --- Favicon ICO (entries PNG RGBA: 32/48/256; Turbopack exige RGBA) ---
  const icoPngs = [];
  for (const size of [32, 48, 256]) {
    icoPngs.push({
      size,
      buf: await symbol().resize(size, size).ensureAlpha().png().toBuffer(),
    });
  }
  await writeFile(path.join(APP, "favicon.ico"), buildIco(icoPngs));

  // --- Logo completo para la UI ---
  const full = await sharp(SRC).resize(1024, 1024).png().toBuffer();
  await writeFile(path.join(PUB, "logo.png"), full);
  const symbolPng = await symbol().resize(512, 512).png().toBuffer();
  await writeFile(path.join(PUB, "logo-symbol.png"), symbolPng);

  console.log("OK: public/icons/*, public/logo.png, public/logo-symbol.png, app/apple-icon.png, app/favicon.ico");
}

function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const entries = [];
  const data = [];
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    entries.push(e);
    data.push(buf);
  }
  return Buffer.concat([header, ...entries, ...data]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

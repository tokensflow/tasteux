import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { IMAGE_WIDTHS } from "../site/images.mjs";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const assetFiles = ["app.js", "catalog.mjs", "images.mjs", "fonts.mjs", "hero.mjs", "install.mjs", "palette.mjs", "style.css", "preview.css", "favicon.svg"];
const hash = (parts) => {
  const digest = createHash("sha256");
  for (const part of parts) {
    digest.update(`${part.length}:`);
    digest.update(part);
  }
  return digest.digest("hex").slice(0, 16);
};

export async function buildAssets(output, data) {
  let tools;
  try {
    tools = await Promise.all([exec("cwebp", ["-version"]), exec("magick", ["-version"])]);
  } catch {
    throw new Error("生成响应式图片需要本地 ImageMagick（magick）和 WebP 编码器（cwebp）；请安装后重试。网站运行时不依赖这两个工具。");
  }
  const pipeline = Buffer.concat([await fs.readFile(fileURLToPath(import.meta.url)), ...tools.map((tool) => Buffer.from(tool.stdout))]);
  const sources = await Promise.all(assetFiles.map((file) => fs.readFile(path.join(root, "site", file))));
  const originals = await Promise.all(data.schools.map(async (school) => {
    if (!/^[a-z0-9-]+$/.test(school.id)) throw new Error(`无效图片 ID：${school.id}`);
    return fs.readFile(path.join(root, "site/img", `${school.id}.jpg`));
  }));
  const release = hash([...sources, ...originals, Buffer.from(JSON.stringify(data)), pipeline]);
  const base = `/assets/${release}/`;
  const dir = path.join(output, base);
  const imageDir = path.join(dir, "images");
  await fs.mkdir(imageDir, { recursive: true });
  for (let i = 0; i < assetFiles.length; i++) {
    let content = sources[i];
    if (assetFiles[i] === "images.mjs") content = Buffer.from(content.toString().replace("export const IMAGE_BASE = null;", `export const IMAGE_BASE = ${JSON.stringify(base + "images/")};`));
    if (assetFiles[i] === "app.js") content = Buffer.from(content.toString().replace('const DATA_URL = "../skill/schools.json";', 'const DATA_URL = new URL("schools.json", import.meta.url).href;'));
    await fs.writeFile(path.join(dir, assetFiles[i]), content);
  }
  await fs.writeFile(path.join(dir, "schools.json"), JSON.stringify(data));
  let next = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (next < data.schools.length) {
      const i = next++;
      const id = data.schools[i].id;
      const input = path.join(root, "site/img", `${id}.jpg`);
      const cache = path.join(root, ".cache/responsive-images", hash([originals[i], pipeline]));
      await fs.mkdir(cache, { recursive: true });
      await fs.writeFile(path.join(imageDir, `${id}.jpg`), originals[i]);
      for (const width of IMAGE_WIDTHS) {
        for (const ext of width === 1200 ? ["webp"] : ["webp", "jpg"]) {
          const name = `${id}.${width}.${ext}`;
          const cached = path.join(cache, name);
          if (!(await fs.stat(cached).catch(() => null))?.size) {
            const temp = `${cached}.${randomUUID()}.tmp.${ext}`;
            try {
              if (ext === "webp") await exec("cwebp", ["-quiet", "-q", "80", "-m", "6", "-resize", String(width), "0", input, "-o", temp]);
              else await exec("magick", [input, "-resize", `${width}x`, "-strip", "-quality", "80", temp]);
              await fs.rename(temp, cached);
            } finally {
              await fs.rm(temp, { force: true });
            }
          }
          await fs.copyFile(cached, path.join(imageDir, name));
        }
      }
    }
  }));
  const cached = ["/assets/*", "/site/assets/*"].map((url) => `${url}\n  Cache-Control: public, max-age=31536000, immutable\n  Access-Control-Allow-Origin: *\n`);
  const publicPaths = ["/img/*", "/skill/*", ...assetFiles.map((file) => `/${file}`)];
  await fs.writeFile(path.join(output, "_headers"), [...cached, ...publicPaths.map((url) => `${url}\n  Access-Control-Allow-Origin: *\n`)].join(""));
  return { base, imageBase: base + "images/" };
}

export function versionPage(html, { base, imageBase }) {
  return html.replace(/(href|src)="\/?(style\.css|preview\.css|app\.js|favicon\.svg)"/g, (_, attribute, file) => `${attribute}="${base}${file}"`)
    .replace(/\/img\/([a-z0-9-]+)\.jpg/g, (_, id) => `${imageBase}${id}.jpg`);
}

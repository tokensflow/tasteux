import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { buildSite, adSlotMarkup } from "./build-site.mjs";
import { FEATURED_IDS, plateMarkup } from "../site/catalog.mjs";
import { IMAGE_WIDTHS } from "../site/images.mjs";
import { buildAssets } from "./assets.mjs";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const origin = "https://tasteux.com";
let output;
let pages;
let data;

before(async () => {
  output = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-seo-test-"));
  pages = await buildSite(output);
  data = JSON.parse(await fs.readFile(new URL("../skill/schools.json", import.meta.url), "utf8"));
});
after(async () => {
  if (output) await fs.rm(output, { recursive: true, force: true });
});

const pageFile = (url) => path.join(output, new URL(url, origin).pathname, "index.html");
const schemas = (html) => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => {
  const value = JSON.parse(m[1]);
  return value["@graph"] ?? [value];
});

test("homepage contains all school content without JavaScript", async () => {
  const html = await fs.readFile(pageFile("/"), "utf8");
  assert.equal((html.match(/class="plate reveal"/g) ?? []).length, 24);
  for (const school of data.schools) {
    assert.ok(html.includes(`id="plate-${school.id}"`));
    assert.ok(html.includes(school.intro));
  }
  for (const id of FEATURED_IDS) assert.ok(html.includes(`href="schools/${id}/"`));
  assert.ok(html.includes('href="guides/art-movement-web-design/"'));
  assert.ok(html.includes("网页设计风格与 AI 提示词生成器"));
});

test("built homepage has a static hero and fingerprinted carousel module", async () => {
  const html = await fs.readFile(pageFile("/"), "utf8");
  assert.equal((html.match(/class="hero-slide"/g) ?? []).length, 4);
  assert.equal((html.match(/id="hero-title"/g) ?? []).length, 1);
  assert.ok(html.indexOf('id="showcase"') < html.indexOf('id="workbench"'));
  const { dir } = await currentAssets();
  await fs.access(path.join(dir, "hero.mjs"));
});

test("built homepage exposes all platform downloads and invocation instructions without JavaScript", async () => {
  const html = await fs.readFile(pageFile("/"), "utf8");
  assert.equal((html.match(/class="skill-version"/g) ?? []).length, 3);
  for (const id of ["pi", "claude", "codex"]) {
    const download = `/skill/downloads/style-mix-${id}.zip`;
    assert.ok(html.includes(`href="${download}"`));
    assert.ok((await fs.stat(path.join(output, download))).size > 0);
  }
  for (const invocation of ["/skill:style-mix", "/style-mix", "$style-mix"]) assert.ok(html.includes(invocation));
  const { dir } = await currentAssets();
  await fs.access(path.join(dir, "install.mjs"));
});

test("every landing page has unique metadata and truthful structured data", async () => {
  assert.equal(pages.length, 10);
  const titles = new Set();
  const descriptions = new Set();
  for (const url of pages) {
    const html = await fs.readFile(pageFile(url), "utf8");
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && description);
    assert.ok(!titles.has(title));
    assert.ok(!descriptions.has(description));
    titles.add(title);
    descriptions.add(description);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
    assert.ok(html.includes(`rel="canonical" href="${origin}${url}"`));
    assert.ok(html.includes(`property="og:url" content="${origin}${url}"`));
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
    const graph = schemas(html);
    assert.ok(graph.length);
    assert.ok(!html.includes('"aggregateRating"'));
    assert.ok(!html.includes('"LocalBusiness"'));
    if (url !== "/") assert.ok(graph.some((node) => node["@type"] === "BreadcrumbList"));
  }
});

test("Chinese and English homepages declare each other with hreflang and the right language", async () => {
  const expected = [`hreflang="zh-CN" href="${origin}/"`, `hreflang="en" href="${origin}/en/"`, `hreflang="x-default" href="${origin}/"`];
  for (const [url, lang, locale] of [["/", "zh-CN", "zh_CN"], ["/en/", "en", "en_US"]]) {
    const html = await fs.readFile(pageFile(url), "utf8");
    for (const link of expected) assert.ok(html.includes(`<link rel="alternate" ${link}>`), `${url} 缺少 ${link}`);
    assert.ok(html.includes(`<html lang="${lang}"`));
    assert.ok(html.includes(`property="og:locale" content="${locale}"`));
  }
});

test("llms.txt links only to files the build publishes, including every sitemap page", async () => {
  const llms = await fs.readFile(path.join(output, "llms.txt"), "utf8");
  const links = [...llms.matchAll(/\]\((https:\/\/tasteux\.com\/[^)]*)\)/g)].map((m) => m[1]);
  for (const link of links) {
    const rel = new URL(link).pathname.slice(1);
    await fs.access(path.join(output, rel.endsWith("/") ? rel + "index.html" : rel));
  }
  const sitemap = await fs.readFile(path.join(output, "sitemap.xml"), "utf8");
  for (const [, loc] of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) if (loc !== `${origin}/`) assert.ok(links.includes(loc), `llms.txt 缺少 ${loc}`);
});

test("sitemap lists only canonical content pages and robots advertises it", async () => {
  const sitemap = await fs.readFile(path.join(output, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(urls, pages.map((url) => origin + url));
  assert.ok(!sitemap.includes("#mix="));
  // lastmod 是内容源文件最后一次提交的日期，不是构建时间。
  const lastmods = [...sitemap.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((m) => m[1]);
  assert.equal(lastmods.length, urls.length);
  const committed = execFileSync("git", ["log", "-1", "--format=%cs", "--", "site", "skill/schools.json", "scripts/editorial.mjs", "scripts/build-site.mjs"], { encoding: "utf8" }).trim();
  assert.ok(lastmods.every((d) => d === committed), `${lastmods} ≠ ${committed}`);
  const robots = await fs.readFile(path.join(output, "robots.txt"), "utf8");
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(!robots.includes("Disallow:"));
  assert.equal(await fs.readFile(path.join(output, "_redirects"), "utf8"), "/site / 301\n/site/ / 301\n/site/* /:splat 301\n");
});

test("internal links and assets resolve in the deployable output", async () => {
  for (const url of pages) {
    const html = await fs.readFile(pageFile(url), "utf8");
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (value.startsWith("#")) continue;
      const target = new URL(value.replace(/&amp;/g, "&"), origin + url);
      if (target.origin !== origin) continue;
      const file = path.join(output, target.pathname);
      const stat = await fs.stat(file);
      if (stat.isDirectory()) await fs.access(path.join(file, "index.html"));
    }
  }
  assert.ok((await fs.readFile(path.join(output, "style.css"), "utf8")).includes(".js .reveal { opacity: 1;"));
});

test("surface-only schools use a valid skeleton and generated images are labelled", async () => {
  for (const id of FEATURED_IDS) {
    const html = await fs.readFile(pageFile(`/schools/${id}/`), "utf8");
    const school = data.schools.find((s) => s.id === id);
    assert.ok(html.includes(school.intro));
    assert.ok(html.includes("AI 生成的风格示意"));
    assert.ok(html.includes(school.roles.includes("structure") ? `#mix=${id}+${id}` : `#mix=minimalism+${id}`));
    assert.ok(html.includes("使用教程"));
  }
});

test("catalog escapes content and does not link to unpublished schools", () => {
  const school = structuredClone(data.schools[0]);
  school.name = '<img src=x onerror="alert(1)">';
  school.intro = "<script>alert(1)</script>";
  const html = plateMarkup(school, 0);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes(`href="schools/${school.id}/"`));
});

test("surface color studies have palette and texture without JavaScript", () => {
  for (const school of data.schools.filter((s) => !s.roles.includes("structure"))) {
    const html = plateMarkup(school, 0);
    assert.ok(html.includes(`--surface:${school.palette.surface}`));
    assert.ok(html.includes(`--tex-level:${school.texture.level}`));
    assert.ok(html.includes(`data-texture="${school.texture.kind}"`));
  }
});

test("generator refuses filesystem roots, repository ancestors, and source directories", async () => {
  const root = path.resolve(new URL("../", import.meta.url).pathname);
  for (const dir of [path.parse(root).root, path.dirname(root), root, path.join(root, "site"), path.join(root, "site/nested"), path.join(root, "skill")]) {
    await assert.rejects(buildSite(dir), /不能覆盖源码/);
  }
});

test("rebuilding does not duplicate static cards or metadata", async () => {
  const first = await fs.readFile(pageFile("/"), "utf8");
  assert.deepEqual(await buildSite(output), pages);
  assert.equal(await fs.readFile(pageFile("/"), "utf8"), first);
});

async function currentAssets() {
  const html = await fs.readFile(pageFile("/"), "utf8");
  const base = html.match(/src="(\/assets\/[a-f0-9]{16}\/)app\.js"/)?.[1];
  assert.ok(base);
  return { base, dir: path.join(output, base) };
}

test("only fingerprinted assets have immutable caching and data stays release-aligned", async () => {
  const { base, dir } = await currentAssets();
  const headers = await fs.readFile(path.join(output, "_headers"), "utf8");
  const rules = headers.trim().split(/\n(?=\/)/).map((rule) => rule.split("\n"));
  assert.deepEqual(rules.filter((rule) => rule.some((line) => line.includes("immutable"))).map((rule) => rule[0]), ["/assets/*", "/site/assets/*"]);
  assert.ok(rules.every((rule) => rule.includes("  Access-Control-Allow-Origin: *")));
  assert.ok(!headers.includes("Access-Control-Allow-Credentials"));
  const app = await fs.readFile(path.join(dir, "app.js"), "utf8");
  assert.ok(app.includes('new URL("schools.json", import.meta.url)'));
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(dir, "schools.json"), "utf8")), data);
  assert.ok((await fs.readFile(path.join(dir, "images.mjs"), "utf8")).includes(`"${base}images/"`));
  for (const url of pages) {
    const html = await fs.readFile(pageFile(url), "utf8");
    assert.ok(html.includes(`href="${base}style.css"`));
    assert.ok(html.includes(`href="${base}favicon.svg"`));
  }
});

test("every responsive candidate exists, has the right dimensions, and preserves the original JPEG", async () => {
  const { dir } = await currentAssets();
  const files = [];
  for (const school of data.schools) {
    const original = await fs.readFile(new URL(`../site/img/${school.id}.jpg`, import.meta.url));
    assert.deepEqual(await fs.readFile(path.join(dir, "images", `${school.id}.jpg`)), original);
    for (const width of IMAGE_WIDTHS) {
      for (const ext of width === 1200 ? ["webp"] : ["webp", "jpg"]) {
        const file = path.join(dir, "images", `${school.id}.${width}.${ext}`);
        assert.ok((await fs.stat(file)).size > 0);
        files.push(file);
      }
    }
  }
  const { stdout } = await promisify(execFile)("magick", ["identify", "-format", "%f %w %h\n", ...files]);
  const lines = stdout.trim().split("\n");
  assert.equal(lines.length, 168);
  for (const line of lines) {
    const [name, width, height] = line.split(" ");
    assert.equal(Number(width), Number(name.match(/\.(\d+)\./)[1]));
    assert.ok(Math.abs(Number(height) - Number(width) * 2 / 3) <= 1);
  }
  for (const url of pages) {
    const html = await fs.readFile(pageFile(url), "utf8");
    for (const [, candidates] of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const candidate of candidates.split(", ")) await fs.access(path.join(output, candidate.split(" ")[0]));
    }
  }
});

test("data changes produce a different cache key without overwriting the previous release", async () => {
  const { base, dir } = await currentAssets();
  const changed = structuredClone(data);
  changed.schools[0].intro += " 更新内容。";
  const next = await buildAssets(output, changed);
  assert.notEqual(next.base, base);
  await fs.access(path.join(dir, "app.js"));
  await fs.access(path.join(output, next.base, "app.js"));
});

test("migration retains old fingerprint bytes at the new asset paths", async () => {
  const legacy = path.join(output, "site/assets/1111111111111111");
  await fs.mkdir(legacy, { recursive: true });
  await fs.writeFile(path.join(legacy, "app.js"), "previous immutable release");
  await buildSite(output);
  assert.equal(await fs.readFile(path.join(output, "assets/1111111111111111/app.js"), "utf8"), "previous immutable release");
  assert.equal(await fs.readFile(path.join(legacy, "app.js"), "utf8"), "previous immutable release");
  const home = await fs.readFile(pageFile("/"), "utf8");
  assert.ok(!/href="\/site\/|src="\/site\/|https:\/\/style-mix\.tasteux\.com/.test(home));
});

test("initial picker geometry is static and external UI fonts are non-blocking", async () => {
  const home = await fs.readFile(pageFile("/"), "utf8");
  assert.equal((home.match(/class="skel"/g) ?? []).length, data.schools.filter((s) => s.roles.includes("structure")).length);
  assert.equal((home.match(/class="skin"/g) ?? []).length, 24);
  assert.equal((home.match(/class="grp"/g) ?? []).length, 3);
  for (const url of pages) {
    const html = await fs.readFile(pageFile(url), "utf8");
    assert.ok(html.includes('display=optional" media="print" onload="this.media=\'all\'"'));
  }
  assert.ok((await fs.readFile(path.join(output, "style.css"), "utf8")).includes(".room #code-out { min-height: 320px; }"));
});

test("ad slots are fixed, labelled, off until a slot ID exists, and never enable Auto ads", async () => {
  assert.equal(adSlotMarkup("ca-pub-1", ""), "");
  const zh = adSlotMarkup("ca-pub-1", "42");
  assert.ok(zh.includes('<p class="ad-label">广告</p>') && zh.includes('data-ad-slot="42"') && zh.includes('class="adsbygoogle"'));
  assert.ok(adSlotMarkup("ca-pub-1", "42", true).includes(">Advertisement<"));
  for (const url of ["/", "/en/", "/privacy/"]) {
    const html = await fs.readFile(pageFile(url), "utf8");
    assert.ok(!html.includes("enable_page_level_ads") && !html.includes("<!-- ad:"));
  }
});

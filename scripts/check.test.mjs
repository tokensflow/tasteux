import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";

const exec = promisify(execFile);
const script = new URL("../skill/scripts/check.mjs", import.meta.url).pathname;
const mix = new URL("../skill/scripts/mix.mjs", import.meta.url).pathname;

// 包豪斯 × 野兽派的真实色值，规则写在页面里，不依赖网络字体
const vars = `:root { --bg: oklch(0.94 0.05 85); --surface: oklch(0.85 0.1 165); --ink: oklch(0.22 0.06 285); --muted: oklch(0.4 0.08 285); --line: oklch(0.45 0.16 260); --accent: oklch(0.55 0.22 33); --on-accent: oklch(0.98 0.02 85); --accent2: oklch(0.55 0.15 155); --accent3: oklch(0.65 0.22 350); }`;
const base = `${vars}
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 sans-serif; }
  main { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; padding: 24px; }
  h1 { grid-column: 1 / -1; font-size: 64px; margin: 0; }
  .card { grid-column: span 6; background: var(--surface); padding: 16px; }
  .rule { grid-column: 1 / -1; height: 6px; background: var(--line); }
  a.cta { display: inline-block; padding: 12px 20px; background: var(--accent); color: var(--on-accent); }
  a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .dot { width: 80px; height: 80px; border-radius: 50%; background: var(--accent3); }
  main > figure, main > img { grid-column: 1 / -1; margin: 0; max-width: 100%; }`;
const page = (css, body, lang = "zh-CN") => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fixture</title><meta name="description" content="原来的描述"><meta property="og:image" content="https://example.com/assets/0123456789ab/images/a.jpg"><style>${css}</style></head><body><main><h1>纸页书店</h1><div class="rule"></div><div class="card"><p>每周三晚上读书。</p><a class="cta" href="/join">预约到店</a></div><div class="card"><div class="dot"></div></div>${body}</main></body></html>`;

const art = `<figure data-original><img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" width="200" height="120" alt="神奈川冲浪里"><figcaption>葛饰北斋《神奈川冲浪里》，芝加哥艺术博物馆，CC0。<a href="https://www.artic.edu/artworks/24645">出处</a></figcaption></figure>`;
// 远在首屏之外的懒加载图片：检查前必须真的加载出来，否则会被当成坏图
const lazy = `<img class="far" src="pixel.png" loading="lazy" width="40" height="40" alt="远处的图" style="margin-top: 6000px">`;
// 像广告代码一样：HTML 里写一个脚本，运行时再插入查询串每次都变的 iframe 和子脚本。基线只认 HTML 原文里的
const ads = `<script src="ads.js"></script><script>const r = Math.random(); document.body.append(Object.assign(document.createElement("iframe"), { hidden: true, src: "about:blank?correlator=" + r }), Object.assign(document.createElement("script"), { src: "impl.js?v=" + r }));</script>`;
// 质感：滤镜区域对齐图块的能无缝平铺；默认滤镜区域会在图块边上出接缝
const noise = (region) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'${region}><feTurbulence type='fractalNoise' baseFrequency='.85' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;
const tex = (region) => `<div class="texture" aria-hidden="true" style="position: fixed; inset: 0; z-index: -1; opacity: 0.1; background: var(--ink); mask: ${noise(region).replaceAll('"', "&quot;")}"></div>`;
// 标签页的选中下划线（单边 inset 0 -2px 0）不是立体按钮
const tab = `<button class="tab" style="box-shadow: inset 0 -2px 0 var(--ink); background: none; color: var(--ink); border: 0; min-height: 44px; outline-offset: 2px" onfocus="this.style.outline='2px solid'">代码</button>`;
const good = page(base, art + lazy + ads + tab + tex(" x='0' y='0' width='100%' height='100%' filterUnits='userSpaceOnUse'"));
const bad = page(`${base}
  .card { border-radius: 12px; box-shadow: 0 8px 24px oklch(0 0 0 / 0.2); }
  .grad { background: linear-gradient(90deg, var(--accent), var(--accent3)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .faint { color: oklch(0.8 0.03 85); }
  .wide { width: 700px; height: 10px; background: var(--ink); }
  a:focus-visible { outline: none; }
  .spin { width: 20px; height: 20px; background: var(--ink); animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(1turn); } }
  a.cta { border: 4px outset var(--ink); }
  @font-face { font-family: "Jost"; font-display: optional; src: url("a.woff2"); }
  @font-face { font-family: "Jost"; font-display: swap; src: url("b.woff2"); }`, `${tex("")}<img src="missing.png" width="40" height="40" alt="坏图"><figure data-original style="filter: sepia(0.5)"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" width="200" height="120" alt="x"></figure><p class="grad">渐变标题</p><p class="faint">看不清的说明文字</p><div class="wide"></div><div class="spin"></div>`, "").replace("原来的描述", "改过的描述");
// 只含字母 A 的 DejaVu Serif Bold 子集（Bitstream Vera 许可，可自由再分发）
const fontA = "data:font/woff2;base64,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";
// 只用到 700 的标题字体同时声明了 500 一档：500 从不加载，不能因此报"没有加载成功"；整个族都没加载才报
const fontPage = (src700) => page(`${base} @font-face { font-family: "Jost"; font-weight: 500; src: url("never-used.woff2"); } @font-face { font-family: "Jost"; font-weight: 700; src: url("${src700}"); } h1 { font-family: "Jost", sans-serif; font-weight: 700; }`, "");
const minimal = page(`${base} .glass { backdrop-filter: blur(8px); background: var(--accent2); }`, `<div class="glass">玻璃</div>`);

async function chromeAvailable() {
  try {
    await exec(process.execPath, [script, "/nonexistent.html", "--mix", "bauhaus+fauvism", "--out", os.tmpdir()]);
    return true;
  } catch (error) {
    return !/找不到 Chrome/.test(error.stderr);
  }
}

async function check(dir, name, html, ...args) {
  const file = path.join(dir, `${name}.html`);
  await fs.writeFile(file, html);
  try {
    const { stdout } = await exec(process.execPath, [script, file, "--out", path.join(dir, name), "--json", ...args]);
    return { code: 0, ...JSON.parse(stdout) };
  } catch (error) {
    if (error.code !== 1) throw error;
    return { code: 1, ...JSON.parse(error.stdout) };
  }
}
const failed = (r) => new Set(r.findings.filter((f) => f.level === "FAIL").map((f) => f.check));

test("browser check passes a page that follows DESIGN.md and fails each broken rule", { timeout: 120000 }, async (t) => {
  if (!(await chromeAvailable())) return t.skip("没有 Chrome");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-check-"));
  try {
    await fs.writeFile(path.join(dir, "pixel.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==", "base64"));
    const design = path.join(dir, "DESIGN.md");
    await fs.writeFile(design, (await exec(process.execPath, [mix, "bauhaus", "fauvism"])).stdout);

    // 打不开的页面直接报错，不去审查浏览器的错误页
    await assert.rejects(exec(process.execPath, [script, path.join(dir, "missing.html"), "--design", design, "--out", path.join(dir, "missing")]), (e) => e.code === 2 && /打不开/.test(e.stderr));

    const ok = await check(dir, "good", good, "--design", design, "--save-baseline", path.join(dir, "baseline.json"));
    assert.equal(ok.code, 0, JSON.stringify(ok.findings, null, 2));
    assert.match(ok.verdict, /^CHECK: PASS · bauhaus\+fauvism/);
    for (const shot of ok.screenshots) assert.ok((await fs.stat(shot)).size > 0);

    // 基线按页面路径存，所以同一页面的改版都写进 good.html
    // 只有构建指纹目录变了，不算内容变化
    const rebuilt = await check(dir, "good", good.replace("0123456789ab", "fedcba987654"), "--design", design, "--baseline", path.join(dir, "baseline.json"));
    assert.equal(rebuilt.code, 0, JSON.stringify(rebuilt.findings, null, 2));

    const broken = await check(dir, "good", bad, "--design", design, "--baseline", path.join(dir, "baseline.json"));
    assert.equal(broken.code, 1);
    assert.deepEqual([...failed(broken)].sort(), ["baseline", "buttons", "contrast", "focus", "fonts", "gradient", "images", "motion", "originals", "overflow", "radius", "shadow", "structure", "texture"]);
    assert.ok(broken.findings.some((f) => f.check === "baseline" && f.samples.some((s) => s.includes("改过的描述"))));
    assert.ok(broken.findings.some((f) => f.check === "baseline" && f.samples.some((s) => s.includes("- ads.js"))));

    // 多页面：一次查两页，基线按页面分开。旧页面照常比对；新页面只提醒没有基线；再存基线时追加新页面，不丢旧页面
    const privacy = path.join(dir, "privacy.html");
    await fs.writeFile(privacy, good.replace("<title>Fixture</title>", "<title>隐私</title>"));
    const both = await check(dir, "good", good, privacy, "--design", design, "--baseline", path.join(dir, "baseline.json"));
    assert.equal(both.code, 0, JSON.stringify(both.findings, null, 2));
    assert.match(both.verdict, /· 2 个页面 ·/);
    assert.deepEqual(both.findings.filter((f) => f.check === "baseline").map((f) => [f.level, f.page]), [["WARN", path.relative(process.cwd(), privacy)]]);
    await check(dir, "privacy", good.replace("<title>Fixture</title>", "<title>隐私</title>"), "--design", design, "--save-baseline", path.join(dir, "baseline.json"));
    const pages = Object.keys(JSON.parse(await fs.readFile(path.join(dir, "baseline.json"), "utf8")).pages);
    assert.equal(pages.length, 2);
    const changed = await check(dir, "good", good.replace("原来的描述", "改过的描述"), privacy, "--design", design, "--baseline", path.join(dir, "baseline.json"));
    assert.deepEqual(changed.findings.filter((f) => f.check === "baseline").map((f) => [f.level, path.basename(f.page)]), [["FAIL", "good.html"]]);
    // 导航全站一套：同语言的两页导航不一样要报，只差语言不比
    const withNav = (items, lang) => page(base, `<nav>${items}</nav>`, lang);
    await fs.writeFile(path.join(dir, "en.html"), withNav(`<a href="/en/">Mix</a><a href="/en/guide/">Guide</a>`, "en"));
    await fs.writeFile(path.join(dir, "nav-b.html"), withNav(`<a href="/">混合</a><a href="/guide/">教程</a>`));
    // 语言切换按页面指向各自的译文，不算导航不一致
    const zhNav = (other = "/en/") => withNav(`<a href="/">混合</a><a href="/#install">安装</a><a href="${other}" hreflang="en">EN</a>`);
    const navs = await check(dir, "nav-a", zhNav(), path.join(dir, "en.html"), path.join(dir, "nav-b.html"), "--design", design);
    assert.deepEqual(navs.findings.filter((f) => f.check === "nav").map((f) => [f.level, path.basename(f.page)]), [["FAIL", "nav-b.html"]]);
    await fs.writeFile(path.join(dir, "nav-b.html"), zhNav("/en/guide/"));
    const same = await check(dir, "nav-a", zhNav(), path.join(dir, "en.html"), path.join(dir, "nav-b.html"), "--design", design);
    assert.ok(!failed(same).has("nav"));


    const fontWarn = (r) => r.findings.some((f) => f.check === "fonts" && f.msg.startsWith("Jost 没有加载成功"));
    assert.ok(!fontWarn(await check(dir, "font-ok", fontPage(fontA), "--design", design)));
    assert.ok(fontWarn(await check(dir, "font-broken", fontPage("missing.woff2"), "--design", design)));

    // 极简主义只允许一个强调色：.dot 的 --accent3 和 .glass 的 --accent2 都要报出来，玻璃效果也要报
    const extra = (r) => [...new Set(r.findings.filter((f) => f.check === "palette" && f.level === "FAIL").map((f) => f.msg.match(/--accent\d/)[0]))].sort();
    const one = await check(dir, "minimal", minimal, "--mix", "minimalism+fauvism");
    assert.deepEqual(extra(one), ["--accent2", "--accent3"]);
    assert.ok(failed(one).has("glass"));

    // 排除区域里的问题不再算失败，区域外的照报
    const scoped = await check(dir, "scoped", minimal, "--mix", "minimalism+fauvism", "--ignore", ".glass");
    assert.deepEqual(extra(scoped), ["--accent3"]);
    assert.ok(!failed(scoped).has("glass"));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

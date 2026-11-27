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
  .dot { width: 80px; height: 80px; border-radius: 50%; background: var(--accent3); }`;
const page = (css, body, lang = "zh-CN") => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fixture</title><meta name="description" content="原来的描述"><meta property="og:image" content="https://example.com/assets/0123456789ab/images/a.jpg"><style>${css}</style></head><body><main><h1>纸页书店</h1><div class="rule"></div><div class="card"><p>每周三晚上读书。</p><a class="cta" href="/join">预约到店</a></div><div class="card"><div class="dot"></div></div>${body}</main></body></html>`;

const good = page(base, "");
const bad = page(`${base}
  .card { border-radius: 12px; box-shadow: 0 8px 24px oklch(0 0 0 / 0.2); }
  .grad { background: linear-gradient(90deg, var(--accent), var(--accent3)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .faint { color: oklch(0.8 0.03 85); }
  .wide { width: 700px; height: 10px; background: var(--ink); }
  a:focus-visible { outline: none; }
  .spin { width: 20px; height: 20px; background: var(--ink); animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(1turn); } }`, `<p class="grad">渐变标题</p><p class="faint">看不清的说明文字</p><div class="wide"></div><div class="spin"></div>`, "").replace("原来的描述", "改过的描述");
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
    const design = path.join(dir, "DESIGN.md");
    await fs.writeFile(design, (await exec(process.execPath, [mix, "bauhaus", "fauvism"])).stdout);

    const ok = await check(dir, "good", good, "--design", design, "--save-baseline", path.join(dir, "baseline.json"));
    assert.equal(ok.code, 0, JSON.stringify(ok.findings, null, 2));
    assert.match(ok.verdict, /^CHECK: PASS · bauhaus\+fauvism/);
    for (const shot of ok.screenshots) assert.ok((await fs.stat(shot)).size > 0);

    // 只有构建指纹目录变了，不算内容变化
    const rebuilt = await check(dir, "rebuilt", good.replace("0123456789ab", "fedcba987654"), "--design", design, "--baseline", path.join(dir, "baseline.json"));
    assert.equal(rebuilt.code, 0, JSON.stringify(rebuilt.findings, null, 2));

    const broken = await check(dir, "bad", bad, "--design", design, "--baseline", path.join(dir, "baseline.json"));
    assert.equal(broken.code, 1);
    assert.deepEqual([...failed(broken)].sort(), ["baseline", "contrast", "focus", "gradient", "motion", "overflow", "radius", "shadow", "structure"]);
    assert.ok(broken.findings.some((f) => f.check === "baseline" && f.samples.some((s) => s.includes("改过的描述"))));

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

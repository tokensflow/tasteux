#!/usr/bin/env node
// 在真实浏览器里按 DESIGN.md 检查页面：1440px 和 390px 截图，加上对比度、圆角、阴影、配色、字体、溢出、焦点环、减少动态效果和 SEO 保留检查。
// 用法：node scripts/check.mjs <网址或 HTML 文件>... [--design DESIGN.md | --mix 主+副] [--out 截图目录]
//       [--ignore 选择器] [--shot 选择器]... [--save-baseline 基线.json | --baseline 基线.json] [--allow radius,shadow,...] [--json]
// 一次可以查多个页面（每个页面模板一个网址）；基线按页面路径分开存在同一个文件里，--save-baseline 只覆盖这次查的页面。
// --ignore：DESIGN.md 不管的区域（比如展示别的风格的展品），不检查；DESIGN.md"适用范围"里"检查时排除：`选择器`"会自动读取。
// 需要 Node 22+ 和本机的 Chrome / Chromium / Edge（找不到时设 CHROME_PATH）。不装任何依赖。
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { linearRgb, resolve } from "./mix.mjs";

const WIDTHS = [
  { width: 1440, height: 900, mobile: false },
  { width: 390, height: 844, mobile: true },
];
const CHECKS = ["contrast", "radius", "shadow", "gradient", "glass", "palette", "fonts", "overflow", "targets", "structure", "images", "originals", "focus", "motion", "baseline", "buttons", "nav", "texture"];

// ---------- 参数 ----------
function parseArgs(argv) {
  const opts = { allow: new Set(), ignore: [], shots: [], targets: [] };
  const take = (i) => {
    if (argv[i + 1] == null) throw new Error(`${argv[i]} 需要一个值`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--design") opts.design = take(i++);
    else if (a === "--mix") opts.mix = take(i++);
    else if (a === "--out") opts.out = take(i++);
    else if (a === "--baseline") opts.baseline = take(i++);
    else if (a === "--ignore") opts.ignore.push(take(i++));
    else if (a === "--shot") opts.shots.push(take(i++));
    else if (a === "--save-baseline") opts.saveBaseline = take(i++);
    else if (a === "--allow") take(i++).split(",").forEach((x) => opts.allow.add(x.trim()));
    else if (a.startsWith("--")) throw new Error(`不认识的参数：${a}`);
    else opts.targets.push(a);
  }
  if (!opts.targets.length) throw new Error("用法：node scripts/check.mjs <网址或 HTML 文件>... [--design DESIGN.md | --mix 主+副] [--out 目录] [--ignore 选择器] [--shot 选择器] [--save-baseline 文件 | --baseline 文件] [--allow 项目] [--json]");
  for (const x of opts.allow) if (!CHECKS.includes(x)) throw new Error(`--allow 只接受：${CHECKS.join(", ")}`);
  return opts;
}

// 从 DESIGN.md 前言的 x-style-mix（或旧版第一行的 <!-- style-mix: 主+副 -->）读出组合，从"检查时排除："读出不检查的区域
async function readMix(opts) {
  const file = opts.design ?? (existsSync("DESIGN.md") ? "DESIGN.md" : null);
  const text = file ? await fs.readFile(file, "utf8") : "";
  const scope = text.match(/^检查时排除：(.+)$/m);
  if (scope) opts.ignore.push(...[...scope[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]));
  if (opts.mix) return opts.mix.split("+");
  if (!file) throw new Error("没有找到 DESIGN.md；用 --design 指定，或用 --mix 主+副");
  const hit = text.match(/^x-style-mix:\s*"?([a-z-]+)\+([a-z-]+)"?/m) ?? text.match(/<!--\s*style-mix:\s*([a-z-]+)\+([a-z-]+)/);
  if (!hit) throw new Error(`${file} 不是 style-mix 生成的（缺少 x-style-mix）；用 --mix 主+副 指定组合`);
  return [hit[1], hit[2]];
}

function specFor(m) {
  const p = m.F.palette;
  const encode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  const rgb = (c) => linearRgb(c).map((v) => Math.round(encode(v) * 255));
  const allowed = ["bg", "surface", "ink", "muted", "line", "accent", "onAccent", ...m.accents.slice(1)].map((k) => ({ name: k, rgb: rgb(p[k]) }));
  const extra = ["accent2", "accent3"].filter((k) => !m.accents.includes(k) && p[k]).map((k) => ({ name: k, rgb: rgb(p[k]) }));
  const st = m.S.structure;
  const shadow = st.shadow === "无" ? "none" : /无模糊|\dpx \dpx 0(?![.\d])/.test(st.shadow) ? "hard" : "any";
  return {
    allowed, extra, shadow, shadowText: st.shadow, radiusText: st.radius,
    slots: m.accents.length,
    gradients: m.dont.some((d) => d.includes("渐变")),
    display: st.type.display.family, body: st.type.body.family,
  };
}

// ---------- Chrome ----------
function findChrome() {
  const home = os.homedir();
  const fixed = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ...["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"].flatMap((b) => ["/usr/bin/", "/usr/local/bin/", "/snap/bin/"].map((d) => d + b)),
  ];
  // agent-browser 和 Playwright 自带的 Chromium
  const bundled = [path.join(home, ".agent-browser/browsers"), path.join(home, ".cache/ms-playwright")].flatMap((dir) => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((d) => [path.join(dir, d, "chrome"), path.join(dir, d, "chrome-linux/chrome"), path.join(dir, d, "chrome-linux64/chrome")]);
  });
  const hit = [...fixed, ...bundled].find((p) => p && existsSync(p));
  if (!hit) throw new Error("找不到 Chrome / Chromium / Edge；安装一个，或用 CHROME_PATH 指定路径");
  return hit;
}

async function launch() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-chrome-"));
  const args = ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--force-color-profile=srgb"];
  if (process.getuid?.() === 0 || process.env.STYLE_MIX_NO_SANDBOX) args.push("--no-sandbox");
  const proc = spawn(findChrome(), [...args, "about:blank"], { stdio: "ignore" });
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await new Promise((r) => setTimeout(r, 100));
    port = (await fs.readFile(path.join(dir, "DevToolsActivePort"), "utf8").catch(() => "")).split("\n")[0];
  }
  if (!port) throw new Error("Chrome 没有启动；容器里可以设 STYLE_MIX_NO_SANDBOX=1 再试");
  const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error("连不上 Chrome DevTools")); });
  let id = 0;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id) { pending.get(msg.id)?.(msg); pending.delete(msg.id); }
    else for (const w of waiters.splice(0)) w(msg);
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const event = (name, ms = 30000) => new Promise((res, rej) => {
    const timer = setTimeout(() => rej(new Error(`等待 ${name} 超时`)), ms);
    const listen = (msg) => (msg.method === name ? (clearTimeout(timer), res(msg.params)) : waiters.push(listen));
    waiters.push(listen);
  });
  const evaluate = async (fn, arg) => {
    const r = await send("Runtime.evaluate", { expression: `(${fn})(${JSON.stringify(arg ?? null)})`, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(`页面脚本出错：${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    return r.result.value;
  };
  const close = async () => { ws.close(); proc.kill(); await fs.rm(dir, { recursive: true, force: true }).catch(() => {}); };
  await send("Page.enable");
  return { send, event, evaluate, close };
}

async function open(b, url, view, reduceMotion = false) {
  await b.send("Emulation.setDeviceMetricsOverride", { width: view.width, height: view.height, deviceScaleFactor: 1, mobile: view.mobile });
  await b.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduceMotion ? "reduce" : "no-preference" }] });
  const loaded = b.event("Page.loadEventFired");
  const { errorText } = await b.send("Page.navigate", { url });
  if (errorText) {
    loaded.catch(() => {}); // 错误页不会再触发 load，不等它
    throw new Error(`打不开 ${url}：${errorText}`);
  }
  await loaded;
  await b.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 600))));
}

// 首屏原尺寸；整页切成最多 8 段、每段 2000px 高的缩小图，只用来查布局有没有断裂；区块按选择器原尺寸截
async function shoot(b, file, clip) {
  const { data } = await b.send("Page.captureScreenshot", { format: "png", ...(clip ? { clip, captureBeyondViewport: true } : {}) });
  await fs.writeFile(file, Buffer.from(data, "base64"));
}
async function overviewClips(b, view) {
  const { cssContentSize } = await b.send("Page.getLayoutMetrics");
  const height = Math.ceil(cssContentSize.height);
  const segment = Math.max(4000, Math.ceil(height / 8));
  const scale = Math.min(0.5, 2000 / segment);
  const clips = [];
  for (let y = 0; y < height; y += segment) clips.push({ x: 0, y, width: view.width, height: Math.min(segment, height - y), scale });
  return clips;
}
const sectionClip = (b, selector) => b.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.max(0, r.left + scrollX), y: r.top + scrollY, width: Math.max(1, Math.min(r.width, document.documentElement.scrollWidth)), height: Math.max(1, Math.min(r.height, 8000)), scale: 1 };
}, selector);

// 懒加载的图片在截图前不会自己加载：把范围内的 img 改成 eager，滚到它们旁边，等加载完（最多 10 秒），再滚回顶部。
// 返回加载失败的图片，避免把"没等到"和"真的坏了"混在一起。
const loadImages = (b, selector) => b.evaluate(async (s) => {
  const root = document.querySelector(s);
  if (!root) return [];
  const imgs = [...root.querySelectorAll("img")];
  for (const img of imgs) {
    if (img.loading === "lazy") img.loading = "eager";
    if (!img.src && img.dataset.src) img.src = img.dataset.src;
  }
  const deadline = Date.now() + 10000;
  for (const img of imgs) {
    if (!img.complete) img.scrollIntoView({ block: "center" });
    while (!img.complete && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
  }
  await Promise.all(imgs.map((img) => img.decode?.().catch(() => {})));
  scrollTo(0, 0);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return imgs.filter((img) => img.currentSrc && (!img.complete || img.naturalWidth === 0)).map((img) => `${img.currentSrc.slice(0, 120)}${img.complete ? "" : "（10 秒内没加载完）"}`);
}, selector);

// ---------- 页面里运行的检查（浏览器上下文，不能用外部变量） ----------
function audit(spec) {
  const out = [];
  const add = (check, level, msg, samples = []) => out.push({ check, level, msg, samples: [...new Set(samples)].slice(0, 5) });
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) return `${s}#${el.id}`;
    if (el.classList.length) s += `.${[...el.classList].slice(0, 2).join(".")}`;
    const parent = el.parentElement;
    return parent && parent !== document.body ? `${sel(parent)} > ${s}` : s;
  };
  // 计算样式里的颜色可能是 rgb()、oklch()、color() 等任意格式，统一画到 1px 画布上取 sRGB
  const ctx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const parse = (c) => {
    if (!c || c === "transparent") return [0, 0, 0, 0];
    if (!cache.has(c)) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      cache.set(c, [r, g, b, a / 255]);
    }
    return cache.get(c);
  };
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (x, y) => { const [h, l] = [lum(x), lum(y)].sort((p, q) => q - p); return (h + 0.05) / (l + 0.05); };
  const blend = (top, under) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3]));
  const visible = (el, cs) => {
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const art = ["svg", "picture", "video", "canvas", "[aria-hidden='true']", "[data-art]", ...spec.ignore].join(", ");
  const inArt = (el) => el.closest(art);
  const all = [...document.body.querySelectorAll("*")].filter((el) => !["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "BR"].includes(el.tagName));
  const styles = new Map(all.map((el) => [el, getComputedStyle(el)]));
  const shown = all.filter((el) => visible(el, styles.get(el)) && !(spec.ignore.length && el.closest(spec.ignore.join(", "))));

  // 对比度：每个直接带文字的元素，对它下面第一层不透明的底色
  const canvas = parse(getComputedStyle(document.documentElement).backgroundColor);
  const page = canvas && canvas[3] > 0 ? canvas : parse(getComputedStyle(document.body).backgroundColor)?.[3] > 0 ? parse(getComputedStyle(document.body).backgroundColor) : [255, 255, 255, 1];
  const backdrop = (el) => {
    const layers = [];
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none") return null;
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.99) break; }
    }
    return layers.reverse().reduce((under, c) => blend(c, under), page.slice(0, 3));
  };
  const lowContrast = [];
  let unknown = 0;
  for (const el of shown) {
    if (inArt(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = styles.get(el);
    const bg = backdrop(el);
    if (!bg) { unknown++; continue; }
    const fg = parse(cs.color);
    const color = fg[3] < 1 ? blend(fg, bg) : fg;
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
    const r = ratio(color, bg);
    if (r < (large ? 3 : 4.5)) lowContrast.push(`${sel(el)}「${el.textContent.trim().slice(0, 16)}」${r.toFixed(2)}:1（需要 ${large ? 3 : 4.5}）`);
  }
  if (lowContrast.length) add("contrast", "FAIL", `${lowContrast.length} 处文字对比度不够`, lowContrast);
  if (unknown) add("contrast", "WARN", `${unknown} 处文字压在图片或渐变上，没法自动算对比度，请看截图`);

  // 圆角：只允许 0，或者整个元素就是一个圆 / 胶囊（几何图形）
  const rounded = shown.filter((el) => {
    const cs = styles.get(el);
    const r = el.getBoundingClientRect();
    const radii = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"].map((k) => {
      const v = cs[k].split(" ")[0];
      return v.endsWith("%") ? (parseFloat(v) / 100) * Math.min(r.width, r.height) : parseFloat(v);
    });
    const max = Math.max(...radii);
    return max > 0.5 && max < Math.min(r.width, r.height) / 2 - 1;
  });
  if (rounded.length) add("radius", "FAIL", `${rounded.length} 个元素用了圆角，骨架规定：${spec.radiusText}`, rounded.map((el) => `${sel(el)} border-radius: ${styles.get(el).borderRadius}`));

  // 阴影
  const splitShadow = (s) => s.split(/,(?![^(]*\))/).map((x) => x.replace(/rgba?\([^)]*\)/, "").trim());
  const shadows = [];
  for (const el of shown) {
    if (spec.shadow === "any") break;
    const cs = styles.get(el);
    for (const [prop, value] of [["box-shadow", cs.boxShadow], ["text-shadow", cs.textShadow]]) {
      if (!value || value === "none") continue;
      // [x, y, blur, spread]；只有 spread 的 0 0 0 1px 是描边的写法，不算阴影
      const parts = splitShadow(value).map((s) => s.split(/\s+/).filter((x) => /px$/.test(x)).map(parseFloat));
      const bad = parts.some(([x = 0, y = 0, blur = 0]) => (spec.shadow === "none" ? x || y || blur : blur) > 0);
      if (bad) shadows.push(`${sel(el)} ${prop}: ${value}`);
    }
  }
  if (shadows.length) add("shadow", "FAIL", `${shadows.length} 处阴影不合规定：${spec.shadowText}`, shadows);

  // 按钮：立体斜面（inset/outset/ridge/groove）、双线、内阴影、描边外再套一圈负 offset 的 outline，都是 Win95 / 早期 Bootstrap 的样子，不属于任何骨架的按钮写法
  // 内阴影只在做成立体或内框时算：多层、带模糊或扩展、两个方向都偏移；单边的 inset 0 -2px 0 是选中下划线，不算
  const insetFrame = (value) => {
    const layers = splitShadow(value ?? "none").filter((x) => /\binset\b/.test(x)).map((x) => x.split(/\s+/).filter((v) => /px$/.test(v)).map(parseFloat));
    return layers.length > 1 || layers.some(([x = 0, y = 0, blur = 0, spread = 0]) => blur || spread || (x && y));
  };
  const buttons = shown.filter((el) => el.matches("button, [role=button], input[type=submit], input[type=button], a[class*='btn'], a[class*='button'], a[class*='cta']") && el !== document.activeElement);
  const bevel = [];
  for (const el of buttons) {
    const cs = styles.get(el);
    const styled = [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle].find((x) => ["inset", "outset", "ridge", "groove", "double"].includes(x));
    if (styled) bevel.push(`${sel(el)} border-style: ${styled}`);
    else if (insetFrame(cs.boxShadow)) bevel.push(`${sel(el)} box-shadow: ${cs.boxShadow}`);
    else if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none" && cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 && parseFloat(cs.outlineOffset) < 0) bevel.push(`${sel(el)} 描边内又套一圈 outline`);
  }
  if (bevel.length) add("buttons", "FAIL", `${bevel.length} 个按钮做成了立体或双层边框，按 DESIGN.md"布局"里的按钮写法做`, bevel);

  // 质感平铺（"检查时排除"的区域也查：接缝在哪种风格里都是瑕疵）：SVG feTurbulence 的滤镜区域默认比图块大 10%–20%，stitchTiles 接不上，每个图块边上一道竖缝
  const seams = new Set();
  for (const el of all) {
    const cs = styles.get(el);
    for (const value of [cs.maskImage, cs.webkitMaskImage, cs.backgroundImage]) {
      for (const [, u] of (value ?? "").matchAll(/url\("(data:image\/svg\+xml[^"]*)"\)/g)) {
        let svg;
        try { svg = decodeURIComponent(u.replace(/^data:image\/svg\+xml(;charset=[^,]*)?,/, "")); } catch { continue; }
        if (!/feTurbulence/.test(svg)) continue;
        const filters = svg.match(/<filter\b[^>]*>/g) ?? [];
        const tiled = /stitchTiles=['"]stitch/.test(svg) && filters.every((f) => /\bx=['"]0['"]/.test(f) && /\by=['"]0['"]/.test(f) && /width=['"]100%['"]/.test(f) && /height=['"]100%['"]/.test(f));
        if (!tiled) seams.add(sel(el));
      }
    }
  }
  if (seams.size) add("texture", "FAIL", "质感图块平铺有接缝：feTurbulence 要 stitchTiles=\"stitch\"，滤镜区域设成 x=0 y=0 width=100% height=100%（用 references/textures.css）", [...seams]);

  // 渐变文字、玻璃卡片、渐变背景
  const gradText = shown.filter((el) => { const cs = styles.get(el); return (cs.backgroundClip === "text" || cs.webkitBackgroundClip === "text") && cs.backgroundImage.includes("gradient"); });
  if (gradText.length) add("gradient", "FAIL", "用了渐变文字", gradText.map(sel));
  const glass = shown.filter((el) => { const v = styles.get(el).backdropFilter; return v && v !== "none"; });
  if (glass.length) add("glass", "FAIL", "用了 backdrop-filter 玻璃效果", glass.map(sel));
  if (spec.gradients) {
    const grads = shown.filter((el) => !inArt(el) && /gradient\(/.test(styles.get(el).backgroundImage));
    if (grads.length) add("gradient", "WARN", "禁止里有渐变，这些元素用了渐变背景；是质感层就忽略", grads.map(sel));
  }

  // 配色：页面上实际出现的颜色都应该来自调色板
  const near = (c, list) => list.find((p) => Math.hypot(c[0] - p.rgb[0], c[1] - p.rgb[1], c[2] - p.rgb[2]) <= 8);
  const off = new Map();
  const extra = new Map();
  for (const el of shown) {
    if (inArt(el) || el.tagName === "IMG") continue;
    const cs = styles.get(el);
    const used = [["color", cs.color], ["background", cs.backgroundColor]];
    if (parseFloat(cs.borderTopWidth) > 0) used.push(["border", cs.borderTopColor]);
    for (const [where, value] of used) {
      const c = parse(value);
      if (!c || c[3] < 0.99) continue;
      if (near(c, spec.allowed)) continue;
      const hit = near(c, spec.extra);
      const bucket = hit ? extra : off;
      const key = hit ? hit.name : value;
      if (!bucket.has(key)) bucket.set(key, []);
      bucket.get(key).push(`${sel(el)} ${where}`);
    }
  }
  for (const [name, where] of extra) add("palette", "FAIL", `用了 --${name}，骨架只允许 ${spec.slots} 个强调色`, where);
  if (off.size) add("palette", "WARN", `${off.size} 种颜色不在调色板里（插图请放进 svg / picture 或加 data-art）`, [...off].sort((a, b) => b[1].length - a[1].length).map(([c, w]) => `${c} × ${w.length}，如 ${w[0]}`));
  const root = getComputedStyle(document.documentElement);
  const missing = ["--bg", "--ink", "--accent"].filter((v) => !root.getPropertyValue(v).trim());
  if (missing.length) add("palette", "WARN", `根元素上没有 ${missing.join("、")}，颜色可能是写死的`);

  // 字体
  const first = (f) => f.split(",")[0].trim().replace(/^["']|["']$/g, "");
  const h1 = document.querySelector("h1");
  if (h1 && first(getComputedStyle(h1).fontFamily) !== spec.display) add("fonts", "WARN", `h1 的字体是 ${first(getComputedStyle(h1).fontFamily)}，DESIGN.md 是 ${spec.display}`);
  if (first(getComputedStyle(document.body).fontFamily) !== spec.body) add("fonts", "WARN", `正文字体是 ${first(getComputedStyle(document.body).fontFamily)}，DESIGN.md 是 ${spec.body}`);
  // 页面声明了这个字体族时，只要有一个字重加载成功就算加载了；不能用 document.fonts.check，它按 400 去配，没用到的字重没加载也会误报
  const faces = [...document.fonts];
  const loaded = (f) => { const mine = faces.filter((x) => first(x.family) === f); return !mine.length || mine.some((x) => x.status === "loaded"); };
  for (const f of new Set([spec.display, spec.body])) if (!loaded(f)) add("fonts", "WARN", `${f} 没有加载成功，页面用的是回退字体`);
  // 同一个字体族用两种 font-display 各加载了一次：先到的那次没赶上，后到的那次换上来，滚到一半标题就换字体
  for (const f of new Set(faces.map((x) => first(x.family)))) {
    const ways = new Set(faces.filter((x) => first(x.family) === f).map((x) => x.display));
    if (ways.size > 1) add("fonts", "FAIL", `${f} 用 ${[...ways].join(" 和 ")} 两种 font-display 各加载了一次，整站只能用一种`);
  }

  // 横向溢出
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    const wide = shown.filter((el) => el.getBoundingClientRect().right > vw + 1 && !el.parentElement.closest("[style*='overflow'], pre, table")).slice(0, 5);
    add("overflow", "FAIL", `页面比视口宽 ${document.documentElement.scrollWidth - vw}px，出现横向滚动`, wide.map(sel));
  }

  // 点按目标（只在手机宽度）
  if (innerWidth < 600) {
    const small = shown.filter((el) => el.matches("a[href], button, input:not([type=hidden]), select, textarea, [role=button]")).filter((el) => {
      const r = el.getBoundingClientRect();
      const inline = el.tagName === "A" && el.parentElement.matches("p, li") && el.parentElement.textContent.trim() !== el.textContent.trim();
      return !inline && (r.width < 24 || r.height < 24);
    });
    if (small.length) add("targets", "WARN", `${small.length} 个可点元素小于 24×24px`, small.map((el) => `${sel(el)} ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`));
  }

  // 原作：<figure data-original> 里的画不加滤镜、混合模式、半透明，要有写明出处的图注
  for (const fig of document.querySelectorAll("[data-original]")) {
    const img = fig.querySelector("img");
    if (!img) continue;
    const bad = [];
    for (let n = img; n && n !== fig.parentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.filter !== "none") bad.push(`filter: ${cs.filter}`);
      if (cs.mixBlendMode !== "normal") bad.push(`mix-blend-mode: ${cs.mixBlendMode}`);
      if (Number(cs.opacity) < 1) bad.push(`opacity: ${cs.opacity}`);
    }
    if (bad.length) add("originals", "FAIL", "原作被加了滤镜、混合模式或半透明", [`${sel(fig)} ${bad.join("；")}`]);
    const cap = fig.querySelector("figcaption");
    if (!cap || !cap.querySelector("a[href]")) add("originals", "FAIL", "原作没有带出处链接的图注（figcaption 里写作者、标题、收藏方、许可并链接出处）", [sel(fig)]);
  }

  // 页面结构
  if (!document.documentElement.lang) add("structure", "FAIL", "<html> 没有 lang");
  if (!document.title.trim()) add("structure", "WARN", "没有 <title>");
  const h1s = document.querySelectorAll("h1").length;
  if (h1s !== 1) add("structure", "WARN", `有 ${h1s} 个 h1，通常应该正好 1 个`);
  const noAlt = [...document.images].filter((img) => !img.hasAttribute("alt"));
  if (noAlt.length) add("structure", "WARN", `${noAlt.length} 张图片没有 alt`, noAlt.map(sel));
  return out;
}

// 风格以外、改版时不该变的内容
// 构建时按内容生成的指纹目录（/assets/<hex>/）只要任何资源变了就会变，比较前统一换成 /assets/*/
// 脚本和 iframe 只取页面 HTML 原文里写的：广告和统计脚本运行时插入的 iframe、按版本号变的子脚本每次加载都不一样，比它们只会误报；
// 原文里的 <script src> 还在，就说明统计和广告代码没被删
function snapshot(source) {
  const doc = new DOMParser().parseFromString(source, "text/html");
  const norm = (s) => (s ?? "").replace(/\/assets\/[0-9a-f]{8,}\//g, "/assets/*/");
  const attr = (q, a, root = document) => [...root.querySelectorAll(q)].map((el) => norm(el.getAttribute(a)));
  const meta = Object.fromEntries([...document.querySelectorAll("meta[name], meta[property]")].map((m) => [m.getAttribute("name") ?? m.getAttribute("property"), norm(m.content)]).filter(([k]) => /^(description|robots|keywords|og:|twitter:|google-|msvalidate)/.test(k)));
  return {
    title: document.title,
    lang: document.documentElement.lang,
    canonical: attr("link[rel=canonical]", "href"),
    meta,
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => norm(s.textContent.trim())),
    headings: [...document.querySelectorAll("h1, h2, h3")].map((h) => `${h.tagName} ${h.textContent.trim().replace(/\s+/g, " ")}`),
    links: [...new Set(attr("a[href]", "href"))].sort(),
    scripts: [...new Set(attr("script[src]", "src", doc))].sort(),
    iframes: attr("iframe[src]", "src", doc),
    forms: attr("form", "action"),
  };
}

function diffSnapshot(before, after) {
  const changes = [];
  for (const key of Object.keys(before)) {
    const [a, b] = [JSON.stringify(before[key]), JSON.stringify(after[key])];
    if (a === b) continue;
    if (Array.isArray(before[key])) {
      const gone = before[key].filter((x) => !after[key].includes(x));
      const added = after[key].filter((x) => !before[key].includes(x));
      changes.push(`${key}：${[...gone.map((x) => `- ${x}`), ...added.map((x) => `+ ${x}`)].join("；") || "顺序变了"}`);
    } else if (typeof before[key] === "object") {
      for (const k of new Set([...Object.keys(before[key]), ...Object.keys(after[key] ?? {})])) if (before[key][k] !== after[key]?.[k]) changes.push(`meta ${k}：${before[key][k] ?? "（无）"} → ${after[key]?.[k] ?? "（无）"}`);
    } else changes.push(`${key}：${before[key]} → ${after[key]}`);
  }
  return changes;
}

// ---------- 运行 ----------
// 基线里每个页面的键：网址取路径和查询串（换域名、换端口不算变化），本地文件取相对当前目录的路径
const pageKey = (target) => (/^[a-z]+:\/\//i.test(target) && !target.startsWith("file:") ? (({ pathname, search }) => pathname + search)(new URL(target)) : path.relative(process.cwd(), path.resolve(target.replace(/^file:\/\//, ""))));

async function readBaseline(file, firstKey) {
  const data = JSON.parse(await fs.readFile(file, "utf8"));
  return data.pages ?? { [firstKey]: data }; // 旧版基线只存一个页面，算作第一个页面的
}

// 页面 HTML 原文（服务器返回的，或本地文件），不含脚本运行后插入的节点
const source = async (url) => {
  if (url.startsWith("file:")) return fs.readFile(fileURLToPath(url), "utf8");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`打不开 ${url}：HTTP ${res.status}`);
  return res.text();
};

async function checkPage(b, target, opts, spec, out, baseline, saved) {
  const key = pageKey(target);
  const url = /^[a-z]+:\/\//i.test(target) ? target : pathToFileURL(path.resolve(target)).href;
  await fs.mkdir(out, { recursive: true });
  const findings = [];
  const shots = [];
  let nav;
  for (const view of WIDTHS) {
    await open(b, url, view);
    const fold = path.join(out, `${view.width}-fold.png`);
    await shoot(b, fold);
    shots.push(fold);
    const broken = await loadImages(b, "body");
    if (broken.length) findings.push({ check: "images", level: "FAIL", msg: `${broken.length} 张图片加载失败`, samples: [...new Set(broken)].slice(0, 5), width: view.width });
    for (const [i, clip] of (await overviewClips(b, view)).entries()) {
      const file = path.join(out, `${view.width}-overview-${i + 1}.png`);
      await shoot(b, file, clip);
      shots.push(file);
    }
    for (const [i, selector] of opts.shots.entries()) {
      const clip = await sectionClip(b, selector);
      if (!clip) { findings.push({ check: "structure", level: "WARN", msg: `--shot 找不到 ${selector}`, samples: [], width: view.width }); continue; }
      const file = path.join(out, `${view.width}-section-${i + 1}.png`);
      await shoot(b, file, clip);
      shots.push(file);
    }
    for (const f of await b.evaluate(audit, spec)) findings.push({ ...f, width: view.width });
    if (!view.mobile) {
      // 键盘焦点：按 Tab 走前 12 个可聚焦元素，每个都要有看得见的焦点环
      const bad = [];
      for (let i = 0; i < 12; i++) {
        for (const type of ["keyDown", "keyUp"]) await b.send("Input.dispatchKeyEvent", { type, key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
        const r = await b.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 1) || cs.boxShadow !== "none";
          const name = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : el.classList.length ? `.${el.classList[0]}` : "");
          return { name, ring, width: cs.outlineStyle !== "none" ? parseFloat(cs.outlineWidth) : null };
        });
        if (!r) break;
        if (!r.ring) bad.push(`${r.name} 没有焦点环`);
        else if (r.width !== null && r.width < 2) bad.push(`${r.name} 焦点环只有 ${r.width}px`);
      }
      if (bad.length) findings.push({ check: "focus", level: "FAIL", msg: "键盘焦点看不清（DESIGN.md 要求 2px 焦点环）", samples: [...new Set(bad)].slice(0, 5), width: view.width });
      const snap = await b.evaluate(snapshot, await source(url));
      nav = await b.evaluate(() => {
        const el = document.querySelector("header nav, nav, [role=navigation]");
        return { lang: document.documentElement.lang, items: el ? [...el.querySelectorAll("a[href]:not([hreflang]):not([lang])")].map((a) => `${a.textContent.trim().replace(/\s+/g, " ")} → ${new URL(a.href).pathname}${new URL(a.href).hash}`) : [] };
      });
      if (saved) saved[key] = snap;
      if (baseline && !baseline[key]) findings.push({ check: "baseline", level: "WARN", msg: `基线里没有 ${key}：新页面先确认内容，再用 --save-baseline 把它加进基线`, samples: [], width: view.width });
      else if (baseline) {
        const changes = diffSnapshot(baseline[key], snap);
        if (changes.length) findings.push({ check: "baseline", level: "FAIL", msg: `${changes.length} 处风格以外的内容变了（标题、meta、JSON-LD、链接或脚本）`, samples: changes.slice(0, 8), width: view.width });
      }
    }
  }
  // 减少动态效果：模拟 prefers-reduced-motion: reduce，页面上不应该还有在跑的动画
  await open(b, url, WIDTHS[0], true);
  const moving = await b.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.getComputedTiming().duration ?? 0) > 50).map((a) => `${a.animationName ?? a.constructor.name} on ${a.effect?.target?.tagName?.toLowerCase() ?? "?"}`));
  if (moving.length) findings.push({ check: "motion", level: "FAIL", msg: `减少动态效果时还有 ${moving.length} 个动画在跑`, samples: [...new Set(moving)], width: 1440 });
  return { findings: findings.map((f) => ({ ...f, page: key })), shots, nav };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const m = resolve(await readMix(opts));
  const spec = { ...specFor(m), ignore: opts.ignore };
  const root = path.resolve(opts.out ?? ".style-mix/check");
  const keys = opts.targets.map(pageKey);
  const baseline = opts.baseline ? await readBaseline(opts.baseline, keys[0]) : null;
  const saved = opts.saveBaseline ? (existsSync(opts.saveBaseline) ? await readBaseline(opts.saveBaseline, keys[0]) : {}) : null;
  const findings = [];
  const shots = [];
  const navs = [];
  const b = await launch();
  try {
    for (const [i, target] of opts.targets.entries()) {
      // 多个页面时每页的截图放进自己的子目录，名字取自页面路径
      const out = opts.targets.length > 1 ? path.join(root, `${i + 1}-${keys[i].replace(/[^\w\u4e00-\u9fff-]+/g, "_").replace(/^_+|_+$/g, "") || "index"}`) : root;
      const r = await checkPage(b, target, opts, spec, out, baseline, saved);
      findings.push(...r.findings);
      shots.push(...r.shots);
      navs.push({ page: keys[i], ...r.nav });
    }
    // 导航全站一套：同一语言的页面，导航条目、顺序和写法都要一样；语言切换链接（带 hreflang 或 lang）按页面指向译文，不比
    for (const lang of new Set(navs.map((n) => n.lang))) {
      const group = navs.filter((n) => n.lang === lang);
      const sign = (n) => n.items.join(" | ");
      for (const n of group.slice(1)) if (sign(n) !== sign(group[0])) findings.push({ check: "nav", level: "FAIL", msg: `${n.page} 的导航和 ${group[0].page} 不一样，全站要用同一套导航`, samples: [`${group[0].page}：${sign(group[0]) || "（没有导航）"}`, `${n.page}：${sign(n) || "（没有导航）"}`], width: 1440, page: n.page });
    }
  } finally {
    await b.close();
  }
  if (saved) await fs.writeFile(opts.saveBaseline, `${JSON.stringify({ pages: saved }, null, 2)}\n`);

  const kept = findings.filter((f) => !opts.allow.has(f.check));
  const fails = kept.filter((f) => f.level === "FAIL").length;
  const warns = kept.filter((f) => f.level === "WARN").length;
  const skipped = [...(opts.allow.size ? [`按 --allow 跳过 ${[...opts.allow].join("、")}`] : []), ...(opts.ignore.length ? [`不检查 ${opts.ignore.join("、")}`] : [])];
  const pages = opts.targets.length > 1 ? ` · ${opts.targets.length} 个页面` : "";
  const verdict = `CHECK: ${fails ? "FAIL" : "PASS"} · ${m.S.id}+${m.F.id}${pages} · ${fails} 项未通过，${warns} 项提醒${skipped.length ? `；${skipped.join("；")}` : ""}`;
  if (opts.json) process.stdout.write(`${JSON.stringify({ verdict, structure: m.S.id, surface: m.F.id, findings: kept, screenshots: shots }, null, 2)}\n`);
  else {
    const lines = [verdict, ""];
    for (const f of kept) lines.push(`${f.level} [${f.check}] ${pages ? `${f.page} ` : ""}${f.width}px：${f.msg}`, ...f.samples.map((s) => `    ${s}`));
    if (!kept.length) lines.push("没有发现问题。仍然要逐张看截图：质感、母题和整体观感只能靠眼睛。");
    lines.push("", "截图（fold 是首屏原尺寸；overview 是分段缩小的整页，只用来查布局断裂；section 是 --shot 的区块）：", ...shots.map((s) => `  ${s}`));
    process.stdout.write(`${lines.join("\n")}\n`);
  }
  process.exitCode = fails ? 1 : 0;
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
});

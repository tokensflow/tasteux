#!/usr/bin/env node
// 按 references/mixing.md 把一到三个流派混成 DESIGN.md。逻辑移植自 tasteux.com 工作台（app.js 的 mix / designDoc / codePrompt / imagePrompt），两边改动要同步。
// 用法：node scripts/mix.mjs <流派> [流派] [流派] [--subject "生图主题"] [--json]
// 也可以被 check.mjs 导入：resolve(["bauhaus", "fauvism"]) 返回混合结果。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const data = JSON.parse(readFileSync(new URL("../schools.json", import.meta.url), "utf8"));
const uniq = (list) => [...new Set(list)];
const clause = (text) => text.split(/[，。；：]/)[0];

// ---------- 颜色：OKLCH → 相对亮度 → WCAG 对比度 ----------
export function linearRgb(color) {
  const [L, C, H] = color.match(/oklch\(([^)]+)\)/)[1].trim().split(/\s+/).map(Number);
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return [r, g, bl];
}
const luminance = (color) => {
  const [r, g, b] = linearRgb(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrast(x, y) {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- 识别流派与定主副（mixing.md 第 2 条） ----------
const norm = (s) => s.toLowerCase().replace(/[\s_\-·]/g, "");
function find(name) {
  const hit = data.schools.find((s) => [s.id, s.name, s.en, ...s.aliases].some((a) => norm(a) === norm(name)));
  if (hit) return hit;
  const list = data.schools.map((s) => `${s.name}（${s.id}）`).join("、");
  throw new Error(`没有这个流派：${name}。现有流派：${list}`);
}
const isStructure = (s) => s.roles.includes("structure");
const MINIMALISM = data.schools.find((s) => s.id === "minimalism");

function cast(names) {
  const picked = uniq(names.map(find));
  const notes = [];
  const [a, b = a, ...rest] = picked;
  let S, F;
  let motifsFrom = rest.slice(0, 1);
  if (picked.length === 1) [S, F] = isStructure(a) ? [a, a] : [MINIMALISM, a];
  else if (isStructure(a)) [S, F] = [a, b];
  else if (isStructure(b)) [S, F] = [b, a];
  else {
    [S, F] = [MINIMALISM, a];
    motifsFrom = [b];
    notes.push(`${a.name}和${b.name}都只能当表皮，结构改用极简主义；${b.name}只贡献母题。`);
  }
  if (picked.length === 1 && !isStructure(a)) notes.push(`${a.name}只能当表皮，结构用极简主义。`);
  if (rest.length) notes.push(`一次最多混合两个流派，${rest[0].name}只贡献母题。`);
  return { S, F, extraMotifs: motifsFrom.flatMap((x) => x.motifs), extraMotifsEn: motifsFrom.flatMap((x) => x.motifsEn), notes };
}

// ---------- 混合（mixing.md 第 1、3、4 条） ----------
const stem = (w) => w.replace(/(ists|ism|ist|ic|al|s|y)$/, "");
const words = (text) => text.toLowerCase().split(/[^a-z]+/).filter(Boolean).map(stem);
function conflicts(term, imagery) {
  return words(term).every((x) => imagery.has(x)) || imagery.has(stem(term.toLowerCase().replace(/[^a-z]/g, "")));
}
function imageryWords(F) {
  const text = `${F.medium} ${F.motifsEn.join(" ")}`;
  const raw = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return new Set([...words(text), ...raw.slice(1).map((x, i) => stem(raw[i] + x))]);
}

function mix({ S, F, extraMotifs, extraMotifsEn, notes }) {
  const st = S.structure;
  const level = Math.min(F.texture.level, st.textureCap);
  const imagery = imageryWords(F);
  return {
    S, F, notes,
    pure: S.id === F.id,
    level,
    capped: F.texture.level > st.textureCap,
    kind: level > 0 ? F.texture.kind : "none",
    accents: ["accent", "accent2", "accent3"].slice(0, st.accentSlots),
    motifs: uniq([...F.motifs, ...extraMotifs]),
    motifsEn: uniq([...F.motifsEn, ...extraMotifsEn]),
    dont: uniq([...st.dont, ...F.dont]),
    negative: uniq([...st.negative, ...F.negative]).filter((n) => !conflicts(n, imagery)),
    thesis: S.id === F.id
      ? `${S.name}的纯粹形态：${S.essence}`
      : `${S.name}搭骨架：${clause(st.grid)}；${F.name}上颜色：${clause(F.colorUsage)}。`,
  };
}

// ---------- 每个强调色上能放什么（数据里没有校验 accent2 / accent3） ----------
const LARGE = "24px 以上或 18.7px 以上粗体的大字";
function onAccent(p, k) {
  const [name, c] = [["--ink", contrast(p.ink, p[k])], ["--on-accent", contrast(p.onAccent, p[k])]].sort((x, y) => y[1] - x[1])[0];
  const r = c.toFixed(2);
  if (c >= 4.5) return `--${k} 上的文字用 ${name}（${r}:1）`;
  if (c >= 3) return `--${k} 上只放 ${LARGE}或图标，用 ${name}（${r}:1）；正文和小字不放在 --${k} 上`;
  return `--${k} 只做色块和插图，不放文字（最高 ${r}:1）`;
}
function accentAsText(p, k) {
  const c = contrast(p[k], p.bg);
  const r = c.toFixed(2);
  if (c >= 4.5) return `--${k} 可以直接做 --bg 上的文字色（${r}:1）`;
  if (c >= 3) return `--${k} 在 --bg 上只做 ${LARGE}、图标和边框（${r}:1）`;
  return `--${k} 不做 --bg 上的文字色（${r}:1），链接和强调文字用 --ink 加下划线或粗细区分`;
}
export function a11y(m) {
  const p = m.F.palette;
  return [
    `- 正文与背景对比度 ≥ 4.5:1（--ink / --bg ${contrast(p.ink, p.bg).toFixed(2)}:1，--muted / --bg ${contrast(p.muted, p.bg).toFixed(2)}:1）。`,
    `- --accent 上的文字用 --on-accent（${contrast(p.onAccent, p.accent).toFixed(2)}:1）。`,
    ...m.accents.slice(1).map((k) => `- ${onAccent(p, k)}。`),
    ...m.accents.map((k) => `- ${accentAsText(p, k)}。`),
    inverse(p),
    "- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。",
  ];
}
// 反相区块：--ink 做底、--bg 做字，颜色仍在调色板里，不另造深色
function inverse(p) {
  const muted = contrast(p.muted, p.ink);
  return `- 反相区块（深色通栏，比如展厅、页脚）：--ink 做底，--bg 做字（${contrast(p.bg, p.ink).toFixed(2)}:1），${muted >= 4.5 ? `--muted 可做次要文字（${muted.toFixed(2)}:1）` : `次要文字也用 --bg，不用 --muted（只有 ${muted.toFixed(2)}:1）`}，按钮仍是 --accent 配 --on-accent；不要另造调色板以外的深色。`;
}

// ---------- 输出 ----------
const ROLE_WORDS = "规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。";
// 全大写、窄体只对拉丁字母有意义；中文大标题的做法写死，免得各自发挥
const zhDisplay = (t) => (t.display.transform === "uppercase" || /Condensed|Oswald|Bebas|Saira/.test(t.display.family)
  ? "中文大标题不套用全大写和窄体：中文用 900 字重、字距 0 到 0.05em；要窄体的分量感时，在中文大标题上方配一行全大写的拉丁小标题。不要用 font-stretch、transform: scaleX 压扁汉字，也不要用 skewX 或 oblique 做伪斜体；骨架要求倾斜时用 rotate 把整块标题转过去。"
  : "");
const fontStack = (family, zh) => `"${family}", ${zh}`;
const accentRule = (m) => m.accents.length < 3 && !m.pure
  ? `只使用 ${m.accents.length} 个强调色（${m.S.name}的规矩）。上面的用法如果提到更多颜色，以这一条为准。`
  : `只使用 ${m.accents.length} 个强调色。`;
function rootVars(m) {
  const p = m.F.palette;
  const vars = [["--bg", p.bg], ["--surface", p.surface], ["--ink", p.ink], ["--muted", p.muted], ["--line", p.line], ["--accent", p.accent], ["--on-accent", p.onAccent], ...m.accents.slice(1).map((k) => [`--${k}`, p[k]])];
  return [":root {", ...vars.map(([k, v]) => `  ${k}: ${v};`), "}"];
}
const motifRule = (m) => `母题首先用在主视觉和插图里。${m.pure ? "" : "和骨架规则不冲突时，"}也可以做成界面上的单个图形，但不要铺成重复的底纹。有冲突时按 mixing.md 第 4 条只放进插图。`;
const motion = (st) => `${st.motion.desc}，${st.motion.duration} ${st.motion.easing}。按下时也要有反馈。用键盘快捷键触发的状态切换不加过渡，遵守 prefers-reduced-motion。`;
const texture = (m) => m.kind === "none" ? "无，纯平面" : `${m.F.texture.desc}，强度 ${m.level}${m.capped ? `（${m.F.name} ${m.F.texture.level} 被${m.S.name}上限 ${m.S.structure.textureCap} 截断）` : ""}`;

// 表皮流派的公有领域原作：主视觉优先用它们，没有合适的才生图
function originals(m) {
  const works = m.F.works ?? [];
  if (!works.length) return [];
  return [
    "## 原作",
    `主视觉优先用${m.F.name}的公有领域原作，没有合适的才用下面的生图提示词。规则：`,
    "- 放在 `<figure data-original>` 里，图片用 `<picture>` 或 `<img>`，`<figcaption>` 写作者、标题、年代、收藏方和许可，并链接到出处页。",
    "- 不裁掉题款和印章，不加滤镜、混合模式或半透明，不铺质感，不在画面上压文字。可以整幅缩放，横卷可以只取一段，但要在图注里写明是局部。",
    "- 下载后存进项目，不要直接热链博物馆的图片地址。",
    "",
    ...works.map((w) => `- 《${w.title}》${w.en ? ` ${w.en}` : ""}，${w.artist}，${w.year}。${w.license}。出处：${w.page}`),
    "",
  ];
}

function codePrompt(m) {
  const { S, F } = m;
  const st = S.structure;
  const t = st.type;
  return [
    m.pure ? `请按下面的设计系统实现页面：${S.name}（${S.en}）。` : `请按下面的设计系统实现页面：${S.name}（${S.en}）的结构 × ${F.name}（${F.en}）的色彩与质感。`,
    m.thesis, "",
    "【CSS 变量】", ...rootVars(m), `用色：${F.colorUsage}`, accentRule(m), "",
    "【字体】",
    `标题：${t.display.family} ${t.display.weight}${t.display.transform === "uppercase" ? "，全大写" : ""}，字距 ${t.display.tracking}`,
    `正文：${t.body.family} ${t.body.weight}`,
    `中文回退：${t.zh}；中文标题 700–900 字重，字距不用负值${zhDisplay(t) ? `。${zhDisplay(t)}` : ""}`,
    `Google Fonts：${t.google.join(" / ")}`, "",
    "【布局】", `栅格：${st.grid}`, ...st.rules.map((r) => `- ${r}`), ...(m.pure ? [] : [ROLE_WORDS]),
    `圆角 ${st.radius}；边框 ${st.border}；阴影 ${st.shadow}；密度 ${st.density}`, "",
    `【质感】${texture(m)}${m.kind === "none" ? "" : "，只铺在背景上，不盖住文字"}`,
    `【母题】${m.motifs.join("、")}。${motifRule(m)}`,
    ...(m.F.frames?.length ? [`【界面框式】${m.F.frames.join("；")}`] : []),
    ...(m.F.works?.length ? [`【主视觉】优先用${m.F.name}的公有领域原作（见 DESIGN.md「原作」），写明出处和许可，不加滤镜、不铺质感、不裁题款。`] : []),
    `【动效】${motion(st)}`,
    `【禁止】${m.dont.join("、")}。不要使用渐变文字、默认玻璃卡片、通用圆角阴影卡片网格。`,
    "【无障碍】", ...a11y(m),
  ].join("\n");
}

// 生图模型会把这些母题画成乱码文字（题跋、题签、剪报、印章），生图时去掉，并在负向词里禁止文字
// 媒介或构图本身就是字（达达的剪报和混排字体）时，只禁水印和签名
const TEXTY = /inscription|calligraph|cartouche|lettering|typography|typeface|newspaper|stamp/i;
const noText = (medium) => (TEXTY.test(medium) ? ["watermark", "signature"] : ["text", "letters", "calligraphy", "watermark", "signature"]);
function imagePrompt(m, subject) {
  const { S, F } = m;
  const composition = m.pure ? S.structure.composition : S.structure.composition.replace(/\bblack\b/g, "dark");
  const motifs = m.motifsEn.filter((x) => !TEXTY.test(x));
  const body = [subject, F.medium, composition, `palette of ${F.colorWords.join(", ")}`, ...(motifs.length ? [`featuring ${motifs.join(", ")}`] : [])].join(", ");
  return `${body}, original composition, do not reproduce any famous artwork\nNegative: ${uniq([...m.negative, ...noText(`${F.medium} ${composition}`)]).join(", ")}`;
}

function label(m) {
  const { S, F } = m;
  const st = S.structure;
  const intro = (s, role, items) => [`**${s.name} ${s.en}**${role ? ` · ${role}` : ""} · ${s.era}`, "", s.intro, "", "这次负责：", ...items.map((x) => `- ${x}`), ""];
  if (m.pure) return intro(S, "", [`排版和字体：${clause(st.grid)}，标题用 ${st.type.display.family}`, `配色和质感：${clause(F.colorUsage)}`, `主视觉：${F.motifs.slice(0, 2).join("、")}`]);
  return [
    ...intro(S, "骨架", [`排版：${clause(st.grid)}`, `标题字体：${st.type.display.family}`]),
    ...intro(F, "表皮", [`配色：${clause(F.colorUsage)}`, `质感：${texture(m)}`, `主视觉：${F.motifs.slice(0, 2).join("、")}`]),
  ];
}

// ---------- Stitch DESIGN.md 前言（google-labs-code/design.md，version alpha） ----------
const q = (s) => JSON.stringify(String(s));
const dim = (v) => (/^-?\d*\.?\d+$/.test(String(v)) ? `${v}${Number(v) === 0 ? "px" : "em"}` : v);
function frontmatter(m) {
  const { S, F } = m;
  const st = S.structure;
  const p = F.palette;
  const t = st.type;
  const colors = [
    ["primary", p.accent, "--accent"],
    ["on-primary", p.onAccent, "--on-accent"],
    ...(m.accents.includes("accent2") ? [["secondary", p.accent2, "--accent2"]] : []),
    ...(m.accents.includes("accent3") ? [["tertiary", p.accent3, "--accent3"]] : []),
    ["background", p.bg, "--bg"],
    ["on-background", p.ink, "--ink"],
    ["surface", p.surface, "--surface"],
    ["on-surface", p.ink, "--ink"],
    ["on-surface-variant", p.muted, "--muted"],
    ["outline", p.line, "--line"],
  ];
  // 强调色色块上的文字只在 ≥ 4.5:1 时写进组件，和"无障碍"的分级一致
  const block = (role, k) => {
    const text = [["on-background", p.ink], ["on-primary", p.onAccent]].sort((x, y) => contrast(y[1], p[k]) - contrast(x[1], p[k]))[0];
    return [`  ${role}-block:`, `    backgroundColor: "{colors.${role}}"`, ...(contrast(text[1], p[k]) >= 4.5 ? [`    textColor: "{colors.${text[0]}}"`] : [])];
  };
  const pill = /999px/.test(st.radius);
  return [
    "---",
    "version: alpha",
    `name: ${q(m.pure ? `${S.name} 原样` : `${S.name} × ${F.name}`)}`,
    `description: ${q(m.thesis)}`,
    `x-style-mix: ${q(`${S.id}+${F.id}`)} # 重新生成：node scripts/mix.mjs ${S.id} ${F.id}；数据 schools.json v${data.version}`,
    "colors:",
    ...colors.map(([k, v, css]) => `  ${k}: ${q(v)} # ${css}`),
    "typography:",
    "  display:",
    `    fontFamily: ${q(t.display.family)}`,
    `    fontWeight: ${t.display.weight}`,
    `    letterSpacing: ${dim(t.display.tracking)}`,
    "  body:",
    `    fontFamily: ${q(t.body.family)}`,
    `    fontWeight: ${t.body.weight}`,
    "rounded:",
    "  none: 0px",
    ...(pill ? ["  full: 999px"] : []),
    "omitted:",
    "  - spacing",
    "components:",
    "  page:",
    '    backgroundColor: "{colors.background}"',
    '    textColor: "{colors.on-background}"',
    "  card:",
    '    backgroundColor: "{colors.surface}"',
    '    textColor: "{colors.on-surface}"',
    '    rounded: "{rounded.none}"',
    "  caption:",
    '    backgroundColor: "{colors.background}"',
    '    textColor: "{colors.on-surface-variant}"',
    "  button-primary:",
    '    backgroundColor: "{colors.primary}"',
    '    textColor: "{colors.on-primary}"',
    '    rounded: "{rounded.none}"',
    ...(m.accents.includes("accent2") ? block("secondary", "accent2") : []),
    ...(m.accents.includes("accent3") ? block("tertiary", "accent3") : []),
    "  divider:",
    '    backgroundColor: "{colors.outline}"',
    "---",
  ];
}

export function designDoc(m, subject = "{主题：按场景写一个具体画面}") {
  const { S, F } = m;
  const st = S.structure;
  const t = st.type;
  return [
    ...frontmatter(m),
    m.pure ? `# ${S.name} 原样` : `# ${S.name} × ${F.name}`, "",
    "## 展签",
    m.pure ? `${S.name} ${S.en} 原样` : `主 · ${S.name} ${S.en}，副 · ${F.name} ${F.en}`,
    ...m.notes, "", ...label(m),
    "## 主张", m.thesis, "",
    "## 适用范围",
    "整个页面。",
    "<!-- 外壳和展品分开的网站（比如页面里展示别的风格的作品、截图、预览），写明这份规范只管哪部分，并把不归它管的区域写成一行：检查时排除：`.gallery`、`#preview`。check.mjs 会读这一行。 -->",
    "",
    "## 色彩", "```css", ...rootVars(m), "```", `用法：${F.colorUsage}`, accentRule(m), "",
    "## 字体",
    `- 标题：font-family: ${fontStack(t.display.family, t.zh)}；字重 ${t.display.weight}；${t.display.transform === "uppercase" ? "全大写；" : ""}字距 ${t.display.tracking}`,
    `- 正文：font-family: ${fontStack(t.body.family, t.zh)}；字重 ${t.body.weight}`,
    "- 中文标题：拉丁标题字体没有中文字形，中文会落到回退字体，所以中文标题单独指定 700–900 字重，和拉丁标题的分量一致；字距不要用负值",
    ...(zhDisplay(t) ? [`- ${zhDisplay(t)}`] : []),
    `- Google Fonts：${t.google.join(" / ")}`, "",
    "## 布局", `- 栅格：${st.grid}`, "- 规则：", ...st.rules.map((r) => `  - ${r}`), ...(m.pure ? [] : [`  - ${ROLE_WORDS}`]),
    `- 圆角：${st.radius}；边框：${st.border}；阴影：${st.shadow}；密度：${st.density}`, "",
    "## 质感", texture(m),
    "强度是质感的浓淡（0–1），按观感理解：0.15 几乎看不见，0.3 能看出，0.5 明显，0.6 很重。质感层铺在页面底色上、正文下层，不进卡片，不压文字，也不盖在原作上。",
    ...(m.kind === "none" ? [] : [`实现：复制本技能 references/textures.css，页面里放 \`<div class="texture" data-texture="${m.kind}" aria-hidden="true"></div>\`，在 :root 设 \`--tex-level: ${m.level};\`。`]), "",
    "## 母题", m.motifs.join("、"), motifRule(m), "",
    ...(F.frames?.length ? ["界面框式（可以直接做成顶栏、卡片边框、图片框，不进生图提示词）：", ...F.frames.map((x) => `- ${x}`), ""] : []),
    ...originals(m),
    "## 动效", motion(st), "",
    "## 禁止", ...m.dont.map((d) => `- ${d}`), "- 渐变文字、默认玻璃卡片、通用圆角阴影卡片网格", "",
    "## 无障碍", ...a11y(m), "",
    "## 提示词", "", "### 写代码用", "```text", codePrompt(m), "```", "",
    "### 生图用", "```text", imagePrompt(m, subject), "```", "",
    "## 迭代记录",
    "",
    "| 日期 | 这一轮 | 偏离的规则 |",
    "|---|---|---|",
    `| ${new Date().toISOString().slice(0, 10)} | 生成：${m.pure ? `${S.name}原样` : `${S.name} × ${F.name}`} | 无 |`,
    "",
  ].join("\n");
}

export const resolve = (names) => mix(cast(names));

function fail(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
const args = process.argv.slice(2);
const json = args.includes("--json");
const si = args.indexOf("--subject");
const subject = si >= 0 ? args[si + 1] : "{主题：按场景写一个具体画面}";
const names = args.filter((a, i) => !a.startsWith("--") && (si < 0 || i !== si + 1));
if (!names.length) fail("用法：node scripts/mix.mjs <流派> [流派] [流派] [--subject \"生图主题\"] [--json]");
let m;
try {
  m = resolve(names);
} catch (error) {
  fail(error.message);
}
process.stdout.write(json ? `${JSON.stringify({ structure: m.S.id, surface: m.F.id, pure: m.pure, notes: m.notes, textureLevel: m.level, textureKind: m.kind, accents: m.accents, dont: m.dont, negative: m.negative, accessibility: a11y(m) }, null, 2)}\n` : designDoc(m, subject));
}

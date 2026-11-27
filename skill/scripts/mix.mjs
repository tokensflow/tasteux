#!/usr/bin/env node
// 按 references/mixing.md 把一到三个流派混成 DESIGN.md。逻辑移植自 tasteux.com 工作台（app.js 的 mix / designDoc / codePrompt / imagePrompt），两边改动要同步。
// 用法：node scripts/mix.mjs <流派> [流派] [流派] [--subject "生图主题"] [--json]
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../schools.json", import.meta.url), "utf8"));
const uniq = (list) => [...new Set(list)];
const clause = (text) => text.split(/[，。；：]/)[0];

// ---------- 颜色：OKLCH → 相对亮度 → WCAG 对比度 ----------
function luminance(color) {
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
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
function contrast(x, y) {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- 识别流派与定主副（mixing.md 第 2 条） ----------
const norm = (s) => s.toLowerCase().replace(/[\s_\-·]/g, "");
function find(name) {
  const hit = data.schools.find((s) => [s.id, s.name, s.en, ...s.aliases].some((a) => norm(a) === norm(name)));
  if (hit) return hit;
  const list = data.schools.map((s) => `${s.name}（${s.id}）`).join("、");
  fail(`没有这个流派：${name}。现有流派：${list}`);
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
function a11y(m) {
  const p = m.F.palette;
  return [
    `- 正文与背景对比度 ≥ 4.5:1（--ink / --bg ${contrast(p.ink, p.bg).toFixed(2)}:1，--muted / --bg ${contrast(p.muted, p.bg).toFixed(2)}:1）。`,
    `- --accent 上的文字用 --on-accent（${contrast(p.onAccent, p.accent).toFixed(2)}:1）。`,
    ...m.accents.slice(1).map((k) => `- ${onAccent(p, k)}。`),
    ...m.accents.map((k) => `- ${accentAsText(p, k)}。`),
    "- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。",
  ];
}

// ---------- 输出 ----------
const ROLE_WORDS = "规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。";
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
    `中文回退：${t.zh}；中文标题 700–900 字重，字距不用负值`,
    `Google Fonts：${t.google.join(" / ")}`, "",
    "【布局】", `栅格：${st.grid}`, ...st.rules.map((r) => `- ${r}`), ...(m.pure ? [] : [ROLE_WORDS]),
    `圆角 ${st.radius}；边框 ${st.border}；阴影 ${st.shadow}；密度 ${st.density}`, "",
    `【质感】${texture(m)}${m.kind === "none" ? "" : "，只铺在背景上，不盖住文字"}`,
    `【母题】${m.motifs.join("、")}。${motifRule(m)}`,
    `【动效】${motion(st)}`,
    `【禁止】${m.dont.join("、")}。不要使用渐变文字、默认玻璃卡片、通用圆角阴影卡片网格。`,
    "【无障碍】", ...a11y(m),
  ].join("\n");
}

function imagePrompt(m, subject) {
  const { S, F } = m;
  const composition = m.pure ? S.structure.composition : S.structure.composition.replace(/\bblack\b/g, "dark");
  const body = [subject, F.medium, composition, `palette of ${F.colorWords.join(", ")}`, `featuring ${m.motifsEn.join(", ")}`].join(", ");
  return `${body}\nNegative: ${m.negative.join(", ")}`;
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

function designDoc(m, subject) {
  const { S, F } = m;
  const st = S.structure;
  const t = st.type;
  return [
    `<!-- style-mix: ${S.id}+${F.id} · schools.json v${data.version} · 重新生成：node scripts/mix.mjs ${S.id} ${F.id} -->`,
    m.pure ? `# ${S.name} 原样` : `# ${S.name} × ${F.name}`, "",
    "## 展签",
    m.pure ? `${S.name} ${S.en} 原样` : `主 · ${S.name} ${S.en}，副 · ${F.name} ${F.en}`,
    ...m.notes, "", ...label(m),
    "## 主张", m.thesis, "",
    "## 色彩", "```css", ...rootVars(m), "```", `用法：${F.colorUsage}`, accentRule(m), "",
    "## 字体",
    `- 标题：font-family: ${fontStack(t.display.family, t.zh)}；字重 ${t.display.weight}；${t.display.transform === "uppercase" ? "全大写；" : ""}字距 ${t.display.tracking}`,
    `- 正文：font-family: ${fontStack(t.body.family, t.zh)}；字重 ${t.body.weight}`,
    "- 中文标题：拉丁标题字体没有中文字形，中文会落到回退字体，所以中文标题单独指定 700–900 字重，和拉丁标题的分量一致；字距不要用负值",
    `- Google Fonts：${t.google.join(" / ")}`, "",
    "## 布局", `- 栅格：${st.grid}`, "- 规则：", ...st.rules.map((r) => `  - ${r}`), ...(m.pure ? [] : [`  - ${ROLE_WORDS}`]),
    `- 圆角：${st.radius}；边框：${st.border}；阴影：${st.shadow}；密度：${st.density}`, "",
    "## 质感", texture(m),
    "强度是质感的浓淡（0–1），按观感理解：0.15 几乎看不见，0.3 能看出，0.5 明显，0.6 很重。质感层铺在页面底色上、正文下层，不进卡片，不压文字。", "",
    "## 母题", m.motifs.join("、"), motifRule(m), "",
    "## 动效", motion(st), "",
    "## 禁止", ...m.dont.map((d) => `- ${d}`), "- 渐变文字、默认玻璃卡片、通用圆角阴影卡片网格", "",
    "## 无障碍", ...a11y(m), "",
    "## 提示词", "", "### 写代码用", "```text", codePrompt(m), "```", "",
    "### 生图用", "```text", imagePrompt(m, subject), "```", "",
  ].join("\n");
}

function fail(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const json = args.includes("--json");
const si = args.indexOf("--subject");
const subject = si >= 0 ? args[si + 1] : "{主题：按场景写一个具体画面}";
const names = args.filter((a, i) => !a.startsWith("--") && (si < 0 || i !== si + 1));
if (!names.length) fail("用法：node scripts/mix.mjs <流派> [流派] [流派] [--subject \"生图主题\"] [--json]");
const m = mix(cast(names));
process.stdout.write(json ? `${JSON.stringify({ structure: m.S.id, surface: m.F.id, pure: m.pure, notes: m.notes, textureLevel: m.level, textureKind: m.kind, accents: m.accents, dont: m.dont, negative: m.negative, accessibility: a11y(m) }, null, 2)}\n` : designDoc(m, subject));

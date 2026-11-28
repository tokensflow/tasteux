import { plateMarkup, structurePickerMarkup, surfacePickerMarkup, groupPickerMarkup } from "./catalog.mjs";
import { imageUrls, setImageSource, clearImageSource, fallbackImage } from "./images.mjs";
import { createFontLoader, fontsHref } from "./fonts.mjs";
import { heroMarkup, enhanceHero } from "./hero.mjs";
import { contrast, readableOn, paletteVars } from "./palette.mjs";
import { INSTALL_TARGETS as TARGETS, installCommand, targetButtonsMarkup, skillVersionsMarkup } from "./install.mjs";

const DATA_URL = "../skill/schools.json";
const DEFAULT_MIX = ["constructivism", "ukiyo-e"];
const DEFAULT_SUBJECT = "a poster for an independent bookstore called Paper Pages";
const PV_WIDTH = 900;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const uniq = (list) => [...new Set(list)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const behavior = reduceMotion ? "auto" : "smooth";

let schools = [];
let structures = [];
let byId = {};
let groups = {};
let stagePv = null;
let prevPv = null;
let fromLink = false;
let last = null;
let compareOn = false;
const state = { s: DEFAULT_MIX[0], f: DEFAULT_MIX[1], target: TARGETS[0].id };

// ---------- 混合规则（与 skill/references/mixing.md 一致） ----------
const clause = (text) => text.split(/[，。；：]/)[0];
const stem = (w) => w.replace(/(ists|ism|ist|ic|al|s|y)$/, "");
const words = (text) => text.toLowerCase().split(/[^a-z]+/).filter(Boolean).map(stem);

function conflicts(term, imagery) {
  const w = words(term);
  return w.every((x) => imagery.has(x)) || imagery.has(stem(term.toLowerCase().replace(/[^a-z]/g, "")));
}

function imageryWords(F) {
  const list = words(`${F.medium} ${F.motifsEn.join(" ")}`);
  const raw = `${F.medium} ${F.motifsEn.join(" ")}`.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const joined = raw.slice(1).map((x, i) => stem(raw[i] + x));
  return new Set([...list, ...joined]);
}
const isStructure = (s) => s.roles.includes("structure");

function mix(S, F) {
  const st = S.structure;
  const level = Math.min(F.texture.level, st.textureCap);
  const imagery = imageryWords(F);
  return {
    S,
    F,
    pure: S.id === F.id,
    level,
    capped: F.texture.level > st.textureCap,
    kind: level > 0 ? F.texture.kind : "none",
    accents: ["accent", "accent2", "accent3"].slice(0, st.accentSlots),
    dont: uniq([...st.dont, ...F.dont]),
    negative: uniq([...st.negative, ...F.negative]).filter((n) => !conflicts(n, imagery)),
    thesis:
      S.id === F.id
        ? `${S.name}的纯粹形态：${S.essence}`
        : `${S.name}搭骨架：${clause(st.grid)}；${F.name}上颜色：${clause(F.colorUsage)}。`,
  };
}

const fontStack = (family, zh) => `"${family}", ${zh}`;

// ---------- 把一个画派组合画到 .pv 元素上 ----------
function paint(el, S, F) {
  const m = mix(S, F);
  const t = S.structure.type;
  for (const [k, v] of Object.entries(paletteVars(F.palette, S.structure.accentSlots))) el.style.setProperty(k, v);
  el.style.setProperty("--font-display", fontStack(t.display.family, t.zh));
  el.style.setProperty("--font-body", fontStack(t.body.family, t.zh));
  el.style.setProperty("--display-weight", t.display.weight);
  el.style.setProperty("--display-transform", t.display.transform);
  el.style.setProperty("--display-tracking", t.display.tracking);
  el.style.setProperty("--tex-level", m.level);
  el.dataset.structure = S.id;
  el.dataset.texture = m.kind;
  const img = el.querySelector(".pv-img img");
  if (F.img === false) {
    if (img) clearImageSource(img);
    delete el.dataset.img;
    return m;
  }
  if (img) {
    const changed = img.dataset.school !== F.id;
    if (changed) delete el.dataset.img;
    const sizes = updateImageSizes(img);
    if (changed) setImageSource(img, F.id, sizes);
  }
  return m;
}

function makePv() {
  const pv = $("pv-tpl").content.firstElementChild.cloneNode(true);
  const img = pv.querySelector(".pv-img img");
  img.addEventListener("error", () => {
    if (!fallbackImage(img)) pv.dataset.img = "none";
  });
  return pv;
}

function updateImageSizes(img) {
  const sizes = `${Math.ceil(img.getBoundingClientRect().width) || 100}px`;
  img.sizes = sizes;
  const source = img.parentElement.querySelector("source");
  if (source) source.sizes = sizes;
  return sizes;
}

const sizer = new ResizeObserver((entries) => {
  for (const e of entries) {
    e.target.style.setProperty("--s", e.contentRect.width / PV_WIDTH);
    const img = e.target.querySelector(".pv-img img");
    if (img?.dataset.school) updateImageSizes(img);
  }
});

function scaled(box, S, F) {
  const pv = makePv();
  pv.setAttribute("aria-hidden", "true");
  paint(pv, S, F);
  if (box.clientWidth) box.style.setProperty("--s", box.clientWidth / PV_WIDTH);
  box.append(pv);
  const img = pv.querySelector(".pv-img img");
  if (img.dataset.school) updateImageSizes(img);
  sizer.observe(box);
  return pv;
}

function thumb(S, F) {
  const box = document.createElement("div");
  box.className = "thumb";
  scaled(box, S, F);
  return box;
}

// ---------- 提示词 ----------
const ROLE_WORDS = "规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。";

function rootVars(m) {
  const p = m.F.palette;
  const vars = [
    ["--bg", p.bg],
    ["--surface", p.surface],
    ["--ink", p.ink],
    ["--muted", p.muted],
    ["--line", p.line],
    ["--accent", p.accent],
    ["--on-accent", p.onAccent],
    ...m.accents.slice(1).map((k) => [`--${k}`, p[k]]),
  ];
  return [":root {", ...vars.map(([k, v]) => `  ${k}: ${v};`), "}"];
}

const accentRule = (m) =>
  m.accents.length < 3 && !m.pure
    ? `只使用 ${m.accents.length} 个强调色（${m.S.name}的规矩）。上面的用法如果提到更多颜色，以这一条为准。`
    : `只使用 ${m.accents.length} 个强调色。`;

// ---------- 每个强调色上能放什么（与 skill/scripts/mix.mjs 一致） ----------
const LARGE = "24px 以上或 18.7px 以上粗体的大字";
function onAccentRule(p, k) {
  const [name, c] = [["--ink", contrast(p.ink, p[k])], ["--on-accent", contrast(p.onAccent, p[k])]].sort((x, y) => y[1] - x[1])[0];
  const r = c.toFixed(2);
  if (c >= 4.5) return `--${k} 上的文字用 ${name}（${r}:1）`;
  if (c >= 3) return `--${k} 上只放 ${LARGE}或图标，用 ${name}（${r}:1）；正文和小字不放在 --${k} 上`;
  return `--${k} 只做色块和插图，不放文字（最高 ${r}:1）`;
}
function accentTextRule(p, k) {
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
    ...m.accents.slice(1).map((k) => `- ${onAccentRule(p, k)}。`),
    ...m.accents.map((k) => `- ${accentTextRule(p, k)}。`),
    "- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。",
  ];
}

function codePrompt(m) {
  const { S, F } = m;
  const st = S.structure;
  const t = st.type;
  return [
    m.pure
      ? `请按下面的设计系统实现页面：${S.name}（${S.en}）。`
      : `请按下面的设计系统实现页面：${S.name}（${S.en}）的结构 × ${F.name}（${F.en}）的色彩与质感。`,
    m.thesis,
    "",
    "【CSS 变量】",
    ...rootVars(m),
    `用色：${F.colorUsage}`,
    accentRule(m),
    "",
    "【字体】",
    `标题：${t.display.family} ${t.display.weight}${t.display.transform === "uppercase" ? "，全大写" : ""}，字距 ${t.display.tracking}`,
    `正文：${t.body.family} ${t.body.weight}`,
    `中文回退：${t.zh}`,
    `Google Fonts：${t.google.join(" / ")}`,
    "",
    "【布局】",
    `栅格：${st.grid}`,
    ...st.rules.map((r) => `- ${r}`),
    ...(m.pure ? [] : [ROLE_WORDS]),
    `圆角 ${st.radius}；边框 ${st.border}；阴影 ${st.shadow}；密度 ${st.density}`,
    "",
    `【质感】${m.kind === "none" ? "无，纯平面" : `${F.texture.desc}，强度 ${m.level.toFixed(2)}（0–1），只铺在背景上，不盖住文字`}`,
    `【母题】${F.motifs.join("、")}。首先用在主视觉和插图里；${m.pure ? "" : "和骨架规则不冲突时，"}也可以做成界面上的单个图形，但不要铺成重复的底纹，不改变上面的布局规则。`,
    `【动效】${st.motion.desc}，${st.motion.duration} ${st.motion.easing}。按下时也要有反馈；用键盘快捷键触发的状态切换不加过渡，遵守 prefers-reduced-motion。`,
    `【禁止】${m.dont.join("、")}。不要使用渐变文字、默认玻璃卡片、通用圆角阴影卡片网格。`,
    "【无障碍】",
    ...a11y(m),
  ].join("\n");
}

function imagePrompt(m) {
  const subject = $("subject").value.trim() || DEFAULT_SUBJECT;
  const { S, F } = m;
  const composition = m.pure ? S.structure.composition : S.structure.composition.replace(/\bblack\b/g, "dark");
  const body = [subject, F.medium, composition, `palette of ${F.colorWords.join(", ")}`, `featuring ${F.motifsEn.join(", ")}`].join(", ");
  return `${body}\n\nNegative: ${m.negative.join(", ")}`;
}

// ---------- 图鉴 ----------
const ZH_DIGITS = "零一二三四五六七八九";
const zhNum = (n) => (n < 10 ? ZH_DIGITS[n] : n < 20 ? `十${n % 10 ? ZH_DIGITS[n % 10] : ""}` : `${ZH_DIGITS[Math.floor(n / 10)]}十${n % 10 ? ZH_DIGITS[n % 10] : ""}`);

function renderPlates() {
  const sBox = $("plates-structure");
  const fBox = $("plates-surface");
  const previews = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const s = byId[entry.target.dataset.school];
      loadFonts(s);
      entry.target.querySelector(".slot")?.replaceWith(thumb(s, s));
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "240px 0px" });
  schools.forEach((s, i) => {
    let el = $(`plate-${s.id}`);
    if (!el) {
      const box = isStructure(s) ? sBox : fBox;
      box.insertAdjacentHTML("beforeend", plateMarkup(s, i));
      el = $(`plate-${s.id}`);
    }
    if (isStructure(s)) {
      previews.observe(el);
    } else {
      const study = el.querySelector(".pv-study");
      for (const [k, v] of Object.entries(paletteVars(s.palette, 3))) study.style.setProperty(k, v);
      study.style.setProperty("--tex-level", s.texture.level);
      study.dataset.texture = s.texture.kind;
      const img = study.querySelector(".study-img img");
      if (!img) return;
      const mark = () => (study.dataset.img = img.naturalWidth ? "ok" : "none");
      img.addEventListener("load", mark);
      img.addEventListener("error", () => {
        if (!fallbackImage(img, `img/${s.id}.jpg`)) mark();
      });
      if (img.complete) mark();
    }
  });
  const nS = structures.length;
  $("plates-title").textContent = `图鉴：${schools.length} 个画派`;
  $("structure-title").textContent = `能当骨架的${zhNum(nS)}个`;
  $("surface-title").textContent = `只做表皮的${zhNum(schools.length - nS)}个`;
}

// ---------- 工作台：选骨架、选表皮 ----------
function renderPickers() {
  const sBox = $("pick-structure");
  if (!sBox.children.length) sBox.innerHTML = structurePickerMarkup(schools);
  for (const s of structures) {
    const b = sBox.querySelector(`[data-id="${s.id}"]`);
    b.addEventListener("pointerenter", () => loadFonts(s));
    b.addEventListener("focus", () => loadFonts(s));
  }
  $("structure-count").textContent = `${structures.length} 副`;
  $("surface-count").textContent = `${schools.length} 种`;

  if (!$("skin-groups").children.length) $("skin-groups").innerHTML = groupPickerMarkup(schools, groups);
  if (!$("pick-surface").children.length) $("pick-surface").innerHTML = surfacePickerMarkup(schools, groups);
  $("pick-surface").querySelectorAll(".skin img").forEach((img) => img.addEventListener("error", () => {
    if (!fallbackImage(img, `img/${img.closest(".skin").dataset.id}.jpg`)) img.closest(".skin").dataset.img = "none";
  }));
  $("pick-surface").addEventListener("scroll", markGroup, { passive: true });

  stagePv = scaled($("stage"), byId[state.s], byId[state.f]);
  const stageImage = stagePv.querySelector(".pv-img img");
  stageImage.loading = "eager";
  stageImage.fetchPriority = "high";
  stagePv.removeAttribute("aria-hidden");
  stagePv.setAttribute("role", "img");
}

const stripLeft = (strip, el) => el.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;

function scrollGroup(g) {
  const strip = $("pick-surface");
  const first = strip.querySelector(`.skin-group[data-group="${g}"] .skin`);
  if (first) strip.scrollTo({ left: stripLeft(strip, first) - parseFloat(getComputedStyle(strip).paddingLeft), behavior });
}

function markGroup() {
  const strip = $("pick-surface");
  let current = null;
  for (const box of strip.querySelectorAll(".skin-group")) {
    if (stripLeft(strip, box) - strip.scrollLeft <= 40) current = box.dataset.group;
  }
  document.querySelectorAll(".grp").forEach((b) => {
    const on = b.dataset.group === current;
    b.classList.toggle("is-on", on);
    if (on) b.setAttribute("aria-current", "true");
    else b.removeAttribute("aria-current");
  });
}

function reveal1(strip, el, how) {
  if (strip.scrollWidth <= strip.clientWidth) return;
  const x = stripLeft(strip, el);
  const pad = 24;
  if (x - pad < strip.scrollLeft) strip.scrollTo({ left: x - pad, behavior: how });
  else if (x + el.offsetWidth + pad > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: x + el.offsetWidth + pad - strip.clientWidth, behavior: how });
}

function renderTargets() {
  $("targets").innerHTML = targetButtonsMarkup(state.target);
  const t = TARGETS.find((x) => x.id === state.target);
  $("target-path").textContent = t.dir;
  $("install-out").textContent = installCommand(t, location.href);
  $("skill-invocation").textContent = t.invocation;
  $("skill-activation").textContent = t.activation;
  $("selected-skill-download").href = t.archive;
  $("selected-skill-download").download = t.archive.split("/").pop();
  if (!$("skill-versions").children.length) $("skill-versions").innerHTML = skillVersionsMarkup();
}

function renderLabel(m) {
  const { S, F } = m;
  const p = F.palette;
  const body = contrast(p.ink, p.bg);
  const button = contrast(p.onAccent, p.accent);
  const ok = body >= 4.5 && button >= 4.5;
  const t = S.structure.type;
  const texture = m.kind === "none" ? "无，纯平面" : `${F.texture.desc} · ${m.level.toFixed(2)}${m.capped ? `（${S.name}上限 ${S.structure.textureCap}）` : ""}`;
  const open = $("label").querySelector("details")?.open ?? false;
  $("label").innerHTML = `<details${open ? " open" : ""}>
    <summary>
      <h4>${m.pure ? esc(S.name) : `${esc(S.name)} × ${esc(F.name)}`} <span class="en" lang="en">${m.pure ? esc(S.en) : `${esc(S.en)} × ${esc(F.en)}`}</span></h4>
      <span class="more">组合详情</span>
    </summary>
    <div class="label-body">
    <dl>
      <dt>字体</dt><dd>${esc(t.display.family)} / ${esc(t.body.family)}</dd>
      <dt>质感</dt><dd>${esc(texture)}</dd>
      <dt>对比度</dt><dd class="${ok ? "" : "warn"}">正文 ${body.toFixed(1)}:1 · 按钮 ${button.toFixed(1)}:1 · ${ok ? "符合 AA" : "低于 AA"}</dd>
    </dl>
    </div>
  </details>`;
}

// ---------- 两栏展签 ----------
function textureDuty({ S, F, kind, capped }) {
  if (kind !== "none") return [`质感：${F.texture.desc}`, capped ? `（被${S.name}调淡）` : ""];
  return [F.texture.kind !== "none" ? `质感：被${S.name}压平，纯平面` : "质感：纯平面"];
}

function colorDuty({ S, F, pure, accents }) {
  if (pure || accents.length >= 3) return [`配色：${clause(F.colorUsage)}`];
  const used = accents.length === 1 ? "只用一个主色" : "只用主色和一个辅色";
  return [`配色：${F.name}的调色板，${used}`, `（${S.name}的规矩）`];
}

const visualDuty = (F) => [`主视觉：${F.motifs.slice(0, 2).join("、")}`];

function duoCol(s, role, title, items) {
  const item = ([text, note]) => `<li>${esc(text)}${note ? `<span class="duo-cap">${esc(note)}</span>` : ""}</li>`;
  return `<div class="duo-col">
    <p class="duo-meta">${role ? `<b>${role}</b> · ` : ""}${esc(s.era)}</p>
    <h4>${title}</h4>
    <p class="duo-intro">${esc(s.intro)}</p>
    <div class="duo-does"><span>这次负责</span><ul>${items.map(item).join("")}</ul></div>
  </div>`;
}

function duties(m) {
  const { S, F } = m;
  const st = S.structure;
  const tex = textureDuty(m);
  if (m.pure)
    return [
      {
        s: S,
        role: "",
        items: [[`排版和字体：${clause(st.grid)}，标题用 ${st.type.display.family}`], [`配色和质感：${clause(F.colorUsage)}；${tex[0].replace(/^质感：/, "")}`], visualDuty(F)],
      },
    ];
  return [
    { s: S, role: "骨架", items: [[`排版：${clause(st.grid)}`], [`标题字体：${st.type.display.family}`]] },
    { s: F, role: "表皮", items: [colorDuty(m), tex, visualDuty(F)] },
  ];
}

function renderDuo(m) {
  const named = (s) => `${esc(s.name)} <span class="en" lang="en">${esc(s.en)}</span>`;
  const heading = m.pure ? "认识这个流派" : "认识这两个流派";
  $("duo-title").textContent = heading;
  document.querySelector(".to-duo").textContent = `${heading} ↓`;
  $("duo-cols").classList.toggle("is-pure", m.pure);
  $("duo-cols").innerHTML = duties(m)
    .map(({ s, role, items }) => duoCol(s, role, m.pure ? `${named(s)} 原样<span class="duo-sub"> · 骨架和表皮都是它</span>` : named(s), items))
    .join("");
  $("duo").hidden = false;
}

// ---------- 这次变了什么 ----------
const nameOf = (id) => byId[id].name;
const combo = ({ s, f }) => (s === f ? `${nameOf(s)}原样` : `${nameOf(s)} × ${nameOf(f)}`);

const fontsOf = (s) => `${s.structure.type.display.family}/${s.structure.type.body.family}`;

function textureDelta(a, b) {
  if (a.kind === b.kind && a.level === b.level) return null;
  if (b.kind === "none") return a.kind === "none" ? null : `质感被${nameOf(b.S.id)}的上限压平了`;
  if (a.kind === "none") return `质感出现了（${b.F.texture.desc}）`;
  if (a.kind === b.kind) return `质感强度从 ${a.level.toFixed(2)} 变成 ${b.level.toFixed(2)}`;
  return "质感换了";
}

function noteText() {
  if (!last) return `${fromLink ? "链接里的组合" : "默认组合"}：${combo(state)}。先换一副骨架试试，看排版怎么变。`;
  const { from, to, kind } = last;
  const a = mix(byId[from.s], byId[from.f]);
  const b = mix(byId[to.s], byId[to.f]);
  const tex = textureDelta(a, b);
  if (from.s !== to.s && from.f === to.f) {
    const changed = ["排版", ...(fontsOf(a.S) !== fontsOf(b.S) ? ["字体"] : [])].join("和");
    const na = a.accents.length;
    const nb = b.accents.length;
    const palette = na === nb ? "配色没变" : `调色板还是${nameOf(to.f)}的，但强调色从 ${na} 个变成 ${nb} 个`;
    const kept = tex ? `${palette}，${tex}` : na === nb ? "配色和质感没变" : `${palette}，质感没变`;
    return `换了骨架（${nameOf(from.s)} → ${nameOf(to.s)}）：${changed}变了，动效规则写进了提示词；${kept}。`;
  }
  if (from.f !== to.f && from.s === to.s) {
    const changed = ["配色", "主视觉", ...(tex ? ["质感"] : [])].join("、");
    return `换了表皮（${nameOf(from.f)} → ${nameOf(to.f)}）：${changed}变了；排版和字体没变${tex ? "" : "，质感也没变"}。`;
  }
  const how = kind === "swap" ? "骨架和表皮互换了" : kind === "shuffle" ? "随机换了一组" : "骨架和表皮都换了";
  return `${how}（${combo(from)} → ${combo(to)}）：两层都变了，排版、字体、配色和主视觉都不一样了。`;
}

function layerCap(label, { s, f }, other) {
  const part = (role, id, otherId) => {
    const changed = id !== otherId;
    return `${role} <b class="${changed ? "chg" : ""}">${esc(nameOf(id))}</b>${changed ? "" : "（没变）"}`;
  };
  return `<span class="cap-k">${label}</span>${part("骨架", s, other.s)} · ${part("表皮", f, other.f)}`;
}

function renderCompare() {
  const on = compareOn && last;
  $("stage-view").classList.toggle("is-compare", Boolean(on));
  $("prev-fig").hidden = !on;
  $("now-cap").hidden = !on;
  $("compare-toggle").setAttribute("aria-pressed", String(Boolean(on)));
  $("compare-toggle").textContent = on ? "关闭对比" : "对比本次改动";
  if (!on) return;
  if (!prevPv) prevPv = scaled($("stage-prev"), byId[last.from.s], byId[last.from.f]);
  else paint(prevPv, byId[last.from.s], byId[last.from.f]);
  $("prev-cap").innerHTML = layerCap("上一次", last.from, last.to);
  $("now-cap").innerHTML = layerCap("现在", last.to, last.from);
}

function apply() {
  const S = byId[state.s];
  const F = byId[state.f];
  loadFonts(S);
  const m = paint(stagePv, S, F);
  stagePv.setAttribute("aria-label", `示例书店首页：${m.pure ? S.name : `${S.name}骨架，${F.name}表皮`}`);
  renderLabel(m);
  renderDuo(m);
  $("code-title").textContent = m.pure ? S.name : `${S.name} × ${F.name}`;
  $("code-out").textContent = codePrompt(m);
  $("image-out").textContent = imagePrompt(m);

  document.querySelectorAll("[data-role][aria-pressed]").forEach((el) => {
    const on = el.dataset.id === (el.dataset.role === "s" ? state.s : state.f);
    el.setAttribute("aria-pressed", String(on));
    if (on) reveal1(el.closest(".skels, .skins"), el, last ? behavior : "auto");
  });

  $("note").textContent = noteText();
  $("compare-toggle").hidden = !last;
  renderCompare();

  const canSwap = isStructure(F) && !m.pure;
  $("swap").disabled = !canSwap;
  $("swap-hint").textContent = m.pure ? `骨架和表皮相同：这是${S.name}的纯粹形态。` : isStructure(F) ? "" : `${F.name}只做表皮，没有自己的版面结构，所以不能互换。`;

  // 只在访客换过组合、或本来就带着 #mix= 打开时写网址；直接打开首页时网址保持干净。
  if (last || location.hash.startsWith("#mix=")) history.replaceState(null, "", `#mix=${S.id}+${F.id}`);
}

function commit(next, kind) {
  const from = { s: state.s, f: state.f };
  if (next.s === from.s && next.f === from.f) return;
  state.s = next.s;
  state.f = next.f;
  last = { from, to: { s: next.s, f: next.f }, kind };
  apply();
}

function readHash() {
  const match = location.hash.match(/^#mix=([\w-]+)\+([\w-]+)$/);
  if (!match) return null;
  const [, s, f] = match;
  return { s: byId[s] && isStructure(byId[s]) ? s : state.s, f: byId[f] ? f : state.f };
}

function pick(role, id) {
  if (role === "s" && byId[id] && isStructure(byId[id])) commit({ s: id, f: state.f });
  if (role === "f" && byId[id]) commit({ s: state.s, f: id });
}

// ---------- 提示词标签页 ----------
function selectTab(tab, focus) {
  document.querySelectorAll('[role="tab"]').forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute("aria-controls")).hidden = !on;
  });
  $("copy-prompt").dataset.copy = tab.id === "tab-image" ? "image-out" : "code-out";
  if (focus) tab.focus();
}

const requestFonts = createFontLoader(document);

function loadFonts(school = byId[state.s]) {
  requestFonts(school.structure.type.google);
}

async function copy(button) {
  const text = $(button.dataset.copy).textContent;
  let ok = true;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(area);
    area.select();
    ok = document.execCommand("copy");
    area.remove();
  }
  button.dataset.label ??= button.textContent;
  button.textContent = ok ? "已复制" : "复制失败，请手动选择";
  clearTimeout(button._timer);
  button._timer = setTimeout(() => (button.textContent = button.dataset.label), 1600);
}

// ---------- 带走成品：DESIGN.md ----------
function designDoc(m) {
  const { S, F } = m;
  const st = S.structure;
  const t = st.type;
  const label = duties(m).flatMap(({ s, role, items }) => [
    `**${s.name} ${s.en}**${role ? ` · ${role}` : ""} · ${s.era}`,
    "",
    s.intro,
    "",
    "这次负责：",
    ...items.map(([text, note = ""]) => `- ${text}${note}`),
    "",
  ]);
  return [
    m.pure ? `# ${S.name} 原样` : `# ${S.name} × ${F.name}`,
    "",
    "## 展签",
    m.pure ? `${S.name} ${S.en} 原样` : `主 · ${S.name} ${S.en}，副 · ${F.name} ${F.en}`,
    "",
    ...label,
    "## 主张",
    m.thesis,
    "",
    "## 色彩",
    "```css",
    ...rootVars(m),
    "```",
    `用法：${F.colorUsage}`,
    accentRule(m),
    "",
    "## 字体",
    `- 标题：font-family: ${fontStack(t.display.family, t.zh)}；字重 ${t.display.weight}；${t.display.transform === "uppercase" ? "全大写；" : ""}字距 ${t.display.tracking}`,
    `- 正文：font-family: ${fontStack(t.body.family, t.zh)}；字重 ${t.body.weight}`,
    "- 中文标题：拉丁标题字体没有中文字形，中文会落到回退字体，所以中文标题单独指定 700–900 字重，和拉丁标题的分量一致；字距不要用负值",
    `- Google Fonts：${t.google.join(" / ")}`,
    "",
    "## 布局",
    `- 栅格：${st.grid}`,
    "- 规则：",
    ...st.rules.map((r) => `  - ${r}`),
    ...(m.pure ? [] : [`  - ${ROLE_WORDS}`]),
    `- 圆角：${st.radius}；边框：${st.border}；阴影：${st.shadow}；密度：${st.density}`,
    "",
    "## 质感",
    `${F.texture.desc}，强度 ${m.level}`,
    "强度是质感的浓淡（0–1），按观感理解：0.15 几乎看不见，0.3 能看出，0.5 明显，0.6 很重。不同质感换算成 CSS 不透明度时系数可以不同，以观感为准。质感层铺在页面底色上、正文下层，不进卡片，不压文字。强度上限由主流派的 textureCap 决定，比如极简主义最多 0.15，几乎看不见。",
    "",
    "## 母题",
    F.motifs.join("、"),
    "母题首先用在主视觉和插图里。纯粹形态或没有冲突时，母题也可以做成界面上的单个图形（比如包豪斯的圆、方、三角），但不要铺成重复的底纹。有冲突时按 mixing.md 第 4 条只放进插图。",
    "",
    "## 动效",
    `${st.motion.desc}，${st.motion.duration} ${st.motion.easing}。按下时也要有反馈。用键盘快捷键触发的状态切换不加过渡，遵守 prefers-reduced-motion。`,
    "",
    "## 禁止",
    ...m.dont.map((d) => `- ${d}`),
    "",
    "## 无障碍",
    ...a11y(m),
    "",
    "## 提示词",
    "",
    "### 写代码用",
    "```text",
    codePrompt(m),
    "```",
    "",
    "### 生图用",
    "```text",
    imagePrompt(m),
    "```",
    "",
  ].join("\n");
}

// ---------- 带走成品：书店示例页 ----------
function splitSelectors(text) {
  const out = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out;
}

const onlyFor = (sel, attr, value) => [...sel.matchAll(new RegExp(`data-${attr}="([^"]*)"`, "g"))].every(([, v]) => v === value);

function pickRules(rules, sid, kind) {
  const out = [];
  for (const r of rules) {
    if (r instanceof CSSStyleRule) {
      const all = splitSelectors(r.selectorText);
      const kept = all.filter((sel) => onlyFor(sel, "structure", sid) && onlyFor(sel, "texture", kind));
      if (kept.length === all.length) out.push(r.cssText);
      else if (kept.length) out.push(`${kept.join(", ")} { ${r.style.cssText} }`);
    } else if (r instanceof CSSConditionRule) {
      const inner = pickRules(r.cssRules, sid, kind);
      if (inner.length) out.push(`${r.cssText.slice(0, r.cssText.indexOf("{")).trim()} {\n${inner.map((x) => `  ${x}`).join("\n")}\n}`);
    } else out.push(r.cssText);
  }
  return out;
}

function dataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function sampleHtml(m) {
  const { S, F } = m;
  const sheet = [...document.styleSheets].find((x) => x.href?.endsWith("preview.css"));
  if (!sheet) throw new Error("没有读到 preview.css");
  const pv = $("pv-tpl").content.firstElementChild.cloneNode(true);
  paint(pv, S, F);
  pv.removeAttribute("aria-hidden");
  const swap = (el, tag, attrs = {}) => {
    const next = Object.assign(document.createElement(tag), attrs);
    for (const a of el.attributes) next.setAttribute(a.name, a.value);
    next.append(...el.childNodes);
    el.replaceWith(next);
    return next;
  };
  swap(pv.querySelector(".pv-page"), "main");
  swap(pv.querySelector(".pv-title"), "h1");
  pv.querySelectorAll(".pv-h").forEach((el) => swap(el, "h2"));
  swap(pv.querySelector(".pv-cta"), "a", { href: "#" });
  pv.querySelectorAll(".pv-links > span").forEach((el) => swap(el, "a", { href: "#" }));
  const img = pv.querySelector(".pv-img img");
  img.removeAttribute("loading");
  img.alt = `${F.name}风格的主视觉`;
  pv.querySelector(".pv-img").removeAttribute("aria-hidden");
  const res = await fetch(imageUrls(F.id).original).catch(() => null);
  if (!res?.ok) throw new Error(`主视觉图片 img/${F.id}.jpg 没有下载下来`);
  img.parentElement.querySelector("source")?.remove();
  img.removeAttribute("srcset");
  img.removeAttribute("sizes");
  delete img.dataset.school;
  img.src = await dataUri(await res.blob());
  const css = [
    ...pickRules(sheet.cssRules, S.id, m.kind),
    "*, *::before, *::after { box-sizing: border-box; }",
    ":where(.pv) a { color: inherit; text-decoration: none; }",
    ":where(.pv) h1 { margin: 0; }",
    `html { background: ${F.palette.bg}; }`,
    "html, body { margin: 0; }",
    "body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }",
    ".pv, .pv > .pv-page { min-height: 100vh; }",
    ".pv-page { max-width: 1440px; margin-inline: auto; }",
  ];
  const name = m.pure ? `${S.name} 原样` : `${S.name} × ${F.name}`;
  return `<!doctype html>
<!-- 流派混合 Style Mix 导出：骨架 ${S.name}，表皮 ${F.name}。https://tasteux.com/#mix=${S.id}+${F.id} -->
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Paper Pages · ${esc(name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fontsHref(S.structure.type.google))}">
<style>
${css.join("\n")}
</style>
</head>
<body>
${pv.outerHTML}
</body>
</html>
`;
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportFile(button, kind) {
  if (button.getAttribute("aria-busy") === "true") return;
  const m = mix(byId[state.s], byId[state.f]);
  const label = button.textContent;
  $("export-msg").textContent = "";
  try {
    if (kind === "md") return download(`DESIGN-${state.s}-${state.f}.md`, designDoc(m), "text/markdown;charset=utf-8");
    button.setAttribute("aria-busy", "true");
    button.textContent = "正在打包…";
    download(`paper-pages-${state.s}-${state.f}.html`, await sampleHtml(m), "text/html;charset=utf-8");
  } catch (err) {
    $("export-msg").textContent = `没能生成文件：${err?.message || err}。请刷新页面再试。`;
  } finally {
    button.removeAttribute("aria-busy");
    button.textContent = label;
  }
}

function reveal() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

function bind() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.dataset.copy) return copy(el);
    if (el.dataset.group) return scrollGroup(el.dataset.group);
    if (el.dataset.target) {
      state.target = el.dataset.target;
      return renderTargets();
    }
    if (el.dataset.role) {
      pick(el.dataset.role, el.dataset.id);
      if (!el.closest(".plate")) return;
      $("workbench").scrollIntoView({ behavior, block: "start" });
      document.querySelector(`.bench [data-role="${el.dataset.role}"][data-id="${el.dataset.id}"]`)?.focus({ preventScroll: true });
    }
  });
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  tabs.forEach((t) => t.addEventListener("click", () => selectTab(t)));
  document.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectTab(tabs[(next + tabs.length) % tabs.length], true);
  });
  $("compare-toggle").addEventListener("click", () => {
    compareOn = !compareOn;
    renderCompare();
  });
  $("swap").addEventListener("click", () => {
    if (!isStructure(byId[state.f])) return;
    commit({ s: state.f, f: state.s }, "swap");
  });
  $("shuffle").addEventListener("click", () => {
    const s = structures[Math.floor(Math.random() * structures.length)];
    const others = schools.filter((x) => x.id !== s.id && !(x.id === state.f && s.id === state.s));
    commit({ s: s.id, f: others[Math.floor(Math.random() * others.length)].id }, "shuffle");
  });
  $("export-html").addEventListener("click", (e) => exportFile(e.currentTarget, "html"));
  $("export-md").addEventListener("click", (e) => exportFile(e.currentTarget, "md"));
  $("subject").addEventListener("input", () => ($("image-out").textContent = imagePrompt(mix(byId[state.s], byId[state.f]))));
  window.addEventListener("hashchange", () => {
    const next = readHash();
    if (next) commit(next);
  });
}

async function main() {
  try {
    const data = await (await fetch(DATA_URL)).json();
    schools = data.schools;
    groups = data.groups;
  } catch {
    $("label").innerHTML = `<div><h4>暂时没有读到流派数据</h4><p class="thesis">请刷新重试，或先阅读下方图鉴和教程。本地预览请先运行 node scripts/build-site.mjs，再运行 python3 scripts/preview.py；直接双击 HTML 不能读取流派数据。</p></div>`;
    return;
  }
  structures = schools.filter(isStructure);
  byId = Object.fromEntries(schools.map((s) => [s.id, s]));
  $("colophon-count").textContent = `${schools.length} 个画派 · 调色板均通过 WCAG AA 对比度校验`;
  const initial = readHash();
  if (initial) {
    fromLink = initial.s !== state.s || initial.f !== state.f;
    Object.assign(state, initial);
  }
  loadFonts();
  renderPlates();
  renderPickers();
  renderTargets();
  bind();
  apply();
  const hero = $("showcase");
  if (!hero.querySelector(".hero-slide")) $("hero-carousel").innerHTML = heroMarkup(schools);
  hero.querySelectorAll(".hero-art img").forEach((img) => {
    const fallback = () => {
      if (!fallbackImage(img, imageUrls(img.closest(".hero-slide").dataset.f).original)) img.hidden = true;
    };
    img.addEventListener("error", fallback);
    if (img.complete && img.currentSrc && !img.naturalWidth) fallback();
  });
  enhanceHero(hero, {
    onShow: (slide) => {
      slide.querySelectorAll("[data-src], [data-srcset]").forEach((el) => {
        for (const attr of ["srcset", "src"]) {
          if (!el.dataset[attr]) continue;
          el.setAttribute(attr, el.dataset[attr]);
          delete el.dataset[attr];
        }
      });
      loadFonts(byId[slide.dataset.s]);
    },
    onSelect: (s, f) => {
      if (s === state.s && f === state.f) apply();
      else commit({ s, f }, "hero");
      $("workbench").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      $("bench-title").focus({ preventScroll: true });
    },
  });
  const narrow = matchMedia("(max-width: 900px)");
  const placeLabel = () => (narrow.matches ? $("label-slot") : $("bench-stage")).append($("duo"), $("label"));
  narrow.addEventListener("change", placeLabel);
  placeLabel();
  new ResizeObserver(([e]) => $("workbench").style.setProperty("--stage-h", `${Math.ceil(e.borderBoxSize[0].blockSize)}px`)).observe($("bench-stage"));
  markGroup();
  reveal();
}

main();

import { esc } from "./catalog.mjs";
import { imageMarkup } from "./images.mjs";

export const HERO_SLIDES = [
  { s: "bauhaus", f: "fauvism", title: ["包豪斯定网格，", "野兽派给颜色。"], description: "版面按包豪斯的几何模块分栏，颜色换成野兽派的朱红、翠绿和钴蓝。排版规整，色块更大胆。", mood: "模块与纯色" },
  { s: "minimalism", f: "ukiyo-e", title: ["大面积留白，", "只放一张木版画。"], description: "极简骨架只留单栏和一个强调色，主视觉用浮世绘的平涂套色、细黑轮廓与浪纹。", mood: "留白与木版画" },
  { s: "art-deco", f: "dunhuang", title: ["中轴对称的双线框，", "填上土红与石青。"], description: "装饰艺术的细线框沿中轴展开，颜色取敦煌壁画的土红、石青和赭黄，壁面斑驳被骨架调淡。", mood: "中轴与矿物色" },
  { s: "memphis", f: "fauvism", title: ["错位的几何块，", "加一层硬投影。"], description: "孟菲斯负责错位排列和硬投影，野兽派提供撞色底和粗笔触插图，适合市集、演出等活动主视觉。", mood: "错位与硬投影" },
];

export function heroMarkup(schools, imageBase) {
  const byId = Object.fromEntries(schools.map((s) => [s.id, s]));
  const names = [];
  const slides = HERO_SLIDES.map((slide, i) => {
    const S = byId[slide.s];
    const F = byId[slide.f];
    if (!S?.roles.includes("structure") || !F) throw new Error(`无效轮播组合：${slide.s} + ${slide.f}`);
    const name = `${S.name} × ${F.name}`;
    names.push(name);
    const st = S.structure;
    const sizes = S.id === "minimalism" ? "(max-width: 720px) calc(100vw - 90px), (max-width: 1100px) 46vw, 700px" : S.id === "art-deco" ? "(max-width: 720px) 54vw, (max-width: 1100px) 30vw, 440px" : "(max-width: 720px) calc((100vw - 90px) / 2), (max-width: 1100px) 22vw, 300px";
    const level = Math.min(F.texture.level, st.textureCap);
    const palette = { ...F.palette, accent2: st.accentSlots < 2 ? F.palette.surface : F.palette.accent2, accent3: st.accentSlots < 2 ? F.palette.muted : st.accentSlots < 3 ? F.palette.accent2 : F.palette.accent3 };
    const vars = Object.entries(palette).map(([key, value]) => `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${value}`);
    vars.push(`--font-display:"${st.type.display.family}",${st.type.zh}`, `--font-body:"${st.type.body.family}",${st.type.zh}`, `--display-weight:${st.type.display.weight}`, `--display-tracking:${st.type.display.tracking}`, `--display-transform:${st.type.display.transform}`, `--tex-level:${level}`);
    let visual = imageMarkup(F.id, { imageBase, sizes, loading: i ? "lazy" : "eager", priority: i ? "low" : "high" });
    if (i) visual = visual.replace(/\b(src|srcset)=/g, "data-$1=");
    return `<article class="hero-slide" id="hero-slide-${i + 1}"${i ? " hidden" : ""} role="group" aria-roledescription="幻灯片" aria-label="${i + 1} / ${HERO_SLIDES.length}：${esc(name)}" data-s="${S.id}" data-f="${F.id}" style="${esc(vars.join(";"))}">
      <div class="hero-copy"><p class="hero-mix"><span>${String(i + 1).padStart(2, "0")}</span> ${esc(name)}</p><h2>${slide.title.map((line) => `<span>${esc(line)}</span>`).join("")}</h2><p class="hero-description">${esc(slide.description)}</p><a class="hero-cta" href="#mix=${S.id}+${F.id}" data-hero-mix>试试这组风格 <span aria-hidden="true">↗</span></a><p class="hero-roles">骨架 / ${esc(S.name)}<br>表皮 / ${esc(F.name)}</p></div>
      <div class="hero-poster pv" data-structure="${S.id}" data-texture="${level ? F.texture.kind : "none"}" aria-hidden="true"><div class="pv-tex"></div><div class="hero-poster-content"><span class="hero-poster-meta">流派混合 / 风格实验 ${String(i + 1).padStart(2, "0")}</span><span class="hero-wordmark" lang="en"><span>Style</span><span>Mix<span class="hero-period">.</span></span></span><figure class="hero-art">${visual}</figure><div class="hero-shapes"><i></i><i></i><i></i></div><div class="hero-poster-foot"><span>${esc(slide.mood)}</span><span>${schools.filter((s) => s.roles.includes("structure")).length} 副骨架 × ${schools.length} 层表皮</span></div></div></div>
    </article>`;
  }).join("");
  const mixes = HERO_SLIDES.map((slide, i) => `<a href="#mix=${slide.s}+${slide.f}">${esc(names[i])}</a>`).join("");
  return `<div class="hero-slides" id="hero-slides">${slides}</div><div class="hero-controls" hidden><button type="button" class="hero-rotation" data-hero-rotation aria-controls="hero-slides">自动播放</button><div class="hero-pickers" role="group" aria-label="选择风格示例">${names.map((name, i) => `<button type="button" data-hero-picker aria-controls="hero-slide-${i + 1}" aria-label="查看第 ${i + 1} 张：${esc(name)}" aria-pressed="${i === 0}"><span>${String(i + 1).padStart(2, "0")}</span><span>${esc(HERO_SLIDES[i].mood)}</span></button>`).join("")}</div><div class="hero-arrows"><button type="button" data-hero-prev aria-label="上一张风格示例" aria-controls="hero-slides">←</button><button type="button" data-hero-next aria-label="下一张风格示例" aria-controls="hero-slides">→</button></div></div><p class="hero-status" aria-live="polite" aria-atomic="true"></p><nav class="hero-combinations" aria-label="精选风格组合"><span>精选组合</span>${mixes}</nav><p class="hero-disclaimer">四组示例都由 Style Mix 按同一套规则生成。插图为 AI 生成的风格示意。</p>`;
}

export function enhanceHero(root, options = {}) {
  if (!root || root.dataset.enhanced) return;
  const slides = [...root.querySelectorAll(".hero-slide")];
  if (!slides.length) return;
  const pickers = [...root.querySelectorAll("[data-hero-picker]")];
  const rotation = root.querySelector("[data-hero-rotation]");
  const status = root.querySelector(".hero-status");
  const doc = root.ownerDocument;
  const media = options.media ?? matchMedia("(prefers-reduced-motion: reduce)");
  const clock = options.clock ?? globalThis;
  let index = 0;
  let wanted = false;
  let hovering = false;
  let visible = true;
  let timer;
  let started = false;
  const schedule = () => {
    clock.clearTimeout(timer);
    const running = wanted && !hovering && visible && !doc.hidden && !media.matches;
    root.dataset.rotation = running ? "playing" : "paused";
    status.setAttribute("aria-live", wanted ? "off" : "polite");
    rotation.disabled = media.matches;
    rotation.textContent = media.matches ? "已减少动态效果" : wanted ? "暂停播放" : "自动播放";
    if (running) timer = clock.setTimeout(() => show(index + 1), 6500);
  };
  const show = (next) => {
    index = (next + slides.length) % slides.length;
    root.dataset.transition = String(started);
    started = true;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    pickers.forEach((picker, i) => picker.setAttribute("aria-pressed", String(i === index)));
    options.onShow?.(slides[index]);
    schedule();
    status.textContent = slides[index].getAttribute?.("aria-label") ?? `${index + 1} / ${slides.length}`;
  };
  const manual = (next) => { wanted = false; show(next); };
  root.dataset.enhanced = "true";
  root.setAttribute("aria-roledescription", "轮播");
  root.querySelector(".hero-controls").hidden = false;
  root.querySelector("[data-hero-prev]").addEventListener("click", () => manual(index - 1));
  root.querySelector("[data-hero-next]").addEventListener("click", () => manual(index + 1));
  pickers.forEach((picker, i) => picker.addEventListener("click", () => manual(i)));
  rotation.addEventListener("click", () => { wanted = !media.matches && !wanted; schedule(); });
  root.addEventListener("pointerenter", () => { hovering = true; schedule(); });
  root.addEventListener("pointerleave", () => { hovering = false; schedule(); });
  root.addEventListener("focusin", () => { wanted = false; schedule(); });
  root.addEventListener("keydown", (e) => {
    const i = pickers.indexOf(e.target);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: slides.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    manual(next);
    pickers[index].focus();
  });
  root.addEventListener("click", (e) => {
    if (!e.target.closest("[data-hero-mix]") || !options.onSelect || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    options.onSelect(slides[index].dataset.s, slides[index].dataset.f);
  });
  media.addEventListener("change", () => { if (media.matches) wanted = false; schedule(); });
  doc.addEventListener("visibilitychange", schedule);
  const Observer = doc.defaultView?.IntersectionObserver;
  if (Observer) new Observer(([entry]) => { visible = entry.isIntersecting; schedule(); }).observe(root);
  show(0);
}

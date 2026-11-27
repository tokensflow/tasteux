import { imageMarkup } from "./images.mjs";

export const FEATURED_IDS = ["bauhaus", "memphis", "art-deco", "ukiyo-e", "dunhuang", "fauvism"];
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clause = (text) => text.split(/[，。；：]/)[0];

// 选骨架的缩略图：每副骨架一张黑白几何线框（viewBox 90×76，和示例页同比例），只画版式，不放文字、不上色。
// 图形取自 schools.json 里该骨架的 grid 规则：一眼分清网格、对角、中轴、拼贴和横带。
const B = "#111";
const box = (x, y, w, h, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${extra}/>`;
const frame = (x, y, w, h) => box(x, y, w, h, ` fill="none" stroke="${B}" stroke-width="1.6"`);
const line = (x1, y1, x2, y2, w = 1.6) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${B}" stroke-width="${w}"/>`;
export const SKELETON_WIREFRAMES = {
  cubism: `<polygon points="8,10 46,6 40,40 4,34" fill="${B}"/><polygon points="34,18 82,12 86,46 30,52" fill="none" stroke="${B}" stroke-width="1.6"/><polygon points="14,40 52,36 58,68 10,70" fill="none" stroke="${B}" stroke-width="1.6"/><polygon points="48,44 84,50 78,70 44,66" fill="${B}"/><polygon points="40,24 60,20 64,42 44,46" fill="#fff" stroke="${B}" stroke-width="1.6"/>`,
  futurism: `<g transform="skewX(-24)">${box(30, 10, 40, 12)}${box(44, 28, 34, 9)}${box(56, 43, 28, 7)}${box(66, 56, 22, 5)}</g>${line(4, 70, 30, 18, 1)}${line(12, 72, 40, 16, 1)}${line(20, 74, 50, 14, 1)}`,
  suprematism: `${box(18, 10, 22, 22)}<g transform="rotate(-28 45 38)">${box(36, 38, 34, 6)}${box(44, 50, 22, 4)}${box(30, 26, 12, 3)}</g><g transform="rotate(-28 45 38)">${frame(52, 60, 10, 10)}</g><circle cx="72" cy="16" r="4" fill="${B}"/>`,
  constructivism: `<polygon points="0,60 90,26 90,40 0,74" fill="${B}"/><g transform="rotate(-12 45 38)">${box(10, 8, 34, 14)}${frame(50, 10, 26, 22)}${box(14, 30, 4, 4)}${box(22, 30, 16, 2)}</g>${line(60, 76, 90, 54, 1)}`,
  dada: `<g transform="rotate(8 25 22)">${box(8, 8, 34, 22)}</g><g transform="rotate(-14 62 20)">${frame(46, 8, 30, 24)}</g><g transform="rotate(-4 30 54)">${frame(10, 40, 40, 26)}${line(14, 46, 46, 46, 1)}${line(14, 52, 46, 52, 1)}${line(14, 58, 40, 58, 1)}</g><g transform="rotate(22 68 54)">${box(56, 44, 26, 18)}</g><circle cx="44" cy="34" r="6" fill="#fff" stroke="${B}" stroke-width="1.6"/>`,
  "de-stijl": `${box(0, 0, 90, 76, ` fill="#fff"`)}${line(32, 0, 32, 76, 5)}${line(0, 26, 90, 26, 5)}${line(68, 26, 68, 76, 5)}${line(32, 54, 68, 54, 5)}${line(14, 26, 14, 76, 5)}${box(34.5, 28.5, 31, 23)}${box(70.5, 0, 19.5, 23.5, ` fill="#777"`)}`,
  bauhaus: `${Array.from({ length: 13 }, (_, i) => line(6 + i * 6.5, 4, 6 + i * 6.5, 72, 0.4)).join("")}${box(6, 10, 39, 6)}${box(6, 20, 26, 3)}${box(6, 50, 78, 16)}${frame(51.5, 10, 32.5, 34)}<circle cx="67.75" cy="27" r="11" fill="${B}"/>${box(6, 30, 13, 6)}`,
  "art-deco": `${frame(6, 4, 78, 68)}${frame(10, 8, 70, 60)}<polygon points="45,12 60,30 30,30" fill="${B}"/>${box(28, 34, 34, 4)}${box(34, 41, 22, 2)}${box(38, 47, 14, 6)}${line(16, 58, 74, 58, 1)}${box(18, 61, 14, 4)}${box(38, 61, 14, 4)}${box(58, 61, 14, 4)}`,
  minimalism: `${box(14, 18, 30, 6)}${box(14, 30, 44, 1.6)}${box(14, 35, 40, 1.6)}${box(14, 40, 42, 1.6)}${frame(14, 50, 12, 5)}`,
  memphis: `<g transform="rotate(-4 28 22)">${box(14, 14, 34, 18)}${box(10, 10, 34, 18, ` fill="#fff" stroke="${B}" stroke-width="1.6"`)}</g><g transform="rotate(5 64 48)">${box(53, 41, 26, 18, ` rx="6"`)}${box(50, 38, 26, 18, ` rx="6" fill="#fff" stroke="${B}" stroke-width="1.6"`)}</g><path d="M8 58 q5 -8 10 0 t10 0 t10 0" fill="none" stroke="${B}" stroke-width="2"/><circle cx="72" cy="16" r="7" fill="none" stroke="${B}" stroke-width="1.6"/><polygon points="30,66 38,52 46,66" fill="${B}"/>`,
  dunhuang: `${box(0, 4, 90, 6)}${frame(4, 16, 82, 18)}${box(8, 20, 20, 10)}${box(34, 20, 20, 10)}${box(60, 20, 22, 10)}${box(0, 40, 90, 2)}${frame(4, 46, 82, 16)}${box(8, 50, 12, 8)}${box(26, 50, 12, 8)}${box(44, 50, 12, 8)}${box(62, 50, 20, 8)}${box(0, 68, 90, 6)}`,
};

export function structurePickerMarkup(schools) {
  return schools.filter((s) => s.roles.includes("structure")).map((s) => `<button class="skel" type="button" data-role="s" data-id="${esc(s.id)}" aria-pressed="false"><svg class="wire" viewBox="0 0 90 76" aria-hidden="true" fill="${B}">${SKELETON_WIREFRAMES[s.id]}</svg><span class="skel-name">${esc(s.name)}</span></button>`).join("");
}

export function groupPickerMarkup(schools, groups) {
  return Object.entries(groups).map(([id, label]) => `<button class="grp" type="button" data-group="${esc(id)}">${esc(label)}<span>${schools.filter((s) => s.group === id).length}</span></button>`).join("");
}

export function surfacePickerMarkup(schools, groups, imageBase) {
  return Object.entries(groups).map(([group, label]) => `<div class="skin-group" data-group="${esc(group)}" role="group" aria-label="${esc(label)}">${schools.filter((s) => s.group === group).map((s) => `<button class="skin" type="button" data-role="f" data-id="${esc(s.id)}" aria-pressed="false" style="--sw-bg:${esc(s.palette.bg)};--sw-accent:${esc(s.palette.accent)};--sw-accent2:${esc(s.palette.accent2)}"><span class="skin-img">${imageMarkup(s.id, { imageBase, sizes: "auto, 150px" })}</span><span class="skin-name">${esc(s.name)}<i class="skin-chip" aria-hidden="true"><i></i><i></i><i></i></i></span></button>`).join("")}</div>`).join("");
}

export function originalMarkup(s, sizes) {
  const w = s.works?.[0];
  if (!w) return "";
  const alt = `${w.artist}《${w.title}》`;
  return `<figure class="plate-original" data-original><picture><source type="image/webp" srcset="art/${esc(s.id)}.800.webp" sizes="${esc(sizes)}"><img src="art/${esc(s.id)}.jpg" alt="${esc(alt)}" width="1200" height="900" loading="lazy" decoding="async"></picture><figcaption>${esc(w.artist)}《${esc(w.title)}》，${esc(w.year)}。<a href="${esc(w.page)}">${esc(w.source)}</a>，${esc(w.license)}。</figcaption></figure>`;
}

export function plateMarkup(s, i, imageBase) {
  const structure = s.roles.includes("structure");
  const name = FEATURED_IDS.includes(s.id) ? `<a href="schools/${esc(s.id)}/">${esc(s.name)}</a>` : esc(s.name);
  const title = `<h4>${name}<span class="en" lang="en">${esc(s.en)}</span></h4>`;
  const meta = `<p class="plate-meta"><span class="plate-no">Pl. ${String(i + 1).padStart(2, "0")}</span><span>${esc(s.era)}</span></p>`;
  const img = imageMarkup(s.id, { imageBase, alt: `${s.name}风格示意：${s.motifs.slice(0, 2).join("、")}`, sizes: structure ? "auto, (max-width: 900px) 90vw, 45vw" : "auto, (max-width: 640px) 90vw, 30vw" });
  const colors = ["bg", "surface", "ink", "accent", "accent2", "accent3"].map((key) => `--${key}:${esc(s.palette[key])}`).join(";");
  // 表皮流派没有可用原作（仍在版权期）时，AI 示意图占原作的位置并写明来历，版式与其他图版对齐。
  const original = originalMarkup(s, structure ? "(max-width: 900px) 45vw, 22vw" : "(max-width: 640px) 90vw, 30vw")
    || (structure ? "" : `<figure class="plate-original plate-standin">${img}<figcaption>${esc(s.name)}的代表作仍在版权期内，这里不收录原作；上图是 AI 生成的风格示意。</figcaption></figure>`);
  const visual = structure
    ? original ? `<div class="plate-pair">${original}<figure class="slot plate-visual">${img}</figure></div>` : `<figure class="slot plate-visual">${img}</figure>`
    : `${original}<div class="pv pv-study"${original ? ' data-img="none"' : ""} style="${colors};--tex-level:${s.texture.level}" data-texture="${esc(s.texture.kind)}"><div class="pv-tex" aria-hidden="true"></div><span class="study-glyph" aria-hidden="true" lang="${s.group === "east" ? "zh" : "en"}">${s.group === "east" ? "永" : "Aa"}</span>${original ? "" : `<figure class="study-img">${img}</figure>`}<div class="study-chips" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div>`;
  const traits = structure
    ? `<dt>骨架</dt><dd><b>${esc(clause(s.structure.grid))}</b></dd><dt>字体</dt><dd>${esc(s.structure.type.display.family)}${s.structure.type.body.family !== s.structure.type.display.family ? ` / ${esc(s.structure.type.body.family)}` : ""}</dd>`
    : `<dt>母题</dt><dd>${esc(s.motifs.slice(0, 3).join("、"))}</dd>`;
  return `<article class="plate reveal" id="plate-${esc(s.id)}" data-school="${esc(s.id)}">${meta}${visual}${title}
    <p class="essence">${esc(s.essence)}</p><p class="plate-intro">${esc(s.intro)}</p>
    <dl class="traits">${traits}<dt>色彩</dt><dd>${esc(clause(s.colorUsage))}</dd><dt>质感</dt><dd>${esc(s.texture.desc)}</dd></dl>
    <div class="plate-actions">${structure ? `<button class="btn btn-sm" type="button" data-role="s" data-id="${esc(s.id)}">用作骨架</button>` : ""}<button class="btn btn-sm" type="button" data-role="f" data-id="${esc(s.id)}">用作表皮</button>${FEATURED_IDS.includes(s.id) ? `<a class="plate-more" href="schools/${esc(s.id)}/">网页设计用法 →</a>` : ""}</div>
  </article>`;
}

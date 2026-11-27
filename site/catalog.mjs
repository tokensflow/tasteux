import { imageMarkup } from "./images.mjs";

export const FEATURED_IDS = ["bauhaus", "memphis", "art-deco", "ukiyo-e", "dunhuang", "fauvism"];
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clause = (text) => text.split(/[，。；：]/)[0];

export function structurePickerMarkup(schools) {
  return schools.filter((s) => s.roles.includes("structure")).map((s) => `<button class="skel" type="button" data-role="s" data-id="${esc(s.id)}" aria-pressed="false"><div class="thumb"></div><span class="skel-name">${esc(s.name)}</span></button>`).join("");
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
  const original = originalMarkup(s, structure ? "(max-width: 900px) 45vw, 22vw" : "(max-width: 640px) 90vw, 30vw");
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

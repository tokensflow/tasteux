import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FEATURED_IDS, esc, plateMarkup, structurePickerMarkup, surfacePickerMarkup, groupPickerMarkup } from "../site/catalog.mjs";
import { schoolNotes, guideBody, privacyBody, enHomeBody, aboutBody, ISSUES, REPO } from "./editorial.mjs";
import { imageMarkup } from "../site/images.mjs";
import { buildAssets, versionPage } from "./assets.mjs";
import { heroMarkup } from "../site/hero.mjs";
import { paletteVars } from "../site/palette.mjs";
import { fontsHref } from "../site/fonts.mjs";
import { skillVersionsMarkup } from "../site/install.mjs";
import { buildSkillPackages } from "./skill-packages.mjs";
import { EN_PATHS, SAMPLE_EN, GRID_EN, enSchoolNotes, enGuideBody, enAboutBody, enPrivacyBody } from "./editorial-en.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const ORIGIN = "https://tasteux.com";
const HOME = "/";
const GUIDE = "/guides/art-movement-web-design/";
const PRIVACY = "/privacy/";
const ABOUT = "/about/";
const EN = "/en/";
// 中英页面两两互为 hreflang 备选，x-default 指中文页。
const hreflangPair = (zh, en) => `<link rel="alternate" hreflang="zh-CN" href="${ORIGIN}${zh}">\n  <link rel="alternate" hreflang="en" href="${ORIGIN}${en}">\n  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${zh}">`;
const hreflang = hreflangPair(HOME, EN);
const GUIDE_TITLE = "如何把艺术流派变成网页设计与 AI 提示词";
// Google AdSense 发布商 ID（ca-pub-…）。留空则不输出广告代码和 ads.txt。
const ADSENSE_CLIENT = "ca-pub-7118095537154296";
// 固定广告位（AdSense 后台"按广告单元"建的展示广告的 data-ad-slot）。留空的广告位不输出。不用自动广告：代码里不写 enable_page_level_ads。
const AD_SLOTS = { plates: "", footer: "" };
// 广告位：固定高度占位，标注「广告」；没有广告 ID 或广告位 ID 时返回空字符串。
export function adSlotMarkup(client, slot, en = false) {
  if (!client || !slot) return "";
  return `<aside class="ad-slot" aria-label="${en ? "Advertisement" : "广告"}"><p class="ad-label">${en ? "Advertisement" : "广告"}</p><ins class="adsbygoogle" data-ad-client="${esc(client)}" data-ad-slot="${esc(slot)}" data-full-width-responsive="false"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></aside>`;
}
const isStructure = (s) => s.roles.includes("structure");
const schoolPath = (id) => `${HOME}schools/${id}/`;
const list = (items) => `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
// 页面内容最后一次改动的日期，取自 git 提交；没有 git 历史时不写 lastmod，避免把构建时间当成更新时间。
const CONTENT_SOURCES = ["site", "skill/schools.json", "scripts/editorial.mjs", "scripts/build-site.mjs"];
function contentDate() {
  try { return execFileSync("git", ["log", "-1", "--format=%cs", "--", ...CONTENT_SOURCES], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null; } catch { return null; }
}
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

function seo({ title, description, url, image = "fauvism", imageAlt, graph, article = false, en = false, alt }) {
  const absolute = ORIGIN + url;
  const imageUrl = `${ORIGIN}/img/${image}.jpg`;
  return `<title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${absolute}">${alt ? `\n  ${hreflangPair(alt.zh, alt.en)}` : ""}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="${article ? "article" : "website"}">
  <meta property="og:site_name" content="tasteux">
  <meta property="og:locale" content="${en ? "en_US" : "zh_CN"}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${absolute}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="800">
  <meta property="og:image:alt" content="${esc(imageAlt ?? (en ? "AI-generated illustration in the Fauvism style" : "野兽派风格的 AI 生成示意图"))}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <script type="application/ld+json">${json({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

function breadcrumbs(url, name, en = false) {
  return { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "tasteux Style Mix", item: ORIGIN + (en ? EN : HOME) },
    { "@type": "ListItem", position: 2, name, item: ORIGIN + url },
  ] };
}

function page(template, metadata, name, content) {
  const en = metadata.en;
  const assets = template.match(/<link rel="preconnect"[\s\S]*?<link rel="stylesheet" href="preview.css">/)[0]
    .replace('href="style.css"', 'href="/style.css"').replace('href="preview.css"', 'href="/preview.css"');
  return `<!doctype html>
<html lang="${en ? "en" : "zh-CN"}" class="doc${metadata.reading ? " doc-reading" : ""}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${seo(metadata)}
  ${assets}
</head>
<body>
  <div class="pv doc-tex" data-texture="paper" aria-hidden="true"><div class="pv-tex"></div></div>
  <a class="skip" href="#article">${en ? "Skip to content" : "跳到正文"}</a>
  <header class="bar"><a class="brand" href="/"><b>tasteux</b><em lang="en">Style Mix</em></a><nav aria-label="${en ? "Pages" : "页面"}">${en ? `<a href="${EN_PATHS.guide}">Guide</a><a href="${EN}#install">Install</a><a href="${metadata.alt?.zh ?? HOME}" hreflang="zh-CN" lang="zh-CN">中文</a>` : `<a href="/#workbench">混合</a><a href="/#plates">图鉴</a><a href="/#install">安装</a><a href="${metadata.alt?.en ?? EN}" hreflang="en" lang="en">EN</a>`}</nav></header>
  <main class="article-page" id="article">
    ${en ? (metadata.url === EN ? "" : `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${EN}">tasteux Style Mix</a><span aria-hidden="true"> / </span><span aria-current="page">${esc(name)}</span></nav>`) : `<nav class="breadcrumbs" aria-label="面包屑"><a href="/">tasteux Style Mix</a><span aria-hidden="true"> / </span><span aria-current="page">${esc(name)}</span></nav>`}
    ${content}
  </main>
  ${en ? `<footer class="colophon"><span>Style Mix by <b>tasteux</b></span><a href="${EN_PATHS.guide}">Guide</a><a href="${EN}#install">Install the skill</a><a href="${EN_PATHS.about}">About</a><a href="${EN_PATHS.privacy}">Privacy</a><a href="${metadata.alt?.zh ?? HOME}" hreflang="zh-CN" lang="zh-CN">中文版</a></footer>` : `<footer class="colophon"><span><b>tasteux</b> 出品 · 流派混合 <em lang="en">Style Mix</em></span><a href="${GUIDE}">使用教程</a><a href="/#install">安装 Agent 技能</a><a href="/skill/schools.json">流派数据</a><a href="${ABOUT}">关于</a><a href="${PRIVACY}">隐私政策</a></footer>`}
</body>
</html>
`;
}

// 流派页上的网页预览：与工作台同一个示例页（index.html 的 #pv-tpl），按骨架和表皮在构建时上色，不靠 JS。
function previewMarkup(template, S, F, imageBase, en = false) {
  const st = S.structure;
  const level = Math.min(F.texture.level, st.textureCap);
  const vars = {
    ...paletteVars(F.palette, st.accentSlots),
    "--font-display": `"${st.type.display.family}", ${st.type.zh}`,
    "--font-body": `"${st.type.body.family}", ${st.type.zh}`,
    "--display-weight": st.type.display.weight,
    "--display-transform": st.type.display.transform,
    "--display-tracking": st.type.display.tracking,
    "--tex-level": level,
  };
  const style = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");
  const tpl = template.match(/<template id="pv-tpl">\s*([\s\S]*?)\s*<\/template>/)[1];
  const pv = replaceOnce(tpl, /<div class="pv" [^>]*>/, `<div class="pv" data-structure="${esc(S.id)}" data-texture="${level ? esc(F.texture.kind) : "none"}"${F.img === false ? ' data-img="none"' : ""} style="${esc(style)}" aria-hidden="true">`)
    .replace(/<figure class="pv-img"[\s\S]*?<\/figure>/, () => `<figure class="pv-img" aria-hidden="true">${F.img === false ? "" : imageMarkup(F.id, { imageBase, alt: "", sizes: "(max-width: 640px) 160px, 320px" })}</figure>`);
  const text = en ? SAMPLE_EN.reduce((html, [zh, eng]) => html.split(`>${zh}<`).join(`>${eng}<`), pv) : pv;
  return `<link rel="stylesheet" href="${esc(fontsHref(st.type.google))}"><div class="thumb">${text}</div>`;
}

function schoolPage(template, s, byId, imageBase) {
  const note = schoolNotes[s.id];
  const S = isStructure(s) ? s : byId.minimalism;
  const url = schoolPath(s.id);
  const title = `${s.name}网页设计：配色、${isStructure(s) ? "布局" : "质感"}与 AI 提示词｜tasteux Style Mix`;
  const description = `${s.name}（${s.en}）怎样用于网页设计？查看${isStructure(s) ? "布局和字体" : "配色和质感"}规则、适用场景与搭配建议，并在工作台预览、复制提示词和下载 DESIGN.md。`;
  const mixUrl = `${HOME}#mix=${S.id}+${s.id}`;
  const colors = Object.entries(s.palette).map(([key, color]) => `<li><span class="palette-swatch" style="background:${esc(color)}" aria-hidden="true"></span><code>--${esc(key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))}</code><code>${esc(color)}</code></li>`).join("");
  const prompt = `请为${note.subject}设计一个响应式网页。\n骨架使用${S.name}：${S.structure.grid}。\n标题用 ${S.structure.type.display.family}，正文用 ${S.structure.type.body.family}。\n表皮使用${s.name}：${s.colorUsage}\n质感只放在背景，强度不超过 ${Math.min(s.texture.level, S.structure.textureCap)}；使用 ${S.structure.accentSlots} 个强调色。\n不要改变骨架布局，不要让质感覆盖正文；保留键盘焦点和足够的文字对比度。`;
  const recommendations = note.mixes.map(({ s: sid, f: fid, why }) => `<li><a href="/#mix=${sid}+${fid}">${esc(byId[sid].name)} × ${esc(byId[fid].name)}</a><p>${esc(why)}</p></li>`).join("");
  const related = note.related.map((id) => `<a href="${schoolPath(id)}">${esc(byId[id].name)}网页设计用法</a>`).join("");
  const layout = isStructure(s)
    ? `<p>${esc(s.structure.grid)}</p>${list(s.structure.rules)}<dl class="article-facts"><dt>标题字体</dt><dd>${esc(s.structure.type.display.family)} · ${s.structure.type.display.weight}</dd><dt>正文字体</dt><dd>${esc(s.structure.type.body.family)}</dd><dt>中文回退</dt><dd>${esc(s.structure.type.zh)}</dd><dt>界面形状</dt><dd>圆角 ${esc(s.structure.radius)}；边框 ${esc(s.structure.border)}；阴影 ${esc(s.structure.shadow)}</dd><dt>动效</dt><dd>${esc(s.structure.motion.desc)} · ${esc(s.structure.motion.duration)}</dd></dl>`
    : `<p>${esc(s.name)}在这套规则里只做表皮：提供配色、质感、母题和生图媒介，不决定网页布局与字体。单独使用时，由极简主义提供骨架；也可以在工作台另选骨架。</p><p>默认骨架：${esc(S.structure.grid)}。标题字体 ${esc(S.structure.type.display.family)}，正文 ${esc(S.structure.type.body.family)}。这是本项目的网页设计转译，不是对原流派历史的分类。</p>`;
  const content = `<article>
    <header class="article-head"><p class="article-kicker">${esc(s.en)} · ${esc(s.era)}</p><h1>${esc(s.name)}怎样变成网页风格</h1><p class="article-lede">${esc(note.lede)}</p><a class="btn" href="${mixUrl}">在工作台试用${esc(s.name)}</a></header>
    <figure class="school-pv">${previewMarkup(template, S, s, imageBase)}<figcaption>网页预览：${esc(S.name)}骨架 × ${esc(s.name)}表皮，和工作台用的是同一个书店示例页。${isStructure(s) ? `布局、字体和配色都来自${esc(s.name)}。` : `${esc(s.name)}只给配色、质感和插图，布局来自${esc(S.name)}。`}<a href="${mixUrl}">在工作台换一副${isStructure(s) ? "表皮" : "骨架"}</a></figcaption></figure>
    <figure class="article-visual">${imageMarkup(s.id, { imageBase, alt: `${s.name}风格的 AI 生成示意图`, sizes: "(max-width: 640px) calc(100vw - 40px), 900px", loading: "eager", priority: "high" })}<figcaption>AI 生成的风格示意，不是历史作品的复制。主视觉呈现${esc(s.name)}的颜色、质感与母题，实际网页布局由骨架决定。</figcaption></figure>
    <div class="article-body">
      <section><h2>先认识${esc(s.name)}</h2><p>${esc(s.intro)}</p><p>${esc(s.essence)}</p></section>
      <section><h2>适用场景与取舍</h2>${list(note.uses)}<p>${esc(note.caution)}</p></section>
      <section><h2>${isStructure(s) ? "布局与字体怎么落到网页上" : "表皮与骨架怎样分工"}</h2>${layout}</section>
      <section><h2>${esc(s.name)}配色与质感</h2><p>${esc(s.colorUsage)}</p><ul class="palette-list">${colors}</ul><p>质感：${esc(s.texture.desc)}。流派原始强度 ${s.texture.level}；混合时取它与骨架 textureCap 中较小的值。只铺在背景，不盖住文字。</p><p>本项目调色板通过对比度校验；落到页面上仍要按实际前景与背景配对检查，不能把正文任意放在辅色上。</p></section>
      <section><h2>主视觉与生图媒介</h2><p>母题：${esc(s.motifs.join("、"))}。</p><p>英文媒介描述可以作为生图提示词的一部分，再补具体画面主题；完整构图与负向词请在工作台的“生图用”标签中取得。</p><pre>${esc(s.medium)}</pre><p>质感只铺在页面底色；主视觉单独占位，不作为正文底图。母题与骨架冲突时，只留在主视觉插图中。</p></section>
      <section><h2>代码提示词起点</h2><p>下面是场景示例。需要完整 CSS 变量、布局规则和禁忌时，请在<a href="${mixUrl}">工作台复制“写代码用”提示词</a>，或下载 DESIGN.md。</p><pre>${esc(prompt)}</pre></section>
      <section><h2>哪些搭配值得试</h2><ul class="mix-recommendations">${recommendations}</ul></section>
      <section><h2>不要这样用</h2>${list([...S.structure.dont, ...s.dont])}<p>布局禁忌来自骨架，色彩与画面禁忌来自表皮；混合不取两套风格的平均值。</p></section>
      <section><h2>接下来</h2><p><a href="${GUIDE}">使用教程：把风格交给 Claude Code、Cursor 或 v0</a>，也可以<a href="/#install">安装整套 Agent 技能</a>。</p><div class="related-links">${related}</div><p class="article-provenance">流派简介和设计参数来自<a href="/skill/schools.json">本项目流派库</a>；场景与搭配是设计建议，混合方式以<a href="/skill/references/mixing.md">混合规则</a>为准。</p></section>
    </div>
  </article>`;
  return page(template, { title, description, url, alt: { zh: url, en: EN_PATHS.school(s.id) }, image: s.id, imageAlt: `${s.name}风格的 AI 生成示意图`, graph: [
    { "@type": "WebPage", url: ORIGIN + url, name: title, description, inLanguage: "zh-CN" },
    breadcrumbs(url, `${s.name}网页设计`),
  ] }, `${s.name}网页设计`, content);
}

function enSchoolPage(template, s, byId, imageBase) {
  const note = enSchoolNotes[s.id];
  const structure = isStructure(s);
  const S = structure ? s : byId.minimalism;
  const url = EN_PATHS.school(s.id);
  const mixUrl = `${HOME}#mix=${S.id}+${s.id}`;
  const title = `${s.en} web design: color, ${structure ? "layout" : "texture"} and AI prompts | tasteux Style Mix`;
  const description = `How to use ${s.en} in web design: ${structure ? "layout and type" : "color and texture"} rules, where it fits, pairs worth trying, and a prompt to start from.`;
  const colors = Object.entries(s.palette).map(([key, color]) => `<li><span class="palette-swatch" style="background:${esc(color)}" aria-hidden="true"></span><code>--${esc(key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))}</code><code>${esc(color)}</code></li>`).join("");
  const prompt = `Design a responsive web page for ${note.subject}.\nSkeleton: ${S.en}, ${GRID_EN[S.id]}.\nHeadings in ${S.structure.type.display.family}, body in ${S.structure.type.body.family}.\nSkin: ${s.en}. ${note.color}\nTexture on the background only, strength at most ${Math.min(s.texture.level, S.structure.textureCap)}; use ${S.structure.accentSlots} accent color${S.structure.accentSlots > 1 ? "s" : ""}.\nDon't change the skeleton's layout, never put texture behind body text, keep keyboard focus visible and text contrast sufficient.`;
  const recommendations = note.mixes.map(({ s: sid, f: fid, why }) => `<li><a href="/#mix=${sid}+${fid}" hreflang="zh-CN">${esc(byId[sid].en)} × ${esc(byId[fid].en)}</a><p>${esc(why)}</p></li>`).join("");
  const related = note.related.map((id) => `<a href="${EN_PATHS.school(id)}">${esc(byId[id].en)} in web design</a>`).join("");
  const layout = structure
    ? `<p>${esc(note.layout)}</p><dl class="article-facts"><dt>Grid</dt><dd>${esc(GRID_EN[s.id])}</dd><dt>Headings</dt><dd>${esc(s.structure.type.display.family)} · ${s.structure.type.display.weight}</dd><dt>Body</dt><dd>${esc(s.structure.type.body.family)}</dd><dt>Accent colors</dt><dd>${s.structure.accentSlots}</dd><dt>Texture cap</dt><dd>${s.structure.textureCap}</dd><dt>Motion</dt><dd>${esc(s.structure.motion.easing)} · ${esc(s.structure.motion.duration)}</dd></dl>`
    : `<p>In these rules ${esc(s.en)} is a skin only: it supplies palette, texture, motifs and the illustration medium, and decides neither layout nor type. Used alone, it borrows the Minimalism skeleton; in the mixer you can pick another.</p><p>Default skeleton: ${esc(GRID_EN.minimalism)}. Headings ${esc(S.structure.type.display.family)}, body ${esc(S.structure.type.body.family)}. This is the project's web design translation, not an art-historical classification.</p>`;
  const content = `<article lang="en">
    <header class="article-head"><p class="article-kicker">${esc(s.en)} · ${esc(note.era)}</p><h1>${esc(s.en)} as a web style</h1><p class="article-lede">${esc(note.lede)}</p><a class="btn" href="${mixUrl}" hreflang="zh-CN">Try ${esc(s.en)} in the mixer</a></header>
    <figure class="school-pv">${previewMarkup(template, S, s, imageBase, true)}<figcaption>Web preview: ${esc(S.en)} skeleton × ${esc(s.en)} skin, on the same sample bookshop page the mixer uses. ${structure ? `Layout, type and color all come from ${esc(s.en)}.` : `${esc(s.en)} only brings color, texture and the illustration; the layout comes from ${esc(S.en)}.`}<a href="${mixUrl}" hreflang="zh-CN">Swap the ${structure ? "skin" : "skeleton"} in the mixer</a></figcaption></figure>
    <figure class="article-visual">${imageMarkup(s.id, { imageBase, alt: `AI-generated illustration in the ${s.en} style`, sizes: "(max-width: 640px) calc(100vw - 40px), 900px" })}<figcaption>An AI-generated style sketch, not a copy of a historical work. The hero shows ${esc(s.en)}'s color, texture and motifs; the page layout comes from the skeleton.</figcaption></figure>
    <div class="article-body">
      <section><h2>Meet ${esc(s.en)}</h2><p>${esc(note.intro)}</p></section>
      <section><h2>Where it fits</h2>${list(note.uses)}<p>${esc(note.caution)}</p></section>
      <section><h2>${structure ? "Layout and type on the web" : "How skin and skeleton divide the work"}</h2>${layout}</section>
      <section><h2>${esc(s.en)} color and texture</h2><p>${esc(note.color)}</p><ul class="palette-list">${colors}</ul><p>Texture: ${esc(note.texture)}. The movement's own strength is ${s.texture.level}; in a mix it takes the smaller of that and the skeleton's textureCap. Texture sits on the background only and never covers text.</p><p>The palette passes the project's contrast checks; on a real page, still check each foreground against its actual background.</p></section>
      <section><h2>Hero images and medium</h2><p>Motifs: ${esc(s.motifsEn.join(", "))}.</p><p>Use the medium description below as part of an image prompt, then add a concrete subject. The full prompt with composition and negatives is on the image tab in the mixer.</p><pre>${esc(s.medium)}</pre><p>Texture goes on the page ground; the hero gets its own box and is never a backdrop for body text. Motifs that clash with the skeleton stay in the illustration.</p></section>
      <section><h2>A prompt to start from</h2><p>A scenario example. For the full CSS variables, layout rules and don'ts, install the skill or copy the coding prompt from the <a href="${mixUrl}" hreflang="zh-CN">mixer</a> (in Chinese).</p><pre>${esc(prompt)}</pre></section>
      <section><h2>Pairs worth trying</h2><ul class="mix-recommendations">${recommendations}</ul></section>
      <section><h2>Next</h2><p><a href="${EN_PATHS.guide}">Guide: hand a style to Claude Code, Cursor or v0</a>, or <a href="${EN}#install">install the Agent Skill</a>.</p><div class="related-links">${related}</div><p class="article-provenance">Parameters come from the project's <a href="/skill/schools.json">movement library</a>; pairings are design suggestions, and the <a href="/skill/references/mixing.md">mixing rules</a> decide how a mix works.</p></section>
    </div>
  </article>`;
  return page(template, { title, description, url, en: true, alt: { zh: schoolPath(s.id), en: url }, image: s.id, imageAlt: `AI-generated illustration in the ${s.en} style`, graph: [
    { "@type": "WebPage", url: ORIGIN + url, name: title, description, inLanguage: "en" },
    breadcrumbs(url, `${s.en} web design`, true),
  ] }, `${s.en} web design`, content);
}

function replaceOnce(html, pattern, value) {
  if ([...html.matchAll(new RegExp(pattern.source, "g"))].length !== 1) throw new Error(`页面模板应有且只有一个 ${pattern}`);
  return html.replace(pattern, () => value);
}

export async function buildSite(output) {
  output = path.resolve(output);
  const protectedPaths = [root, ...["site", "skill", "scripts"].map((dir) => path.join(root, dir))];
  if (output === path.parse(output).root || protectedPaths.some((dir) => output === path.resolve(dir)) || root.startsWith(output + path.sep) || ["site", "skill", "scripts"].some((dir) => output.startsWith(path.join(root, dir) + path.sep))) throw new Error("生成目录不能覆盖源码或仓库根目录");
  const data = JSON.parse(await fs.readFile(path.join(root, "skill/schools.json"), "utf8"));
  const byId = Object.fromEntries(data.schools.map((s) => [s.id, s]));
  for (const id of FEATURED_IDS) {
    if (!byId[id] || !schoolNotes[id]) throw new Error(`缺少流派或编辑内容：${id}`);
    for (const related of schoolNotes[id].related) if (!FEATURED_IDS.includes(related)) throw new Error(`尚未发布相关流派：${related}`);
    for (const mix of schoolNotes[id].mixes) if (!byId[mix.s]?.structure || !byId[mix.f]) throw new Error(`无效组合：${mix.s} + ${mix.f}`);
  }
  await fs.mkdir(output, { recursive: true });
  const filter = (source) => path.basename(source) !== ".DS_Store";
  const legacyAssets = path.join(output, "site/assets");
  if ((await fs.stat(legacyAssets).catch(() => null))?.isDirectory()) await fs.cp(legacyAssets, path.join(output, "assets"), { recursive: true, filter });
  await fs.cp(path.join(root, "site"), output, { recursive: true, filter });
  await fs.cp(path.join(root, "skill"), path.join(output, "skill"), { recursive: true, filter });
  await buildSkillPackages(output);
  const assets = await buildAssets(output, data);
  const adsense = ADSENSE_CLIENT ? `  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>\n</head>` : "</head>";
  const publish = (file, html) => {
    const footerAd = adSlotMarkup(ADSENSE_CLIENT, AD_SLOTS.footer, html.includes('<html lang="en"'));
    return fs.writeFile(file, versionPage(html, assets).replace("</head>", adsense).replace('<footer class="colophon">', `${footerAd}<footer class="colophon">`));
  };
  const template = await fs.readFile(path.join(root, "site/index.html"), "utf8");
  let home = template;
  home = replaceOnce(home, /<!-- ad:plates -->/, adSlotMarkup(ADSENSE_CLIENT, AD_SLOTS.plates));
  home = replaceOnce(home, /<link rel="canonical" href="https:\/\/tasteux\.com\/">/, `<link rel="canonical" href="${ORIGIN}${HOME}">\n  ${hreflang}`);
  home = replaceOnce(home, /<div class="skill-versions" id="skill-versions"><\/div>/, `<div class="skill-versions" id="skill-versions">${skillVersionsMarkup()}</div>`);
  home = replaceOnce(home, /<div id="hero-carousel"><\/div>/, `<div id="hero-carousel">${heroMarkup(data.schools, assets.imageBase)}</div>`);
  home = replaceOnce(home, /<div class="skels" id="pick-structure"><\/div>/, `<div class="skels" id="pick-structure">${structurePickerMarkup(data.schools)}</div>`);
  home = replaceOnce(home, /<div class="skins" id="pick-surface"><\/div>/, `<div class="skins" id="pick-surface">${surfacePickerMarkup(data.schools, data.groups, assets.imageBase)}</div>`);
  home = replaceOnce(home, /<div class="skin-groups" id="skin-groups" role="group" aria-label="跳到分组"><\/div>/, `<div class="skin-groups" id="skin-groups" role="group" aria-label="跳到分组">${groupPickerMarkup(data.schools, data.groups)}</div>`);
  for (const role of ["structure", "surface"]) {
    const cards = data.schools.flatMap((s, i) => isStructure(s) === (role === "structure") ? [plateMarkup(s, i, assets.imageBase)] : []).join("\n");
    home = replaceOnce(home, new RegExp(`<div class="plates plates-${role}" id="plates-${role}"></div>`), `<div class="plates plates-${role}" id="plates-${role}">${cards}</div>`);
  }
  home = replaceOnce(home, /<p class="bench-summary">[^<]*<\/p>/, `<p class="bench-summary">网页设计风格与 AI 提示词生成器 · ${data.schools.length} 种艺术流派</p>`);
  home = replaceOnce(home, /<span id="colophon-count"><\/span>/, `<span id="colophon-count">${data.schools.length} 个画派 · 调色板均通过 WCAG AA 对比度校验</span>`);
  const reading = `<a class="reading-item" href="guides/art-movement-web-design/"><h3>使用教程：从流派到 AI 提示词</h3><p>选骨架、配表皮、看预览，再把设计规则交给代码工具。</p></a>` + FEATURED_IDS.map((id) => `<a class="reading-item" href="schools/${id}/"><h3>${esc(byId[id].name)}网页设计</h3><p>${esc(schoolNotes[id].lede)}</p></a>`).join("");
  home = replaceOnce(home, /<div class="reading-list" id="reading-list"><\/div>/, `<div class="reading-list" id="reading-list">${reading}</div>`);
  await publish(path.join(output, "index.html"), home);
  for (const id of FEATURED_IDS) {
    const dir = path.join(output, "schools", id);
    await fs.mkdir(dir, { recursive: true });
    await publish(path.join(dir, "index.html"), schoolPage(template, byId[id], byId, assets.imageBase));
  }
  const description = "用流派混合选择网页布局和配色，生成代码提示词、生图提示词与 DESIGN.md，再交给 Claude Code、Cursor 或 v0。包含包豪斯 × 野兽派示例和检查清单。";
  const guide = page(template, { title: `${GUIDE_TITLE}｜tasteux Style Mix`, description, url: GUIDE, alt: { zh: GUIDE, en: EN_PATHS.guide }, article: true, reading: true, graph: [
    { "@type": "Article", headline: GUIDE_TITLE, description, inLanguage: "zh-CN", mainEntityOfPage: ORIGIN + GUIDE, image: `${ORIGIN}/img/fauvism.jpg`, author: { "@type": "Organization", "@id": `${ORIGIN}/#org`, name: "tasteux", url: ORIGIN + HOME } },
    breadcrumbs(GUIDE, "使用教程"),
  ] }, "使用教程", guideBody(byId));
  const guideDir = path.join(output, "guides/art-movement-web-design");
  await fs.mkdir(guideDir, { recursive: true });
  await publish(path.join(guideDir, "index.html"), guide);
  const privacyDescription = "流派混合不需要注册，工作台在浏览器里计算、不上传选择。本页说明托管、字体、Google AdSense 广告与同意设置，以及安装 Skill 时数据会经过谁。";
  const privacy = page(template, { title: "隐私政策｜tasteux Style Mix", description: privacyDescription, url: PRIVACY, alt: { zh: PRIVACY, en: EN_PATHS.privacy }, reading: true, graph: [
    { "@type": "WebPage", name: "隐私政策", description: privacyDescription, inLanguage: "zh-CN", url: ORIGIN + PRIVACY },
    breadcrumbs(PRIVACY, "隐私政策"),
  ] }, "隐私政策", privacyBody());
  await fs.mkdir(path.join(output, "privacy"), { recursive: true });
  await publish(path.join(output, "privacy/index.html"), privacy);
  const enDescription = "Style Mix mixes two art movements into one web design system: one sets layout, type and motion, the other color, texture and motifs. Exports DESIGN.md, coding and image prompts. Agent skill for Claude Code and Codex.";
  const enHome = page(template, { title: "Style Mix by tasteux: mix two art movements into a web design system", description: enDescription, url: EN, en: true, alt: { zh: HOME, en: EN }, image: "ukiyo-e", imageAlt: "AI-generated illustration in the Ukiyo-e style", graph: [
    { "@type": "WebPage", name: "Style Mix", description: enDescription, inLanguage: "en", url: ORIGIN + EN },
    { "@type": "SoftwareApplication", name: "Style Mix", publisher: { "@type": "Organization", "@id": `${ORIGIN}/#org`, name: "tasteux", url: ORIGIN + HOME }, applicationCategory: "DesignApplication", operatingSystem: "macOS, Linux, Windows", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: ORIGIN + EN },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Style Mix", item: ORIGIN + EN }] },
  ] }, "Style Mix", enHomeBody(data));
  await fs.mkdir(path.join(output, "en"), { recursive: true });
  await publish(path.join(output, "en/index.html"), enHome);
  const aboutDescription = "流派混合（Style Mix）是 tasteux 出品的工具，由 tokensflow 制作，源码公开在 GitHub。本页说明规则和原作从哪里来、是否收费，以及怎样通过 GitHub Issues 联系我们。";
  const about = page(template, { title: "关于｜tasteux Style Mix", description: aboutDescription, url: ABOUT, alt: { zh: ABOUT, en: EN_PATHS.about }, reading: true, graph: [
    { "@type": "AboutPage", name: "关于 tasteux 和流派混合", description: aboutDescription, inLanguage: "zh-CN", url: ORIGIN + ABOUT, mainEntity: { "@id": `${ORIGIN}/#org` } },
    { "@type": "Organization", "@id": `${ORIGIN}/#org`, name: "tasteux", url: ORIGIN + HOME, sameAs: [REPO, "https://github.com/tokensflow"], contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: ISSUES } },
    breadcrumbs(ABOUT, "关于"),
  ] }, "关于", aboutBody(data));
  await fs.mkdir(path.join(output, "about"), { recursive: true });
  await publish(path.join(output, "about/index.html"), about);
  // 英文内容页：教程、流派、关于、隐私，各自和中文页互为 hreflang。
  const enPage = async (url, html) => {
    await fs.mkdir(path.join(output, url), { recursive: true });
    await publish(path.join(output, url, "index.html"), html);
  };
  for (const id of FEATURED_IDS) await enPage(EN_PATHS.school(id), enSchoolPage(template, byId[id], byId, assets.imageBase));
  const enGuideTitle = "How to turn an art movement into a web design and AI prompts";
  const enGuideDescription = "Pick a skeleton for layout and a skin for color, check the split in a comparison preview, then hand DESIGN.md and prompts to Claude Code, Cursor or v0. With a Bauhaus × Fauvism example and a checklist.";
  await enPage(EN_PATHS.guide, page(template, { title: `${enGuideTitle} | tasteux Style Mix`, description: enGuideDescription, url: EN_PATHS.guide, en: true, alt: { zh: GUIDE, en: EN_PATHS.guide }, article: true, reading: true, imageAlt: "AI-generated illustration in the Fauvism style", graph: [
    { "@type": "Article", headline: enGuideTitle, description: enGuideDescription, inLanguage: "en", mainEntityOfPage: ORIGIN + EN_PATHS.guide, image: `${ORIGIN}/img/fauvism.jpg`, author: { "@type": "Organization", "@id": `${ORIGIN}/#org`, name: "tasteux", url: ORIGIN + HOME } },
    breadcrumbs(EN_PATHS.guide, "Guide", true),
  ] }, "Guide", enGuideBody(byId)));
  const enAboutDescription = "Style Mix is a tasteux tool made by tokensflow, with its source public on GitHub. Where the rules and originals come from, whether it costs anything, and how to reach us through GitHub Issues.";
  await enPage(EN_PATHS.about, page(template, { title: "About | tasteux Style Mix", description: enAboutDescription, url: EN_PATHS.about, en: true, alt: { zh: ABOUT, en: EN_PATHS.about }, reading: true, graph: [
    { "@type": "AboutPage", name: "About tasteux and Style Mix", description: enAboutDescription, inLanguage: "en", url: ORIGIN + EN_PATHS.about, mainEntity: { "@id": `${ORIGIN}/#org` } },
    breadcrumbs(EN_PATHS.about, "About", true),
  ] }, "About", enAboutBody(data)));
  const enPrivacyDescription = "Style Mix needs no account and the mixer computes in your browser without uploading anything. Hosting, fonts, Google AdSense ads and consent, and where data goes when you install the skill.";
  await enPage(EN_PATHS.privacy, page(template, { title: "Privacy policy | tasteux Style Mix", description: enPrivacyDescription, url: EN_PATHS.privacy, en: true, alt: { zh: PRIVACY, en: EN_PATHS.privacy }, reading: true, graph: [
    { "@type": "WebPage", name: "Privacy policy", description: enPrivacyDescription, inLanguage: "en", url: ORIGIN + EN_PATHS.privacy },
    breadcrumbs(EN_PATHS.privacy, "Privacy policy", true),
  ] }, "Privacy policy", enPrivacyBody()));
  const pages = [HOME, EN, ...FEATURED_IDS.map(schoolPath), GUIDE, ABOUT, PRIVACY, ...FEATURED_IDS.map(EN_PATHS.school), EN_PATHS.guide, EN_PATHS.about, EN_PATHS.privacy];
  const lastmod = contentDate();
  await fs.writeFile(path.join(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((url) => `  <url><loc>${ORIGIN}${url}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
  await fs.writeFile(path.join(output, "llms.txt"), `# Style Mix（流派混合）by tasteux

> 把两个艺术流派混成一套网页风格：一个管骨架（布局、字体、动效），一个管表皮（配色、质感、母题），每一项只归一个流派管，规则固定，同一组合每次结果一样。输出 DESIGN.md、代码提示词和网页插图用的生图提示词。也是一个 Agent Skill：\`npx skills add tokensflow/tasteux\`。

共 ${data.schools.length} 个流派，其中 ${data.schools.filter(isStructure).length} 个能当骨架。网站：${ORIGIN}${HOME}

## English
- [Style Mix in English](${ORIGIN}${EN}): skeleton and skin, the movements, and how to install the skill
- [Guide: art movement to web design and AI prompts](${ORIGIN}${EN_PATHS.guide})
${FEATURED_IDS.map((id) => `- [${byId[id].en} web design](${ORIGIN}${EN_PATHS.school(id)}): ${enSchoolNotes[id].lede}`).join("\n")}
- [About tasteux and Style Mix](${ORIGIN}${EN_PATHS.about})
- [Privacy policy](${ORIGIN}${EN_PATHS.privacy})

## Skill
- [SKILL.md](${ORIGIN}/skill/SKILL.md): 技能入口和工作流程
- [mixing.md](${ORIGIN}/skill/references/mixing.md): 骨架和表皮怎么分工
- [format.md](${ORIGIN}/skill/references/format.md): DESIGN.md 的格式
- [schools.json](${ORIGIN}/skill/schools.json): 全部流派的颜色、字体、规则和原作出处

## 教程
- [${GUIDE_TITLE}](${ORIGIN}${GUIDE})

## 关于
- [关于 tasteux 和流派混合](${ORIGIN}${ABOUT}): 作者 tokensflow、规则和原作的来源、联系方式（GitHub Issues）
- [隐私政策](${ORIGIN}${PRIVACY}): 工作台不上传、托管、字体、Google AdSense 广告与同意设置

## 流派
${FEATURED_IDS.map((id) => `- [${byId[id].name}网页设计](${ORIGIN}${schoolPath(id)}): ${schoolNotes[id].lede}`).join("\n")}
`);
  await fs.writeFile(path.join(output, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
  if (ADSENSE_CLIENT) await fs.writeFile(path.join(output, "ads.txt"), `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
  await fs.writeFile(path.join(output, "_redirects"), "/site / 301\n/site/ / 301\n/site/* /:splat 301\n");
  return pages;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const output = path.resolve(process.argv[2] ?? path.join(root, ".cache/seo-preview"));
  const pages = await buildSite(output);
  console.log(`已生成 ${pages.length} 个内容页、robots.txt、sitemap.xml 和 llms.txt：${output}`);
}

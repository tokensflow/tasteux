import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FEATURED_IDS, esc, plateMarkup, structurePickerMarkup, surfacePickerMarkup, groupPickerMarkup } from "../site/catalog.mjs";
import { schoolNotes, guideBody, privacyBody, enHomeBody } from "./editorial.mjs";
import { imageMarkup } from "../site/images.mjs";
import { buildAssets, versionPage } from "./assets.mjs";
import { heroMarkup } from "../site/hero.mjs";
import { skillVersionsMarkup } from "../site/install.mjs";
import { buildSkillPackages } from "./skill-packages.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const ORIGIN = "https://tasteux.com";
const HOME = "/";
const GUIDE = "/guides/art-movement-web-design/";
const PRIVACY = "/privacy/";
const EN = "/en/";
// 中英首页互为 hreflang 备选，x-default 指中文首页。
const hreflang = `<link rel="alternate" hreflang="zh-CN" href="${ORIGIN}${HOME}">\n  <link rel="alternate" hreflang="en" href="${ORIGIN}${EN}">\n  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${HOME}">`;
const GUIDE_TITLE = "如何把艺术流派变成网页设计与 AI 提示词";
// Google AdSense 发布商 ID（ca-pub-…）。留空则不输出广告代码和 ads.txt。
const ADSENSE_CLIENT = "";
const isStructure = (s) => s.roles.includes("structure");
const schoolPath = (id) => `${HOME}schools/${id}/`;
const list = (items) => `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
// 页面内容最后一次改动的日期，取自 git 提交；没有 git 历史时不写 lastmod，避免把构建时间当成更新时间。
const CONTENT_SOURCES = ["site", "skill/schools.json", "scripts/editorial.mjs", "scripts/build-site.mjs"];
function contentDate() {
  try { return execFileSync("git", ["log", "-1", "--format=%cs", "--", ...CONTENT_SOURCES], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null; } catch { return null; }
}
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

function seo({ title, description, url, image = "fauvism", imageAlt, graph, article = false, en = false }) {
  const absolute = ORIGIN + url;
  const imageUrl = `${ORIGIN}/img/${image}.jpg`;
  return `<title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${absolute}">${en ? `\n  ${hreflang}` : ""}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="${article ? "article" : "website"}">
  <meta property="og:site_name" content="${en ? "Style Mix" : "流派混合 Style Mix"}">
  <meta property="og:locale" content="${en ? "en_US" : "zh_CN"}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${absolute}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="800">
  <meta property="og:image:alt" content="${esc(imageAlt ?? "野兽派风格的 AI 生成示意图")}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <script type="application/ld+json">${json({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

function breadcrumbs(url, name) {
  return { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "流派混合", item: ORIGIN + HOME },
    { "@type": "ListItem", position: 2, name, item: ORIGIN + url },
  ] };
}

function page(template, metadata, name, content) {
  const en = metadata.en;
  const assets = template.match(/<link rel="preconnect"[\s\S]*?<link rel="stylesheet" href="preview.css">/)[0]
    .replace('href="style.css"', 'href="/style.css"').replace('href="preview.css"', 'href="/preview.css"');
  return `<!doctype html>
<html lang="${en ? "en" : "zh-CN"}" class="doc">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${seo(metadata)}
  ${assets}
</head>
<body>
  <div class="pv doc-tex" data-texture="paper" aria-hidden="true"><div class="pv-tex"></div></div>
  <a class="skip" href="#article">${en ? "Skip to content" : "跳到正文"}</a>
  <header class="bar"><a class="brand" href="/">流派混合 <em lang="en">Style Mix</em></a><nav aria-label="${en ? "Pages" : "页面"}">${en ? `<a href="#install">Install</a><a href="/" hreflang="zh-CN" lang="zh-CN">中文</a>` : `<a href="/#workbench">混合</a><a href="/#plates">图鉴</a><a href="${GUIDE}">教程</a><a href="${EN}" hreflang="en" lang="en">English</a>`}</nav></header>
  <main class="article-page" id="article">
    ${en ? "" : `<nav class="breadcrumbs" aria-label="面包屑"><a href="/">流派混合</a><span aria-hidden="true"> / </span><span aria-current="page">${esc(name)}</span></nav>`}
    ${content}
  </main>
  ${en ? `<footer class="colophon"><span>Style Mix</span><a href="/" hreflang="zh-CN" lang="zh-CN">中文版</a><a href="https://github.com/tokensflow/tasteux">GitHub</a><a href="${PRIVACY}" hreflang="zh-CN">Privacy (in Chinese)</a></footer>` : `<footer class="colophon"><span>流派混合 <em lang="en">Style Mix</em></span><a href="${GUIDE}">使用教程</a><a href="/#install">安装 Agent 技能</a><a href="/skill/schools.json">流派数据</a><a href="${PRIVACY}">隐私政策</a></footer>`}
</body>
</html>
`;
}

function schoolPage(template, s, byId, imageBase) {
  const note = schoolNotes[s.id];
  const S = isStructure(s) ? s : byId.minimalism;
  const url = schoolPath(s.id);
  const title = `${s.name}网页设计：配色、${isStructure(s) ? "布局" : "质感"}与 AI 提示词｜流派混合`;
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
    <header class="article-head"><p class="article-kicker">${esc(s.en)} · ${esc(s.era)}</p><h1>${esc(s.name)}怎样变成网页风格</h1><p class="article-lede">${esc(note.lede)}</p><a class="btn" href="${mixUrl}">在工作台试用${esc(s.name)} →</a></header>
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
  return page(template, { title, description, url, image: s.id, imageAlt: `${s.name}风格的 AI 生成示意图`, graph: [
    { "@type": "WebPage", url: ORIGIN + url, name: title, description, inLanguage: "zh-CN" },
    breadcrumbs(url, `${s.name}网页设计`),
  ] }, `${s.name}网页设计`, content);
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
  const publish = (file, html) => fs.writeFile(file, versionPage(html, assets).replace("</head>", adsense));
  const template = await fs.readFile(path.join(root, "site/index.html"), "utf8");
  let home = template;
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
  const guide = page(template, { title: `${GUIDE_TITLE}｜流派混合`, description, url: GUIDE, article: true, graph: [
    { "@type": "Article", headline: GUIDE_TITLE, description, inLanguage: "zh-CN", mainEntityOfPage: ORIGIN + GUIDE, image: `${ORIGIN}/img/fauvism.jpg`, author: { "@type": "Organization", name: "Style Mix", url: ORIGIN + HOME } },
    breadcrumbs(GUIDE, "使用教程"),
  ] }, "使用教程", guideBody(byId));
  const guideDir = path.join(output, "guides/art-movement-web-design");
  await fs.mkdir(guideDir, { recursive: true });
  await publish(path.join(guideDir, "index.html"), guide);
  const privacyDescription = "流派混合不需要注册，工作台在浏览器里计算、不上传选择。本页说明托管、字体、广告和安装 Skill 时数据会经过谁。";
  const privacy = page(template, { title: "隐私政策｜流派混合 Style Mix", description: privacyDescription, url: PRIVACY, graph: [
    { "@type": "WebPage", name: "隐私政策", description: privacyDescription, inLanguage: "zh-CN", url: ORIGIN + PRIVACY },
    breadcrumbs(PRIVACY, "隐私政策"),
  ] }, "隐私政策", privacyBody());
  await fs.mkdir(path.join(output, "privacy"), { recursive: true });
  await publish(path.join(output, "privacy/index.html"), privacy);
  const enDescription = "Style Mix mixes two art movements into one web design system: one sets layout, type and motion, the other color, texture and motifs. Exports DESIGN.md, coding and image prompts. Agent skill for Claude Code and Codex.";
  const enHome = page(template, { title: "Style Mix: mix two art movements into a web design system", description: enDescription, url: EN, en: true, image: "ukiyo-e", imageAlt: "AI-generated illustration in the Ukiyo-e style", graph: [
    { "@type": "WebPage", name: "Style Mix", description: enDescription, inLanguage: "en", url: ORIGIN + EN },
    { "@type": "SoftwareApplication", name: "Style Mix", applicationCategory: "DesignApplication", operatingSystem: "macOS, Linux, Windows", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: ORIGIN + EN },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Style Mix", item: ORIGIN + EN }] },
  ] }, "Style Mix", enHomeBody(data));
  await fs.mkdir(path.join(output, "en"), { recursive: true });
  await publish(path.join(output, "en/index.html"), enHome);
  const pages = [HOME, EN, ...FEATURED_IDS.map(schoolPath), GUIDE];
  const lastmod = contentDate();
  await fs.writeFile(path.join(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((url) => `  <url><loc>${ORIGIN}${url}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
  await fs.writeFile(path.join(output, "llms.txt"), `# Style Mix（流派混合）

> 把两个艺术流派混成一套网页风格：一个管骨架（布局、字体、动效），一个管表皮（配色、质感、母题），每一项只归一个流派管，规则固定，同一组合每次结果一样。输出 DESIGN.md、代码提示词和网页插图用的生图提示词。也是一个 Agent Skill：\`npx skills add tokensflow/tasteux\`。

共 ${data.schools.length} 个流派，其中 ${data.schools.filter(isStructure).length} 个能当骨架。网站：${ORIGIN}${HOME}

## English
- [Style Mix in English](${ORIGIN}${EN}): skeleton and skin, the movements, and how to install the skill

## Skill
- [SKILL.md](${ORIGIN}/skill/SKILL.md): 技能入口和工作流程
- [mixing.md](${ORIGIN}/skill/references/mixing.md): 骨架和表皮怎么分工
- [format.md](${ORIGIN}/skill/references/format.md): DESIGN.md 的格式
- [schools.json](${ORIGIN}/skill/schools.json): 全部流派的颜色、字体、规则和原作出处

## 教程
- [${GUIDE_TITLE}](${ORIGIN}${GUIDE})

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

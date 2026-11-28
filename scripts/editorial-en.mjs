// 英文版内容页（/en/…）的正文。每页对应一个中文页，事实以 skill/schools.json 为准；
// 工作台界面和它导出的代码提示词、DESIGN.md 目前只有中文，英文页都如实说明。
import { esc } from "../site/catalog.mjs";
import { ISSUES, REPO, PRIVACY_UPDATED, ABOUT_UPDATED } from "./editorial.mjs";

export const EN_PATHS = {
  home: "/en/",
  guide: "/en/guides/art-movement-web-design/",
  about: "/en/about/",
  privacy: "/en/privacy/",
  school: (id) => `/en/schools/${id}/`,
};

// 示例书店页（#pv-tpl）的英文文案，用在英文流派页的网页预览里。
export const SAMPLE_EN = [
  ["新书", "New"], ["活动", "Events"], ["会员", "Members"],
  ["独立书店 · 2026 秋", "Independent bookshop · Autumn 2026"],
  ["每周三晚上，我们关掉一半的灯，只留下书和读书的人。", "Every Wednesday night we switch off half the lights and leave the books to the readers."],
  ["预约到店", "Book a visit"],
  ["本周新书", "New this week"], ["从诗集到菜谱，店员每周亲手挑选。", "Poetry to cookbooks, picked by hand every week."],
  ["周三", "Wed"], ["夜读会", "Night reading"], ["二十个座位，一本书，读到打烊。", "Twenty seats, one book, read until closing."],
  ["¥99", "$15"], ["年度会员", "Membership"], ["全年九折，生日送一本店员推荐。", "10% off all year and a staff pick on your birthday."],
  ["上海 · 徐汇区 · 每天 10:00–22:00", "Shanghai · Xuhui · Open daily 10:00–22:00"],
];

// 英文页用到的骨架网格，一句话。
export const GRID_EN = {
  bauhaus: "a 12-column modular grid; every element sits on a column line",
  memphis: "a loose collage; elements deliberately offset and tilted 2–6°",
  "art-deco": "strict central symmetry; content centred and mirrored left and right",
  dunhuang: "horizontal registers; full-width bands, with content repeated side by side inside each band",
  minimalism: "a single left-aligned column, body text no wider than 60 characters",
};

export const enSchoolNotes = {
  bauhaus: {
    era: "1919–1933 · Germany",
    lede: "Organise content with a modular grid, primitive shapes and a clear type hierarchy, then decide whether to keep the primaries.",
    subject: "an independent bookshop",
    intro: "Walter Gropius founded the Bauhaus in Weimar in 1919 as a school that joined art, craft and industry. It held that form follows function and built order out of type, flat color and the circle, square and triangle.",
    uses: ["Landing pages for bookshops, cafés and cultural projects: put the introduction, events and booking into modules of different sizes.", "Portfolios and product pages: let headings, rules and images carry the hierarchy, without rounded cards."],
    caution: "Use shapes to group content and mark navigation, and no more than that. Long reading still needs a comfortable measure. Swap the skin and the primaries go, but the grid and type scale stay.",
    layout: "Huge left-aligned headings, sometimes turned 90° along the edge. Circles, squares and triangles divide the page. Color blocks carry content directly, so there are no shadows; 4–8px black bars separate sections. No corner radius and no outlines.",
    color: "Each primary is a solid field that holds content or a shape. Black is only for thick dividers and text, never for outlines.",
    texture: "fine lithographic grain, barely visible",
    mixes: [
      { s: "bauhaus", f: "fauvism", why: "Keep the modules and Jost headings, and let Fauvism's colors bring the mood. Texture stays under the Bauhaus cap, so brushwork never gets in the way of reading." },
      { s: "bauhaus", f: "ukiyo-e", why: "Geometric modules carry a woodblock hero image and palette. Waves and pine branches stay in the illustration; they don't redraw buttons and cards." },
    ],
    related: ["fauvism", "ukiyo-e", "memphis"],
  },
  memphis: {
    era: "1981–1987 · Italy",
    lede: "Clashing color, offset blocks and hard shadows for event pages, with body text still in a clear reading order.",
    subject: "a weekend craft market",
    intro: "Memphis was the group Ettore Sottsass gathered in Milan at the end of 1980; its first show was in 1981 and its name came from a Bob Dylan song. It rejected modernist good taste with clashing colors, squiggles and cheap laminates.",
    uses: ["Craft markets, gigs and limited drops: offset modules and big headings make a lively entrance.", "Short pages for young brands: keep the playful shapes to the hero and a few highlight blocks."],
    caution: "Don't turn every piece of information into a shape fighting for attention. Dense tables, long explanations and serious decisions need scanning and reading first, so offset them less.",
    layout: "Cards get a 3px black outline and a 6px hard shadow with no blur. Cards tilt slightly, neighbours in opposite directions. Squiggles, dots and triangle fragments scatter across the background; square corners and full pills mix.",
    color: "Pink, cyan and yellow clash; blocks don't need to agree with each other. Every color block gets a black outline.",
    texture: "sparse large dots and scattered pattern",
    mixes: [
      { s: "memphis", f: "fauvism", why: "Offset layout, hard shadows and Fauvist color push the festival mood. Body text stays on a calm ground; brushwork only appears in the background and illustrations." },
      { s: "bauhaus", f: "memphis", why: "To keep Memphis color and motifs without a jumpy layout, use the Bauhaus skeleton: everything sits on the grid, and Memphis only supplies color and shapes." },
    ],
    related: ["bauhaus", "fauvism", "art-deco"],
  },
  "art-deco": {
    era: "1920s–1930s · France / USA",
    lede: "Central axes, stepped layers and fine rules for cover pages and section rhythm: theatres, exhibitions and brand stories.",
    subject: "a small theatre production",
    intro: "Art Deco takes its name from the 1925 Paris exhibition of decorative arts and flourished between the wars. It joined machine-age streamlining with classical symmetry, on skyscrapers, posters and ocean liners.",
    uses: ["Theatre, exhibition and cultural event pages: title, date and call to action on one axis make a poster-like first screen.", "Boutique hotels and brand stories: fine rules, space and section rhythm instead of generic shadowed cards."],
    caution: "Symmetry doesn't replace hierarchy. Keep decorative rules few and purposeful. Thin display faces can't carry small captions; set body text in the library's body face.",
    layout: "Every section is centred inside a double-rule frame. The heading area steps up in layers; sunburst or fan patterns divide sections. Headings are all caps with wide tracking. 1px gold rules, no radius, no shadows.",
    color: "Light text on a dark ground. Gold is only for fine rules, frames and the call to action; emerald is a small accent.",
    texture: "fine vertical lines, like brushed metal",
    mixes: [
      { s: "art-deco", f: "dunhuang", why: "The axis and layers keep Deco's order; mineral colors and mural texture come from Dunhuang. Motifs stay in the illustration, and the skeleton's cap thins the texture." },
      { s: "art-deco", f: "fauvism", why: "Keep the symmetrical layout with a louder skin. A new palette is no reason to let elements drift off the axis." },
    ],
    related: ["dunhuang", "bauhaus", "fauvism"],
  },
  "ukiyo-e": {
    era: "17th–19th century · Edo Japan",
    lede: "Woodblock color, outlines and landscape motifs for the hero image, with a clear skeleton chosen separately for the page.",
    subject: "a travel bookshop",
    intro: "Ukiyo-e are the genre pictures of Edo-period Japan, best known as woodblock prints of city life, kabuki and landscape. Hokusai's Under the Wave off Kanagawa printed its wave in Prussian blue and later influenced the French Impressionists.",
    uses: ["Travel, bookshop and cultural pages: a landscape illustration sets the mood, with body text on clean color fields.", "Posters and event heroes: flat color, outlines and a limited palette, plus a specific composition."],
    caution: "Ukiyo-e has no web grid of its own here. Don't press the whole page onto a wave picture, and don't turn every button into a pattern. When you need exact lettering, set the type after the image is generated.",
    color: "Prussian blue for the main fields and the call to action, vermilion only as small seal-like marks, ochre for secondary panels.",
    texture: "washi fibres with a woodblock pressing",
    mixes: [
      { s: "minimalism", f: "ukiyo-e", why: "Minimalism's space and single focus hold one hero image. Fewer accents and lighter texture leave the complexity to the picture." },
      { s: "bauhaus", f: "ukiyo-e", why: "A modular grid lays out events and books; the skin brings woodblock color and the hero. The image never changes the modules." },
    ],
    related: ["bauhaus", "dunhuang", "art-deco"],
  },
  dunhuang: {
    era: "4th–14th century · Gansu, China",
    lede: "Mineral color, weathered walls and flowing ribbons for cultural pages, with the reading area kept clean.",
    subject: "a cultural exhibition",
    intro: "The murals of the Mogao Caves at Dunhuang were painted from the 4th to the 14th century. Mineral pigments on clay walls have shifted and flaked over a thousand years, leaving weathered apsaras, caisson ceilings and narrative scenes.",
    uses: ["Exhibitions and feature pages: mineral colors and one mural-style hero set the theme while the information area stays steady.", "Cultural events and illustration: name a clear subject and keep ribbons and lotuses in the picture, not behind body text."],
    caution: "AI images here are style sketches, not records of real murals or artefacts. The weathered texture must never cover text, and intricate motifs can't do the job of navigation, buttons or icons.",
    layout: "The page is a stack of full-width registers divided by thin colored rules or a narrow ornamental band. Inside each band, similar items repeat side by side at equal spacing. One central subject per screen sits in a round halo; a narrow frieze of small figures runs along the bottom.",
    color: "An ochre wall for the ground, earth red for the main color and the call to action, azurite and malachite in pairs on patterns and secondary panels. Every color is slightly faded.",
    texture: "weathered mural plaster, patchy and grainy",
    mixes: [
      { s: "minimalism", f: "dunhuang", why: "When an exhibition has a lot to explain, a restrained structure lightens the load; Minimalism's cap thins the mural texture." },
      { s: "art-deco", f: "dunhuang", why: "For a poster-like cover, centre the title and entry points on the axis, while color and illustration still come from Dunhuang." },
    ],
    related: ["art-deco", "ukiyo-e", "bauhaus"],
  },
  fauvism: {
    era: "1905–1910 · France",
    lede: "Strong color fields and brushwork carry the mood; a skeleton with rules handles the layout.",
    subject: "a café",
    intro: "Fauvism appeared at the 1905 Salon d'Automne in Paris, where a critic called its painters wild beasts for their color. Matisse and Derain led it: color stopped imitating nature and expressed feeling directly.",
    uses: ["Cafés, art events and short brand pages: strong color marks entry points and groups, with no need for realistic photos.", "Expressive poster heroes: give a concrete subject and let color relationships matter more than realistic light."],
    caution: "Fauvism only provides color, texture and illustration; the skeleton decides the layout. Put the strongest colors in accent positions, as many as the skeleton allows, and still check text contrast against its background.",
    color: "Complementaries clash directly: a vermilion call to action on an emerald panel. Deep violet replaces black for text; cobalt draws outlines.",
    texture: "coarse brushstroke patches, colors bumping into each other",
    mixes: [
      { s: "bauhaus", f: "fauvism", why: "The first pair on the homepage carousel: the geometric grid brings order and Fauvism brings color and the hero. Change only the skin and watch layout and type stay put." },
      { s: "minimalism", f: "fauvism", why: "One accent and lighter texture make a loud skin restrained. The palette itself doesn't change, and no extra grey is added." },
    ],
    related: ["bauhaus", "memphis", "art-deco"],
  },
};

export function enGuideBody(byId) {
  const S = byId.bauhaus;
  const F = byId.fauvism;
  const school = (id, label) => `<a href="${EN_PATHS.school(id)}">${esc(label ?? byId[id].en)}</a>`;
  const example = `Build a responsive landing page for an independent bookshop, with the structure of ${S.en} and the color and texture of ${F.en}.\nKeep the existing tech stack and the real copy.\nUse the DESIGN.md I give you next for layout, fonts and CSS variables.\nDon't put the hero image under body text; keep focus rings and check the contrast of body text and buttons.`;
  return `<article lang="en">
    <header class="article-head"><p class="article-kicker">Guide · web design and AI prompts</p><h1>How to turn an art movement into a web design and AI prompts</h1><p class="article-lede">Pick a skeleton for the layout, then a skin for the color. Check in the comparison preview that each does its own job, then hand the rules to your coding or image tool.</p><a class="btn" href="/#mix=bauhaus+fauvism" hreflang="zh-CN">Start with Bauhaus × Fauvism</a></header>
    <div class="article-body">
      <section><h2>What the tool does</h2><p>Style Mix turns the traits of art movements into web design rules. The mixer runs entirely in your browser and calls no model; you paste the results into Claude Code, Cursor, v0 or an image generator.</p><p>The skeleton owns layout, type, corners, borders, shadows and motion. The skin owns the palette, texture, motifs and the medium of the illustrations. Each dimension belongs to one side only; the two styles are never averaged.</p><p>The mixer's interface, and the coding prompt and DESIGN.md it exports, are in Chinese for now; the image prompt is in English. If you work in English, <a href="${EN_PATHS.home}#install">install the skill</a> and your agent will write the same rules in English.</p></section>
      <section><h2>1. Pick a skeleton: how content is arranged</h2><p>In the <a href="/#workbench" hreflang="zh-CN">mixer</a>, compare the black-and-white wireframes: grid, diagonal, axis or modules. Ignore color for now. Is your page a short brand story, an event landing page, or something that needs clear grouping?</p><p>${school("bauhaus")} organises content in modules, ${school("memphis")} is offset and playful, ${school("art-deco")} works with a central axis and layers. A skeleton here describes web design rules, not a whole chapter of art history.</p></section>
      <section><h2>2. Pick a skin: color and imagery</h2><p>Choose color, brushwork and subject from the image cards. ${school("fauvism")} lets color carry emotion, ${school("ukiyo-e")} brings woodblock printing, ${school("dunhuang", "Dunhuang murals")} bring mineral pigment and weathered walls.</p><p>Ukiyo-e and Fauvism are skin only in this tool: they have no web layout of their own. To use one alone, borrow the Minimalism skeleton; “Ukiyo-e × Fauvism” is not two interchangeable skeletons. Dunhuang works both ways: as a skeleton it is a stack of full-width bands, as a skin it only gives color and texture.</p></section>
      <section><h2>3. Open the comparison and check which layer changed</h2><p>Change one side at a time, then open the comparison. Swapping the skeleton should change layout and type; swapping the skin should change palette and hero image while the skeleton's layout rules stay.</p><p>The skeleton limits some color and texture: only its first accentSlots accent colors are used, and texture strength is the smaller of the skin's level and the skeleton's textureCap. A strong skin can come out softer.</p></section>
      <section><h2>Example: how Bauhaus × Fauvism divide the work</h2><dl class="article-facts"><dt>Skeleton</dt><dd>${esc(GRID_EN.bauhaus)}</dd><dt>Type</dt><dd>Headings ${esc(S.structure.type.display.family)}; body ${esc(S.structure.type.body.family)}</dd><dt>Color</dt><dd>${esc(enSchoolNotes.fauvism.color)}</dd><dt>Accents</dt><dd>${S.structure.accentSlots}, set by Bauhaus</dd><dt>Texture</dt><dd>${esc(enSchoolNotes.fauvism.texture)}; ${F.texture.level}, capped at ${S.structure.textureCap} by the skeleton, so ${Math.min(F.texture.level, S.structure.textureCap)}</dd></dl><p>Words like “black bars” or “white cells” in a skeleton's rules name roles, not colors to keep. In a mix, lines use the skin's line color, text uses ink and the ground uses bg. When a motif clashes with the layout, it stays in the illustration.</p></section>
      <section><h2>4. Hand the rules to your coding tool</h2><ol><li>Copy the full prompt from the coding tab. For an existing project, say what the stack is, what the page is for, and give the real copy.</li><li>To keep iterating, or to share the rules between tools, download DESIGN.md and treat it as the spec for the page.</li><li>When the page is built, check that layout and type come from the skeleton and color from the skin, not just whether it “looks like” the movement.</li></ol><pre>${esc(example)}</pre><p>The full prompt in the mixer includes the actual CSS variables, fonts, layout rules and don'ts. This short example only shows how to ask.</p></section>
      <section><h2>5. Need images? Copy the image prompt</h2><p>Switch to the image tab, describe a concrete subject and scene, then copy the English prompt. “A nice artistic picture” doesn't say what to draw.</p><p>For example: <code>a quiet independent bookstore on a rainy evening, books visible through the window</code>. The pair fills in movement, medium, composition, palette and motifs. Don't add artist names, and don't ask the image to carry text that needs exact typesetting.</p><p>Check generated images for stray text, numbers and watermarks. The hero images on this site are AI-generated style sketches, not historical works; for art history or artefacts, use reliable sources.</p></section>
      <section><h2>HTML, DESIGN.md or the skill?</h2><p>The sample bookshop HTML gives you a page that opens as is: hero embedded, layout done, but with demo copy to replace. Google Fonts still need a connection; offline it falls back to system fonts.</p><p>DESIGN.md fits an existing project and doesn't ask you to change frameworks. If you want your agent to use the same library every time, <a href="${EN_PATHS.home}#install">install the skill</a>. Generating prompts needs no API key; accounts and costs for outside models are up to those services.</p></section>
      <section><h2>Checklist before you ship</h2><ul><li>Clear hierarchy: headings, body and calls to action don't compete.</li><li>No horizontal overflow on phones; readable measure and size.</li><li>Texture only on the ground; the hero sits in its own box, never behind body text.</li><li>Body text at least 4.5:1 against its background; check text on accent colors pair by pair.</li><li>Visible keyboard focus, feedback on buttons, motion that respects prefers-reduced-motion.</li><li>The coding tool hasn't added corners, shadows or layouts the skeleton doesn't allow.</li></ul></section>
      <section><h2>Keep exploring</h2><div class="related-links">${school("bauhaus", "Bauhaus web design")}${school("fauvism", "Fauvism color and prompts")}${school("ukiyo-e", "Ukiyo-e hero images and prompts")}</div><p class="article-provenance">This guide explains this project's design translation and how to use it. Parameters come from the <a href="/skill/schools.json">movement library</a>; who owns which dimension, texture caps and don'ts follow the <a href="/skill/references/mixing.md">mixing rules</a> (both in Chinese).</p></section>
    </div>
  </article>`;
}

export function enAboutBody(data) {
  const skeletons = data.schools.filter((s) => s.roles.includes("structure")).length;
  return `<article lang="en">
    <header class="article-head"><p class="article-kicker">About · updated <time datetime="${ABOUT_UPDATED}">${ABOUT_UPDATED}</time></p><h1>About tasteux and Style Mix</h1><p class="article-lede">tasteux makes design tools about taste. Style Mix is its first product: it mixes two art movements into one web style, one as the skeleton and one as the skin, by fixed rules. It is a web tool and an Agent Skill for Claude Code and Codex.</p><a class="btn" href="${ISSUES}">Open an issue on GitHub</a></header>
    <div class="article-body">
      <section><h2>Who makes it</h2><p>tasteux is made and maintained by <a href="https://github.com/tokensflow">tokensflow</a>; the site is tasteux.com. The Agent Skill is still called style-mix and the install command is unchanged. All source for the site and the skill is public in the <a href="${REPO}">tokensflow/tasteux repository</a>.</p></section>
      <section><h2>Where the rules come from</h2><p>Colors, fonts, layout rules and don'ts for all ${data.schools.length} movements live in one data file, <a href="/skill/schools.json">schools.json</a>; ${skeletons} of them can be a skeleton. The mixing method is in <a href="/skill/references/mixing.md">mixing.md</a>: each dimension belongs to one movement, nothing is averaged.</p><p>The originals shown next to each movement are public-domain works, captioned with artist, date, collection and license. We learn a movement's rules and don't copy famous compositions; image prompts name the movement, never an artist.</p><p>The site follows the same rules: its shell is Constructivism × Ukiyo-e, and every redesign is checked with the skill's browser check at 1440 and 390 px.</p></section>
      <section><h2>Does it cost anything?</h2><p>The tool and the skill are free. The site shows Google AdSense ads to cover its costs; see the <a href="${EN_PATHS.privacy}">privacy policy</a> for how data is handled.</p></section>
      <section id="contact"><h2>Contact</h2><p>Questions, suggestions, mistakes in the movement data, or doubts about an original's source or license: please open a <a href="${ISSUES}">GitHub issue</a>. We don't take contact by email.</p></section>
    </div>
  </article>`;
}

export function enPrivacyBody() {
  return `<article lang="en">
    <header class="article-head"><p class="article-kicker">Privacy policy · updated <time datetime="${PRIVACY_UPDATED}">${PRIVACY_UPDATED}</time></p><h1>Privacy policy</h1><p class="article-lede">Style Mix needs no account and doesn't collect your choices in the mixer. This page says which data passes through whom when you visit.</p></header>
    <div class="article-body">
      <section><h2>The mixer uploads nothing</h2><p>Picking a skeleton and a skin, and generating prompts and DESIGN.md, all happen in your browser. Nothing calls a model or goes to our server. A shared mix is written after the <code>#</code> in the URL, and that part is never sent with the request.</p><p>The site itself sets no cookies, uses no localStorage and has no visitor analytics. When you press copy, the browser only writes text to your clipboard.</p></section>
      <section><h2>Hosting: Cloudflare</h2><p>The site is hosted on Cloudflare. As with any website, each request shows Cloudflare your IP address, browser identifier and the URL, so it can deliver and cache pages and block attacks. See the <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare privacy policy</a>.</p></section>
      <section><h2>Fonts: Google Fonts</h2><p>Fonts for the pages and previews load from Google Fonts. Your browser requests the files from Google's servers directly, so Google sees your IP address. See the <a href="https://policies.google.com/privacy">Google privacy policy</a>.</p></section>
      <section id="ads"><h2>Ads: Google AdSense</h2><p>The site shows Google AdSense ads to cover its costs; the tool and the skill are free. Ads appear only in fixed places (the middle of the catalogue on the Chinese homepage and above the footer), each labelled “Advertisement”; the first screen and the mixer carry no ads. Every page loads Google's ad script (<code>adsbygoogle.js</code>). Google and its partners may use cookies and similar technology to show ads based on your visits to this and other sites, and to count impressions and clicks. Google processes this data; we can't see your individual records.</p><p>You can turn off personalised ads in <a href="https://adssettings.google.com/">Google Ad Settings</a>, or opt out of third-party vendors' personalised-ad cookies at <a href="https://www.aboutads.info/choices/">aboutads.info</a>. How Google uses data from partner sites is explained on <a href="https://policies.google.com/technologies/partner-sites">this page</a>.</p><p>Visitors from the European Economic Area, the UK and Switzerland first see a Google-certified consent message and choose whether to allow personalised ads; without consent only non-personalised or limited ads are shown. To change your mind later: once the consent message has loaded, a “Change ad consent” button appears below; you can also clear tasteux.com's cookies in your browser and you'll be asked again on your next visit.</p><p><button class="btn" type="button" id="ad-consent" hidden>Change ad consent</button></p><script>(function () { var b = document.getElementById("ad-consent"); window.googlefc = window.googlefc || {}; window.googlefc.callbackQueue = window.googlefc.callbackQueue || []; window.googlefc.callbackQueue.push({ CONSENT_API_READY: function () { b.hidden = false; b.onclick = function () { window.googlefc.showRevocationMessage(); }; } }); })();</script></section>
      <section><h2>Installing the skill</h2><p>With <code>npx skills add</code>, files download from GitHub; with curl or the ZIP, they download from this site and leave only the Cloudflare request records described above. Once installed, the skill runs on your own computer and never sends us your project or conversations.</p></section>
      <section><h2>Images</h2><p>The originals on the homepage and in the catalogue are public-domain works stored on this site, not loaded from museum websites. Collection links in captions only open when you click them.</p></section>
      <section id="contact"><h2>Contact</h2><p>For questions about this policy or your data, please open a <a href="${ISSUES}">GitHub issue</a>. The site is maintained by <a href="${EN_PATHS.about}">tokensflow</a>. We don't take contact by email.</p></section>
      <section><h2>Changes</h2><p>When this policy changes, the date at the top of this page is updated.</p></section>
    </div>
  </article>`;
}

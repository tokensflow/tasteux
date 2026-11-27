import { esc } from "../site/catalog.mjs";

export const schoolNotes = {
  bauhaus: {
    lede: "用模块网格、几何形和清晰的字体层级组织信息，再决定是否保留三原色。",
    subject: "一家独立书店",
    uses: ["书店、咖啡店或文化项目的落地页：把介绍、活动与预约入口放进有比例差异的模块。", "作品集与产品介绍：让标题、分隔线和图像共同建立层级，不依赖圆角卡片。"],
    caution: "几何形用来分组和标出导航，够用即可。长篇正文仍需舒服的行宽；换表皮后三原色可以替换，网格和字体层级保持不变。",
    mixes: [
      { s: "bauhaus", f: "fauvism", why: "保留模块布局与 Jost 标题，用野兽派的颜色增加情绪。质感仍受包豪斯上限约束，不让粗笔触影响阅读。" },
      { s: "bauhaus", f: "ukiyo-e", why: "让几何模块承载木版画式主视觉与配色。海浪和松枝留在插图里，不拿它们重画按钮与卡片。" },
    ],
    related: ["fauvism", "ukiyo-e", "memphis"],
  },
  memphis: {
    lede: "把撞色、错位与硬投影用于活动页面，正文仍按清楚的阅读层级排列。",
    subject: "一个周末创意市集",
    uses: ["创意市集、音乐活动与限定企划：用偏移模块和大标题建立活跃的入口。", "年轻品牌的短篇介绍页：把俏皮图形集中在主视觉与少量强调区块。"],
    caution: "不要把所有信息都做成争抢注意力的图形。密集表格、长篇说明和需要严肃决策的流程应优先保证扫描与阅读，少用错位。",
    mixes: [
      { s: "memphis", f: "fauvism", why: "错位布局、硬投影与野兽派用色一起强化活动气氛；正文仍放在稳定底色上，画面笔触只出现在背景和插图。" },
      { s: "bauhaus", f: "memphis", why: "想留下孟菲斯的颜色与母题，又不想让布局太跳，可以换成包豪斯骨架：排版全部按包豪斯网格，孟菲斯只提供颜色与几何母题。" },
    ],
    related: ["bauhaus", "fauvism", "art-deco"],
  },
  "art-deco": {
    lede: "用中轴、层叠和细线组织封面与分段节奏，适合剧场、展览和品牌故事页。",
    subject: "一场小剧场演出",
    uses: ["剧场、展览和文化活动页：把标题、日期与行动入口沿中轴组织，形成海报般的第一屏。", "精品旅宿或品牌故事页：用细线、留白与分段节奏代替通用阴影卡片。"],
    caution: "对称不能替代信息层级。装饰线应少而有目的；细体标题和窄字形不适合承担小字号说明，正文应使用流派库中的正文字体。",
    mixes: [
      { s: "art-deco", f: "dunhuang", why: "中轴与层叠保持装饰艺术的秩序，矿物色和壁画质感来自敦煌。母题作为插图使用，质感必须被骨架上限调淡。" },
      { s: "art-deco", f: "fauvism", why: "保留对称版面，改用更强烈的表皮颜色；不要因为更换色彩就让元素失去中轴关系。" },
    ],
    related: ["dunhuang", "bauhaus", "fauvism"],
  },
  "ukiyo-e": {
    lede: "把木版套色、轮廓线和风景母题带进主视觉，页面结构另选一副清楚的骨架。",
    subject: "一家旅行主题书店",
    uses: ["旅行、书店与文化主题页面：用风景插图建立气氛，把正文放在干净的色面上。", "海报与活动主视觉：以平涂、轮廓线和有限色彩表达主题，再补具体构图要求。"],
    caution: "浮世绘在这里不提供网页网格。不要把整页内容压在巨浪图片上，也不要让每个按钮都变成装饰图案；需要精确文字时，应在生成图片之后排字。",
    mixes: [
      { s: "minimalism", f: "ukiyo-e", why: "用极简主义的留白和单一焦点容纳一张主视觉；减少强调色和质感强度，把复杂性留给图像。" },
      { s: "bauhaus", f: "ukiyo-e", why: "用模块网格安排活动和图书信息，表皮提供木版画的颜色与主视觉。图像不改变模块的结构。" },
    ],
    related: ["bauhaus", "dunhuang", "art-deco"],
  },
  dunhuang: {
    lede: "借矿物色、壁面斑驳与飘带母题做文化主题页，正文区保持干净易读。",
    subject: "一个文化展览",
    uses: ["文化展览与专题页：以矿物色和单张壁画风格主视觉表达主题，信息区保持稳定。", "文创活动与图像创作：明确画面主体，把飘带、莲花等母题用于插图，而非正文背景。"],
    caution: "AI 图像只是风格示意，不应当作真实壁画或文物资料。斑驳质感不能覆盖文字，复杂母题也不能承担导航、按钮或图标的辨识任务。",
    mixes: [
      { s: "minimalism", f: "dunhuang", why: "当展览需要讲清大量内容时，用克制结构降低视觉负担；壁画质感由极简主义上限调淡。" },
      { s: "art-deco", f: "dunhuang", why: "需要海报式封面时，以中轴组织标题和入口，颜色与插图仍来自敦煌表皮。" },
    ],
    related: ["art-deco", "ukiyo-e", "bauhaus"],
  },
  fauvism: {
    lede: "用强烈的色块与笔触表达情绪，版面交给另一副有规则的骨架。",
    subject: "一家咖啡店",
    uses: ["咖啡店、艺术活动与短篇品牌页：用强烈的配色识别入口和分组，不靠写实图片建立气氛。", "情绪鲜明的海报主视觉：给定具体主体，让色彩关系比写实光影更突出。"],
    caution: "野兽派只提供颜色、质感和插图，版面由骨架决定。强烈的颜色集中用在强调位，数量由骨架决定；文字仍需按背景检查对比度。",
    mixes: [
      { s: "bauhaus", f: "fauvism", why: "这是工作台的默认组合：几何网格提供秩序，野兽派负责颜色与主视觉。可以单独换表皮，观察布局和字体保持不变。" },
      { s: "minimalism", f: "fauvism", why: "只保留一个强调色与更淡的质感，让原本浓烈的表皮变得克制；调色板本身不改，也不额外加灰。" },
    ],
    related: ["bauhaus", "memphis", "art-deco"],
  },
};

export function guideBody(byId) {
  const S = byId.bauhaus;
  const F = byId.fauvism;
  const example = `请用${S.name}的结构 × ${F.name}的色彩与质感，为一家独立书店实现响应式落地页。\n保留已有技术栈和真实业务文案。\n按我接下来提供的 DESIGN.md 设置布局、字体和 CSS 变量。\n不要把主视觉压在正文下面；保留焦点环，并检查正文与按钮的对比度。`;
  return `<article>
    <header class="article-head"><p class="article-kicker">使用教程 · 网页设计与 AI 提示词</p><h1>如何把艺术流派变成网页设计与 AI 提示词</h1><p class="article-lede">先选负责排版的骨架，再选负责颜色的表皮。用对比预览确认两者的分工，再把规则复制给代码工具或生图工具。</p><a class="btn" href="/#mix=bauhaus+fauvism">从包豪斯 × 野兽派开始 →</a></header>
    <div class="article-body">
      <section><h2>工具的范围</h2><p>流派混合把艺术流派的特征整理成网页设计规则。工作台只在浏览器里生成提示词和文件，不调用任何模型；结果可以贴给 Claude Code、Cursor、v0 或支持英文提示词的生图工具。</p><p>骨架负责布局、字体、圆角、边框、阴影和动效；表皮负责调色板、质感、母题和生图媒介。每个维度只归一方，两套风格不取平均。</p></section>
      <section><h2>1. 选骨架：确定信息怎样排列</h2><p>在<a href="/#workbench">工作台</a>的灰阶缩略图里比较网格、标题和模块关系。先不要被颜色吸引：你的页面是短篇品牌介绍、活动落地页，还是需要清楚分组的信息页？</p><p><a href="/schools/bauhaus/">包豪斯</a>用模块组织信息，<a href="/schools/memphis/">孟菲斯</a>更偏错位和俏皮，<a href="/schools/art-deco/">装饰艺术</a>强调中轴与层叠。这里的骨架只描述网页设计规则，不概括整段艺术史。</p></section>
      <section><h2>2. 选表皮：确定颜色与画面</h2><p>在主视觉卡片中选择颜色、笔触和题材。<a href="/schools/fauvism/">野兽派</a>让颜色表达情绪，<a href="/schools/ukiyo-e/">浮世绘</a>提供木版套色的画面，<a href="/schools/dunhuang/">敦煌壁画</a>提供矿物色和壁面质感。</p><p>浮世绘、敦煌壁画和野兽派在本工具里只做表皮，没有自己的网页布局。需要单独使用它们时，可以借极简主义的骨架；不能把“浮世绘 × 野兽派”当成两副可互换的骨架。</p></section>
      <section><h2>3. 打开对比预览，确认改了哪一层</h2><p>先只换一个维度，再打开“对比本次改动”。换骨架时，布局和字体应改变；换表皮时，配色和主视觉应改变，但骨架的布局规则不变。</p><p>部分颜色和质感会受骨架约束：强调色只取前 accentSlots 个，质感强度取表皮 level 与骨架 textureCap 的较小值。所以表皮的强烈效果可能被调淡。</p></section>
      <section><h2>例子：包豪斯 × 野兽派如何分工</h2><dl class="article-facts"><dt>骨架</dt><dd>${esc(S.structure.grid)}</dd><dt>字体</dt><dd>标题 ${esc(S.structure.type.display.family)}；正文 ${esc(S.structure.type.body.family)}</dd><dt>配色</dt><dd>${esc(F.colorUsage)}</dd><dt>强调色</dt><dd>${S.structure.accentSlots} 个，由包豪斯决定</dd><dt>质感</dt><dd>${esc(F.texture.desc)}；${F.texture.level} 被骨架上限 ${S.structure.textureCap} 限制为 ${Math.min(F.texture.level, S.structure.textureCap)}</dd></dl><p>骨架规则中的“黑线”“白格”等词表示角色，不要求保留原骨架颜色。混合时线条用表皮的 line，文字用 ink，底色用 bg。母题与布局冲突时，母题只留在插图里。</p></section>
      <section><h2>4. 把规则复制给代码工具</h2><ol><li>选择“写代码用”标签，复制完整提示词；已有项目时说明技术栈、页面用途和真实文案。</li><li>需要继续迭代或让多个工具共享规则时，下载 DESIGN.md，把它作为这次页面设计的依据。</li><li>让代码工具实现页面后，检查布局和字体是否来自骨架、颜色是否来自表皮，不要只看“像不像某个画派”。</li></ol><pre>${esc(example)}</pre><p>工作台的完整提示词包含实际 CSS 变量、字体、布局规则和禁忌。这里的简短示例用来说明提问方式，不替代完整规则。</p></section>
      <section><h2>5. 需要图片时，复制生图提示词</h2><p>切到“生图用”，在“画面主题”中填写具体主体与场景，再复制英文提示词。只写“好看的艺术图片”无法交代你要画什么。</p><p>例如把主题写成 <code>a quiet independent bookstore on a rainy evening, books visible through the window</code>。流派名、媒介、构图、配色与母题由组合补充；不要增加艺术家名字，也不要让图像承担需要精确排版的文字。</p><p>生成后检查文字、数字与水印。网站中的主视觉也是 AI 生成的风格示意，不是历史原作；需要艺术史或文物资料时，应另查可靠来源。</p></section>
      <section><h2>下载 HTML、DESIGN.md 还是安装技能</h2><p>“下载书店示例 .html”适合先拿到可打开的参考页面：主视觉内嵌，布局已经落地，但书店文案只是演示，需要改成你的内容。Google Fonts 仍需联网，离线会回退到系统字体。</p><p>“下载 DESIGN.md”适合在现有项目里使用，不要求替换已有框架。想让 Agent 每次按同一份流派库工作，可以到<a href="/#install">安装区</a>选择工具，按页面指令安装三个技能文件；本工具生成提示词不需要 API key，外部模型的账号与费用由对应服务决定。</p></section>
      <section><h2>交付前的检查清单</h2><ul><li>信息层级清楚：标题、正文和行动入口不争抢注意力。</li><li>手机没有横向溢出，正文行宽与字号可读。</li><li>质感只在底色上，主视觉单独占位、不作为正文底图。</li><li>正文与背景对比度至少 4.5:1；强调色上的文字按实际配对检查。</li><li>键盘焦点可见，按钮有反馈，动效尊重 prefers-reduced-motion。</li><li>代码工具没有擅自加入骨架不允许的圆角、阴影或布局。</li></ul></section>
      <section><h2>继续探索</h2><div class="related-links"><a href="/schools/bauhaus/">包豪斯网页设计</a><a href="/schools/fauvism/">野兽派配色与提示词</a><a href="/schools/ukiyo-e/">浮世绘主视觉与提示词</a></div><p class="article-provenance">本教程说明本项目的设计转译与使用方式。具体参数来自<a href="/skill/schools.json">流派库</a>，维度归属、质感上限和禁忌处理以<a href="/skill/references/mixing.md">混合规则</a>为准。</p></section>
    </div>
  </article>`;
}

// 隐私政策正文。联系方式等作者信息等关于页定稿后再补。
export const PRIVACY_UPDATED = "2026-11-27";
export function privacyBody() {
  return `<article>
    <header class="article-head"><p class="article-kicker">隐私政策 · 更新于 <time datetime="${PRIVACY_UPDATED}">${PRIVACY_UPDATED}</time></p><h1>隐私政策</h1><p class="article-lede">流派混合不需要注册，也不收集你在工作台里的选择。下面写清楚访问本站时，哪些数据会经过谁。</p></header>
    <div class="article-body">
      <section><h2>工作台不上传任何东西</h2><p>选骨架、选表皮、生成提示词和 DESIGN.md，全部在你的浏览器里计算，不调用任何模型，也不发到我们的服务器。分享链接里的组合写在网址的 <code>#</code> 后面，这一段不会随请求发给服务器。</p><p>本站自己不设 Cookie，不用 localStorage，也没有装访问统计。点"复制"时，浏览器只把文字写进你的剪贴板。</p></section>
      <section><h2>托管：Cloudflare</h2><p>网站托管在 Cloudflare。和所有网站一样，每次请求都会让 Cloudflare 看到你的 IP 地址、浏览器标识和访问的网址，用于送达页面、缓存和防御攻击。Cloudflare 如何处理这些数据，见 <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare 隐私政策</a>。</p></section>
      <section><h2>字体：Google Fonts</h2><p>页面和预览用到的字体从 Google Fonts 加载，你的浏览器会直接向 Google 的服务器请求字体文件，Google 因此会看到你的 IP 地址。见 <a href="https://policies.google.com/privacy">Google 隐私权政策</a>。</p></section>
      <section><h2>广告：Google AdSense</h2><p>本站计划用 Google AdSense 展示广告来维持运营，工具本身一直免费。广告开启后，Google 及其合作伙伴会使用 Cookie，根据你访问本站和其他网站的记录投放广告。</p><p>你可以在 <a href="https://adssettings.google.com/">Google 广告设置</a>里关闭个性化广告，也可以在 <a href="https://www.aboutads.info/choices/">aboutads.info</a> 关闭第三方供应商的个性化广告 Cookie。Google 怎样使用合作网站上的数据，见 <a href="https://policies.google.com/technologies/partner-sites">这一页</a>。来自欧洲经济区、英国和瑞士的访客，会先看到 Google 的同意提示，再决定是否允许。</p></section>
      <section><h2>安装 Skill</h2><p>用 <code>npx skills add</code> 安装时，文件从 GitHub 下载；用 curl 或 ZIP 安装时，文件从本站下载，只留下上面说的 Cloudflare 访问记录。装好以后，Skill 在你自己的电脑上运行，不会把你的项目或对话发给我们。</p></section>
      <section><h2>图片</h2><p>首页和图鉴里的原作是公有领域作品，图片文件放在本站，不从博物馆网站加载。图注里的馆藏链接只有你点击时才会打开。</p></section>
      <section><h2>政策变更</h2><p>这份政策有改动时，会更新本页顶部的日期。</p></section>
    </div>
  </article>`;
}

// 英文首页正文（/en/）。工作台界面暂时只有中文，这里讲清楚概念并给出安装方式。
export function enHomeBody(data) {
  const names = (structure) => data.schools.filter((s) => s.roles.includes("structure") === structure).map((s) => s.en).join(", ");
  const skeletons = data.schools.filter((s) => s.roles.includes("structure")).length;
  return `<article lang="en">
    <header class="article-head"><p class="article-kicker">Web design style &amp; AI prompt generator</p><h1>Two art movements. One web design system.</h1><p class="article-lede">One movement sets the skeleton: layout, type, motion. The other sets the skin: color, texture, motifs. Fixed rules, no averaging, so the same pair gives the same result every time.</p><a class="btn" href="#install">Install the skill</a></header>
    <figure class="article-visual"><picture><source type="image/webp" srcset="/art/ukiyo-e.800.webp 800w, /art/ukiyo-e.1600.webp 1600w" sizes="(max-width: 640px) calc(100vw - 40px), 900px"><img src="/art/ukiyo-e.jpg" alt="Katsushika Hokusai, Under the Wave off Kanagawa: a Prussian-blue wave curls over three boats, Mount Fuji in the distance" width="1200" height="822" fetchpriority="high" decoding="async"></picture><figcaption>Katsushika Hokusai, <cite>Under the Wave off Kanagawa</cite>, c. 1830–33, woodblock print. <a href="https://www.artic.edu/artworks/24645">Art Institute of Chicago</a>, CC0. This site is Constructivism × Ukiyo-e.</figcaption></figure>
    <div class="article-body">
      <section><h2>Skeleton and skin</h2><p>Mixing two styles usually means averaging them, and the average looks like nothing. Style Mix gives every decision to exactly one movement instead. The skeleton owns the grid, type scale, corners, borders, shadows and motion. The skin owns the palette, texture, motifs and the medium of the illustrations.</p><p>Constructivism × Ukiyo-e, for example, means diagonal bands, tilted headlines and square corners, painted in Prussian blue and vermilion on washi paper.</p></section>
      <section><h2>What you take away</h2><p>For each pair you get a DESIGN.md with CSS variables and rules, a prompt for your coding agent, and an English image prompt for the page's illustrations. Image prompts name the movement, not artists, and ask for no text in the picture.</p><p>The skill also includes a browser check that screenshots your page at 1440 and 390 px and reports contrast, corners, shadows, off-palette colors, fonts and overflow against the DESIGN.md.</p></section>
      <section><h2>${data.schools.length} movements</h2><p>${skeletons} can be the skeleton: ${names(true)}.</p><p>The other ${data.schools.length - skeletons} work as skin only: ${names(false)}.</p><p>Each one is shown next to a public-domain original, credited with its collection and license. We take the rules, not the composition.</p></section>
      <section id="install"><h2>Install for Claude Code, Codex and other agents</h2><p>With Node installed, run:</p><pre>npx skills add tokensflow/tasteux</pre><p>Then ask your agent something like:</p><pre>Use style-mix to restyle my homepage as Constructivism × Ukiyo-e.</pre><p>The skill runs on your machine and needs no API key. Source: <a href="https://github.com/tokensflow/tasteux">github.com/tokensflow/tasteux</a>.</p></section>
      <section><h2>Try the mixer</h2><p>The interactive mixer on the <a href="/" hreflang="zh-CN">Chinese homepage</a> previews any pair live and exports the same files. Its interface is in Chinese for now; the prompts it exports are in English where it matters.</p></section>
    </div>
  </article>`;
}

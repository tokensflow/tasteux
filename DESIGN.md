---
version: alpha
name: "构成主义 × 浮世绘"
description: "构成主义搭骨架：倾斜 -8° 到 -15° 的对角网格；浮世绘上颜色：普鲁士蓝做主色面和 CTA。"
x-style-mix: "constructivism+ukiyo-e" # 重新生成：node scripts/mix.mjs constructivism ukiyo-e；数据 schools.json v1
colors:
  primary: "oklch(0.42 0.11 245)" # --accent
  on-primary: "oklch(0.96 0.02 85)" # --on-accent
  secondary: "oklch(0.6 0.18 35)" # --accent2
  background: "oklch(0.93 0.03 85)" # --bg
  on-background: "oklch(0.22 0.04 255)" # --ink
  surface: "oklch(0.89 0.035 80)" # --surface
  on-surface: "oklch(0.22 0.04 255)" # --ink
  on-surface-variant: "oklch(0.42 0.04 250)" # --muted
  outline: "oklch(0.3 0.04 255)" # --line
typography:
  display:
    fontFamily: "Oswald"
    fontWeight: 700
    letterSpacing: 0.01em
  body:
    fontFamily: "PT Sans"
    fontWeight: 400
rounded:
  none: 0px
omitted:
  - spacing
components:
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
  caption:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface-variant}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
  secondary-block:
    backgroundColor: "{colors.secondary}"
  divider:
    backgroundColor: "{colors.outline}"
---
# 构成主义 × 浮世绘

## 展签
主 · 构成主义 Constructivism，副 · 浮世绘 Ukiyo-e

**构成主义 Constructivism** · 骨架 · 1915–1930s · 俄国

构成主义 1910 年代在俄国兴起，塔特林、罗德琴科、李西茨基是代表。它主张艺术为社会服务，海报和书籍大量使用斜线、照片蒙太奇和粗体字。

这次负责：
- 排版：倾斜 -8° 到 -15° 的对角网格
- 标题字体：Oswald

**浮世绘 Ukiyo-e** · 表皮 · 17–19 世纪 · 日本江户

浮世绘是日本江户时代的风俗画，以木版画最为人熟知，描绘市井生活、歌舞伎和风景。葛饰北斋的《神奈川冲浪里》用普鲁士蓝印出巨浪，后来影响了欧洲印象派。

这次负责：
- 配色：普鲁士蓝做主色面和 CTA
- 质感：和纸纤维纹，带木版压印感，强度 0.5
- 主视觉：巨浪、霞形云带

## 主张
构成主义搭骨架：倾斜 -8° 到 -15° 的对角网格；浮世绘上颜色：普鲁士蓝做主色面和 CTA。

## 适用范围
官网 tasteux.com 的页面外壳：顶栏、首屏标题区、章节标题、按钮、安装区。图鉴图版、轮播海报和工作台预览展示的是其他组合，按各自流派的数据渲染，不归本文件管；流派原作按"原作"一节放在 `figure[data-original]` 里。
页面模板（和首页共用 `style.css` 外壳、同一套顶栏和页脚，全部算管）：

| 模板 | 示例网址 | 管不管 | 页面类型 |
|---|---|---|---|
| 首页（中文） | `/` | 管 | 展示页 |
| 英文首页 | `/en/` | 管 | 展示页 |
| 教程文章 | `/guides/art-movement-web-design/` | 管 | 阅读页 |
| 流派详情页（6 个同一模板） | `/schools/ukiyo-e/` | 管 | 展示页 |
| 隐私政策 | `/privacy/` | 管 | 阅读页 |
| 关于 | `/about/` | 管 | 阅读页 |

检查时排除：`#hero-carousel`、`.thumb`、`.pv`、`.plate-visual`、`.study-img`、`.skin-img`、`.adsbygoogle`

## 色彩
```css
:root {
  --bg: oklch(0.93 0.03 85);
  --surface: oklch(0.89 0.035 80);
  --ink: oklch(0.22 0.04 255);
  --muted: oklch(0.42 0.04 250);
  --line: oklch(0.3 0.04 255);
  --accent: oklch(0.42 0.11 245);
  --on-accent: oklch(0.96 0.02 85);
  --accent2: oklch(0.6 0.18 35);
}
```
用法：普鲁士蓝做主色面和 CTA，朱红只做印章式小块，赭黄做次级面板。
只使用 2 个强调色（构成主义的规矩）。上面的用法如果提到更多颜色，以这一条为准。

## 字体
- 标题：font-family: "Oswald", "PingFang SC", "Noto Sans SC", sans-serif；字重 700；全大写；字距 0.01em
- 正文：font-family: "PT Sans", "PingFang SC", "Noto Sans SC", sans-serif；字重 400
- 中文标题：拉丁标题字体没有中文字形，中文会落到回退字体，所以中文标题单独指定 700–900 字重，和拉丁标题的分量一致；字距不要用负值
- 中文大标题不套用全大写和窄体：中文用 900 字重、字距 0 到 0.05em；要窄体的分量感时，在中文大标题上方配一行全大写的拉丁小标题。不要用 font-stretch、transform: scaleX 压扁汉字，也不要用 skewX 或 oblique 做伪斜体；骨架要求倾斜时用 rotate 把整块标题转过去。
- Google Fonts：Oswald:wght@700 / PT Sans:wght@400;700
- 加载：整站只用一种 font-display（推荐 swap），每个字体族只请求一次：在每个页面的 <head> 里用同一条 Google Fonts 链接加载，并 preconnect fonts.gstatic.com；不要在某个区块或懒加载的模块里再请求一次

## 布局
- 栅格：倾斜 -8° 到 -15° 的对角网格，主轴从左下冲向右上
- 规则：
  - 大标题全大写窄体，沿对角线倾斜放置
  - 一条贯穿页面的斜向色带
  - 用箭头和粗线把视线引向 CTA
  - 图片做成裁切的蒙太奇块
  - 规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。
- 圆角：0；边框：粗黑线 3–6px；阴影：无；密度：紧凑
- 按钮：主按钮是 --accent 实心色块配 --on-accent 全大写窄体字，右侧接一个 --ink 实心箭头块（伪元素做，不用 box-shadow）；无描边、无双层框、无内凹；次按钮是 3px --ink 实线框配 --ink 字

## 页面类型
- 展示页（首页、落地页、作品或流派展示页）：用上面全部布局规则。
- 阅读页（文档、教程、关于、隐私、条款、文章）：色彩、字体、圆角、边框、按钮和展示页完全一样；不放贯穿斜带，标题横排不倾斜；保留全大写窄体标题和粗黑线分隔。正文单栏，每行 35–45 个汉字或 60–75 个字母，质感强度减半，主视觉和装饰不压正文。
- 导航和页脚全站一套：同样的条目、顺序和写法，只在各语言版本里翻译。

## 质感
和纸纤维纹，带木版压印感，强度 0.5
强度是质感的浓淡（0–1），按观感理解：0.15 几乎看不见，0.3 能看出，0.5 明显，0.6 很重。质感层铺在页面底色上、正文下层，不进卡片，不压文字，也不盖在原作上。
实现：复制本技能 references/textures.css，页面里放 `<div class="texture" data-texture="paper" aria-hidden="true"></div>`，在 :root 设 `--tex-level: 0.5;`。

## 母题
巨浪、霞形云带、松枝、题签框
母题首先用在主视觉和插图里。和骨架规则不冲突时，也可以做成界面上的单个图形，但不要铺成重复的底纹。有冲突时按 mixing.md 第 4 条只放进插图。

界面框式（可以直接做成顶栏、卡片边框、图片框，不进生图提示词）：
- 顶部一条普鲁士蓝向下褪开的晕染带（广重画顶的天空），可做顶栏
- 竖长的色块题签条贴在图片一角，只放短标题

## 原作
主视觉优先用浮世绘的公有领域原作，没有合适的才用下面的生图提示词。规则：
- 放在 `<figure data-original>` 里，图片用 `<picture>` 或 `<img>`，`<figcaption>` 写作者、标题、年代、收藏方和许可，并链接到出处页。
- 不裁掉题款和印章，不加滤镜、混合模式或半透明，不铺质感，不在画面上压文字。可以整幅缩放，横卷可以只取一段，但要在图注里写明是局部。
- 下载后存进项目，不要直接热链博物馆的图片地址。

- 《神奈川冲浪里》 Under the Wave off Kanagawa，葛饰北斋 Katsushika Hokusai，1830–33。芝加哥艺术博物馆，CC0。出处：https://www.artic.edu/artworks/24645
- 《见附·天龙川渡船》 Mitsuke: Ferries Crossing the Tenryu River，歌川广重 Utagawa Hiroshige，约 1837–42。芝加哥艺术博物馆，CC0。出处：https://www.artic.edu/artworks/4368
- 《山下白雨》 Shower Below the Summit，葛饰北斋 Katsushika Hokusai，约 1830–33。芝加哥艺术博物馆，CC0。出处：https://www.artic.edu/artworks/87008

## 动效
沿斜线快速滑入，果断停住，220ms cubic-bezier(0.2, 0.8, 0.2, 1)。按下时也要有反馈。用键盘快捷键触发的状态切换不加过渡，遵守 prefers-reduced-motion。

## 禁止
- 居中对称
- 圆角
- 细小正文做主角
- 写实光影
- 霓虹色
- 3D 效果
- 大面积渐变（只允许天空或海面的单色晕染）
- 渐变文字、默认玻璃卡片、通用圆角阴影卡片网格

## 无障碍
- 正文与背景对比度 ≥ 4.5:1（--ink / --bg 14.09:1，--muted / --bg 6.86:1）。
- --accent 上的文字用 --on-accent（7.45:1）。
- --accent2 上只放 24px 以上或 18.7px 以上粗体的大字或图标，用 --ink（4.04:1）；正文和小字不放在 --accent2 上。
- --accent 可以直接做 --bg 上的文字色（6.81:1）。
- --accent2 在 --bg 上只做 24px 以上或 18.7px 以上粗体的大字、图标和边框（3.49:1）。
- 反相区块（深色通栏，比如展厅、页脚）：--ink 做底，--bg 做字（14.09:1），次要文字也用 --bg，不用 --muted（只有 2.05:1），按钮仍是 --accent 配 --on-accent；不要另造调色板以外的深色。
- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。

## 提示词

### 写代码用
```text
请按下面的设计系统实现页面：构成主义（Constructivism）的结构 × 浮世绘（Ukiyo-e）的色彩与质感。
构成主义搭骨架：倾斜 -8° 到 -15° 的对角网格；浮世绘上颜色：普鲁士蓝做主色面和 CTA。

【CSS 变量】
:root {
  --bg: oklch(0.93 0.03 85);
  --surface: oklch(0.89 0.035 80);
  --ink: oklch(0.22 0.04 255);
  --muted: oklch(0.42 0.04 250);
  --line: oklch(0.3 0.04 255);
  --accent: oklch(0.42 0.11 245);
  --on-accent: oklch(0.96 0.02 85);
  --accent2: oklch(0.6 0.18 35);
}
用色：普鲁士蓝做主色面和 CTA，朱红只做印章式小块，赭黄做次级面板。
只使用 2 个强调色（构成主义的规矩）。上面的用法如果提到更多颜色，以这一条为准。

【字体】
标题：Oswald 700，全大写，字距 0.01em
正文：PT Sans 400
中文回退："PingFang SC", "Noto Sans SC", sans-serif；中文标题 700–900 字重，字距不用负值。中文大标题不套用全大写和窄体：中文用 900 字重、字距 0 到 0.05em；要窄体的分量感时，在中文大标题上方配一行全大写的拉丁小标题。不要用 font-stretch、transform: scaleX 压扁汉字，也不要用 skewX 或 oblique 做伪斜体；骨架要求倾斜时用 rotate 把整块标题转过去。
Google Fonts：Oswald:wght@700 / PT Sans:wght@400;700
加载：整站只用一种 font-display（推荐 swap），每个字体族只请求一次：在每个页面的 <head> 里用同一条 Google Fonts 链接加载，并 preconnect fonts.gstatic.com；不要在某个区块或懒加载的模块里再请求一次

【布局】
栅格：倾斜 -8° 到 -15° 的对角网格，主轴从左下冲向右上
- 大标题全大写窄体，沿对角线倾斜放置
- 一条贯穿页面的斜向色带
- 用箭头和粗线把视线引向 CTA
- 图片做成裁切的蒙太奇块
规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。
圆角 0；边框 粗黑线 3–6px；阴影 无；密度 紧凑
按钮：主按钮是 --accent 实心色块配 --on-accent 全大写窄体字，右侧接一个 --ink 实心箭头块（伪元素做，不用 box-shadow）；无描边、无双层框、无内凹；次按钮是 3px --ink 实线框配 --ink 字

【页面类型】
- 展示页（首页、落地页、作品或流派展示页）：用上面全部布局规则。
- 阅读页（文档、教程、关于、隐私、条款、文章）：色彩、字体、圆角、边框、按钮和展示页完全一样；不放贯穿斜带，标题横排不倾斜；保留全大写窄体标题和粗黑线分隔。正文单栏，每行 35–45 个汉字或 60–75 个字母，质感强度减半，主视觉和装饰不压正文。
- 导航和页脚全站一套：同样的条目、顺序和写法，只在各语言版本里翻译。

【质感】和纸纤维纹，带木版压印感，强度 0.5，只铺在背景上，不盖住文字
【母题】巨浪、霞形云带、松枝、题签框。母题首先用在主视觉和插图里。和骨架规则不冲突时，也可以做成界面上的单个图形，但不要铺成重复的底纹。有冲突时按 mixing.md 第 4 条只放进插图。
【界面框式】顶部一条普鲁士蓝向下褪开的晕染带（广重画顶的天空），可做顶栏；竖长的色块题签条贴在图片一角，只放短标题
【主视觉】优先用浮世绘的公有领域原作（见 DESIGN.md「原作」），写明出处和许可，不加滤镜、不铺质感、不裁题款。
【动效】沿斜线快速滑入，果断停住，220ms cubic-bezier(0.2, 0.8, 0.2, 1)。按下时也要有反馈。用键盘快捷键触发的状态切换不加过渡，遵守 prefers-reduced-motion。
【禁止】居中对称、圆角、细小正文做主角、写实光影、霓虹色、3D 效果、大面积渐变（只允许天空或海面的单色晕染）。不要使用渐变文字、默认玻璃卡片、通用圆角阴影卡片网格。
【无障碍】
- 正文与背景对比度 ≥ 4.5:1（--ink / --bg 14.09:1，--muted / --bg 6.86:1）。
- --accent 上的文字用 --on-accent（7.45:1）。
- --accent2 上只放 24px 以上或 18.7px 以上粗体的大字或图标，用 --ink（4.04:1）；正文和小字不放在 --accent2 上。
- --accent 可以直接做 --bg 上的文字色（6.81:1）。
- --accent2 在 --bg 上只做 24px 以上或 18.7px 以上粗体的大字、图标和边框（3.49:1）。
- 反相区块（深色通栏，比如展厅、页脚）：--ink 做底，--bg 做字（14.09:1），次要文字也用 --bg，不用 --muted（只有 2.05:1），按钮仍是 --accent 配 --on-accent；不要另造调色板以外的深色。
- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。
```

### 生图用
```text
a landing page for a tool that mixes two art movements into a web style, ukiyo-e woodblock print, Edo period, flat color areas, fine black keylines, bokashi gradation, washi paper, dynamic diagonal composition, tilted axis, strong forward momentum, palette of Prussian blue, vermilion, ochre, washi cream, sumi black, featuring great waves, banded clouds, pine branches, original composition, do not reproduce any famous artwork
Negative: symmetry, rounded corners, ornament, photorealistic, neon, 3d render, lens flare, heavy gradient, text, letters, calligraphy, watermark, signature
```

## 迭代记录

| 日期 | 这一轮 | 偏离的规则 |
|---|---|---|
| 2026-11-27 | 补建 DESIGN.md：按 `site/style.css` 的现有变量，外壳最接近 极简主义 × 水墨（`--c-seal` 与水墨强调色完全一致，`--c-ink` / `--c-muted` 只差 0.01–0.02 亮度）。只记录现状，不改页面。 | 已有偏离，待确认是否保留：① 标题用 Noto Serif SC 700/900，不用 Instrument Sans；② 底色稍亮（`--c-paper` 0.972 0.006 85）；③ 工作台用深色"展厅"（`--c-room*`），不在调色板里；④ 图鉴和安装区是多栏，不是单栏；⑤ 按钮圆角 2px。 |
| 2026-11-27 | 改一个区块（安装）：在下载卡片前加"一行安装" `npx skills add 24kHandsome1201/style-mix`，带复制按钮；手机上命令不折行。 | 无 |
| 2026-11-27 | 改一个区块（首屏标题区）：h1 下加一句介绍，写明两个独有特点：按规则分骨架和表皮混合、附带网页插图用的生图提示词。`<title>`、meta、h1 不变。 | 无 |
| 2026-11-27 | 改一个区块（安装）："单独下载"补上 format.md 和 mix.mjs，与技能包的 5 个文件一致。 | 无 |
| 2026-11-27 | viki 否决了外壳基础组合"极简主义 × 水墨"（太俗套）。本文件暂时只记录现状，新组合定下来后重新生成。 | — |
| 2026-11-27 | 按规则修：手机上工作台预览的吸顶面板去掉模糊阴影，改成 1px 分隔线（check.mjs 报的唯一一项 FAIL；三个候选方向都规定无阴影）。 | 无 |
| 2026-11-27 | 换组合：viki 看过三个方向稿和原作观察笔记后，外壳改用 构成主义 × 浮世绘（减法版：一条斜带、一个大标题、一张原作，彩色面积不超过一成）。按新数据重新生成本文件，旧记录保留在上面。 | 无 |
| 2026-11-27 | 改一个区块（首屏标题区）：按减法版方向 A 重做：大标题沿 -8° 倾斜、一条普鲁士蓝斜带加朱红细线把视线引向 CTA、右侧放北斋《神奈川冲浪里》原作（芝加哥艺术博物馆藏，CC0，图注写出处）。h1 文字、title、meta 不变；新增一个原作出处链接。顶栏、章节、按钮、图鉴还是旧样式，后面几轮再改。 | 无（首屏底色按数据铺和纸纹，强度 0.5。全站按钮的 2px 圆角留到下一轮统一改成 0） |
| 2026-11-27 | 按规则修：外壳圆角全部改成 0（通用按钮、工作台分组按钮、主题输入框、步骤序号）。check.mjs 首次 PASS，没用 --allow。 | 无 |
| 2026-11-27 | 按新版 skill（4b03ef4）重新生成：多出"原作"、界面框式和反相区块规则。首屏原作改成 `<figure data-original>`，从"检查时排除"里删掉 `.hero-original`。baseline 认可的变化：无。 | 无 |
| 2026-11-27 | 改一个区块（图鉴）：有原作的 20 个流派，图版主视觉换成 schools.json `works[0]` 的原作（`figure[data-original]`，图注写作者、年代、收藏方和许可并链接出处，整幅 contain 不裁切）。能当骨架的 8 个改成\"原作 | 按它生成的网页\"左右对照；只做表皮的把 AI 示意图换成原作，下面留调色板和质感色条。极简、孟菲斯、超现实、波普没有原作，暂时还是 AI 示意图。baseline 认可的变化：新增 20 个原作出处链接。 | 无 |
| 2026-11-27 | 配合 skill a5a2dab（敦煌可当骨架）：`site/preview.css` 加 `.pv[data-structure="dunhuang"]` 横向分栏版式（通栏横带、中心圆形背光、右侧一排拱形龛、底部供养人式窄带；窄画框单栏），骨架数量测试改为按数据计数。baseline 认可的变化：H3\"能当骨架的十个/只做表皮的十四个\"→\"十一个/十三个\"。 | 无 |
| 2026-11-27 | 配合 skill aff1a57：青绿山水图版的原作换成新的 works[0]《明皇幸蜀图》，重新下载；图注直接用新的 license 字段，去掉了官网这边去括号的处理。baseline 认可的变化：青绿出处链接从《千里江山图》卷首换成《明皇幸蜀图》。 | 无 |
| 2026-11-27 | 改一个区块（安装）：仓库公开为 tokensflow/tasteux，\"一行安装\"命令改成 `npx skills add tokensflow/tasteux`（README 同步）。已在未登录的干净 HOME 实测可装。baseline 认可的变化：无（只改了 pre 里的命令文字）。 | 无 |
| 2026-11-27 | 改一个区块（首屏）：按营销策划决定记录第 3 条换导语：去掉"每一组还附带生图提示词"（留在工作台第 ③ 步），换成"规则写死，不取平均，同一组合每次结果一样"。baseline 认可的变化：无（标题和链接不变）。 | 无 |
| 2026-11-27 | SEO（不改页面）：sitemap 每个 URL 加 `<lastmod>`，取内容源文件（site/、schools.json、editorial.mjs、build-site.mjs）最后一次提交的日期；没有 git 历史时不写，避免把构建时间当更新时间。部署工作流改为完整拉取历史（fetch-depth: 0）。页面无变化，未截图。 | 无 |
| 2026-11-27 | GEO（不改页面）：build-site 生成 `/llms.txt`：一句话定位（骨架/表皮、规则固定、每次结果一样）、安装命令、skill 文件、教程和已发布流派页，数量从 schools.json 取。测试保证其中每个链接都指向构建产物、并覆盖 sitemap 里的内容页。页面无变化，未截图。 | 无 |
| 2026-11-27 | 新页面（隐私政策，不含作者信息）：build-site 生成 `/privacy/`，正文在 editorial.mjs，写明工作台不上传、本站不设 Cookie、Cloudflare 托管、Google Fonts、计划中的 AdSense 和退出个性化广告的方法；首页和文章页页脚加"隐私政策"链接，页脚链接最小高度 24px（顺带消掉 390px 的点击目标提醒）。没进 sitemap 和 llms.txt。联系方式等关于页定稿再补。baseline 认可的变化：links + privacy/。文章页仍是旧外壳（衬线标题、未加载 Oswald），属于下一轮。 | 无 |
| 2026-11-27 | 新页面（英文首页）：按决定记录第 2 条，build-site 生成 `/en/`（正文在 editorial.mjs：骨架/表皮、产出、流派清单从 schools.json 取、一行安装、工作台暂只有中文）。中英首页互写 hreflang（x-default 指中文），`/en/` 进 sitemap 和 llms.txt；中文首页导航加 EN。AGENTS.md 的\"UI 只用中文\"改为\"中文为主，英文放 /en/\"（viki 已同意）。baseline 认可的变化：links + en/。英文页沿用文章页旧外壳，和隐私页一起留给下一轮。 | 无 |
| 2026-11-27 | 配合 skill e210bfa（多页面检查、列出页面模板）：适用范围改成按页面模板列出 5 类，全部算管；以后验收一次传 5 个示例网址给 check.mjs，基线按页面存。此时文章类 4 个模板（/en/、教程、流派页、/privacy/）仍是旧外壳，check 报衬线 h1、Oswald 未加载、颜色不在调色板里，记为待办，下面几轮逐个改。 | 待办：文章页外壳 |
| 2026-11-27 | 改一个模板组（文章类外壳：教程、流派页、/privacy/、/en/）：page() 给 `<html>` 加 `doc` 类并铺和纸质感层；style.css 在 `.doc` 上设 DESIGN.md 色板，把外壳的 --c-* 映射到它，标题 Oswald / 中文 900、拉丁标题全大写 700、首屏标题 rotate(-8deg)（390 用 -4deg）、贯穿全宽的普鲁士蓝斜带、3–5px 粗线、CTA 普鲁士蓝、h2 前朱红小块、页脚反相（--ink 底 --bg 字）、正文左对齐不居中。共用字体链接加 PT Sans 400/700。Oswald 只加载实际用到的 700，不加载 DESIGN.md 列出的 500：多声明 500 后，check.mjs 用 400 字重探测会落到未加载的 500 字面而误报，已反馈 skill 线程。5 页一起 check：文章类 4 页 0 提醒；首页 6 条提醒是首页自己的旧色和正文字体，留给首页配色轮。baseline 无变化。 | 无（字体一条已由 skill 7919360 改成规则本身） |
| 2026-11-27 | 改一个模板（首页配色）：首页 `<html>` 也加 `doc` 类，根元素上有了 --bg/--ink/--accent，正文换 PT Sans。工作台按反相规则：--c-room* 全部映射到 --ink 底、--bg 字和 --bg 细线，不再有调色板以外的深色；原来用 --c-room-seal 的三处小字（--accent2 在 --ink 上只有 4.04:1）改成 --bg 加粗。预览画框底 --ink、衬纸 --bg，警告字 --accent2。5 页一起 check：0 项未通过、0 项提醒。baseline 无变化。 | 无 |
| 2026-11-27 | 配合 skill 7919360（字体检查按"任一字重加载即算"，构成主义只请求 Oswald 700）：用 mix.mjs 重新生成后同步了 Google Fonts 一行和原作出处的许可写法；上一行"只载 Oswald 700"的偏离随之取消。5 页 check：0 项未通过、0 项提醒。baseline 无变化。 | 无 |
| 2026-11-27 | 新页面（关于）+ 改一处（隐私）：viki 定了署名 tokensflow、联系方式只用 GitHub Issues、不放邮箱。build-site 生成 `/about/`（谁在做、规则和原作从哪里来、收费吗、联系我们），JSON-LD 用 AboutPage + Organization（contactPoint 指向 Issues），进 sitemap 和 llms.txt；隐私页加\"联系我们\"一节；所有页脚加\"关于\"。适用范围加\"关于\"模板。6 页一起 check：0 项未通过、0 项提醒。baseline 认可的变化：各页 links + /about/，隐私页 + H2 联系我们、+ Issues 链接；/about/ 新加入基线。 | 无 |
| 2026-11-27 | 改一处（品牌露出）：tasteux 当主品牌，Style Mix 当产品名。顶栏字标 = Oswald 700 全大写 TASTEUX + 普鲁士蓝方块标签 STYLE MIX（390 也显示，导航间距收到 7px 防止溢出）；页脚\"tasteux 出品 · 流派混合 Style Mix\"/ 英文\"Style Mix by tasteux\"；title 后缀改为\"｜tasteux Style Mix\"，og:site_name = tasteux，JSON-LD Organization 名 = tasteux（首页新增 Organization，WebApplication / SoftwareApplication 的 publisher 指向它），面包屑根 = tasteux Style Mix；关于页 h1 改为\"关于 tasteux 和流派混合\"并写明 skill 仍叫 style-mix。skill 名和安装命令不变。6 页 check：除 baseline 外 0 项；baseline 认可的变化：title/og/JSON-LD/面包屑/关于页 h1，以及 b0e74da 接入的 AdSense 脚本。剩下的 baseline FAIL 只有 AdSense 动态插入的广告 iframe（网址每次加载都带新的 lmt/dt/correlator），连续两次保存基线后仍变，是 check.mjs 的问题，已反馈 skill 线程。 | 无（广告 iframe 误报已由 skill e24c0dd 修复） |
| 2026-11-27 | 配合 skill e24c0dd（baseline 的 scripts / iframes 只取页面 HTML 原文）：6 个页面模板重新 --save-baseline，连续两次复查都是 0 项未通过、0 项提醒；基线 scripts 只剩 app.js 和 adsbygoogle.js，iframes 为空。上一行品牌轮的偏离随之取消。 | 无 |
| 2026-11-27 | 改一页（隐私政策，评审第 3 条）：广告已上线，不再写\"计划\"；写明广告只在固定位置并标注「广告」、首屏和工作台不放、Google 用 Cookie 投放和统计、退出个性化广告的方法；欧洲经济区 / 英国 / 瑞士访客看到 Google 认证的同意提示（需 viki 在 AdSense 后台发布\"欧洲法规\"消息），页内加\"更改广告同意设置\"按钮，只在 Google 同意组件就绪（googlefc CONSENT_API_READY）后显示并调用 showRevocationMessage。关于页\"计划\"同步改掉。6 页 check 0/0。baseline 认可的变化：隐私页 description。 | 无 |
| 2026-11-27 | 新区块（固定广告位，viki 定\"固定位置，不用自动广告\"）：只在图鉴两组之间（`<!-- ad:plates -->`）和每页页脚上方；`aside.ad-slot` 上方一枚 --ink 底方块标签\"广告\"/\"Advertisement\"，下面 3px --line 粗框、高度固定 250px 的 `ins.adsbygoogle`，加载时不跳；没广告（unfilled）时整块收起。广告位 ID 在 build-site 的 AD_SLOTS，留空就不输出，现在两处都空，等 viki 建广告单元。代码里没有 enable_page_level_ads。适用范围的排除行加 `.adsbygoogle`（第三方广告内容不归本文件管）。用假 ID 构建验过 1440 / 390 无溢出、6 页 check 0/0，验完改回空。 | 无 |
| 2026-11-27 | 配合 skill 6e0df6f（无缝纹理、页面类型、按钮写法、字体加载）：用 mix.mjs 重新生成，适用范围保留项目自己的页面模板表，加"页面类型"一列：首页、英文首页、流派页是展示页，教程、关于、隐私是阅读页。规则同步后，下面几轮逐项改网站。 | 待办：纹理、导航、阅读页、按钮、字体 |
| 2026-11-27 | 改质感（评审第 2 条，skill 6e0df6f）：preview.css 的纸纹两层、壁画一层的噪点图块同步 textures.css：滤镜区域对齐图块、开 stitchTiles，拉丝图块 600px、对比度降低。首页、子页、图鉴和导出 HTML 共用这份 CSS，竖向接缝一起消失。6 页 check：texture 全过，剩 4 项是 nav（下一轮）。 | 无 |
| 2026-11-27 | 统一导航（评审第 9 条后半，skill 6e0df6f 的 nav 规则）：子页导航改成和首页一样的\"混合 图鉴 安装 EN\"，EN 带 hreflang=\"en\"；教程入口留在页脚和工作台。6 页 check 0/0。 | 无 |
| 2026-11-27 | 阅读页（评审第 9 条，skill 6e0df6f 的页面类型）：教程、关于、隐私的 `<html>` 加 `doc-reading`：不放斜带、标题横排不倾斜、标题区和正文单栏最宽 40em（约 40 个汉字/行）、正文 16px、质感 0.25（展示页的一半）；配色、字体、按钮、导航、页脚不变。首页、英文首页、流派页仍是展示页。6 页 check 0/0。 | 无 |
| 2026-11-27 | 按钮（评审第 10 条，skill 6e0df6f 的按钮写法）：主按钮（首屏\"去混合你的风格\"、各页标题区按钮）改成 --accent 实心色块、Oswald 700 全大写、右侧 --ink 实心箭头块（::after），去掉 4px 粗框；文字里的\" →\"挪到箭头块。次按钮统一 3px --ink 实线框；工作台反相区块里用 --bg 线框，选中态 --bg 底 --ink 字，修掉深底深框的\"内凹\"感。6 页 check 0/0。 | 无 |
| 2026-11-27 | 字体加载（评审第 5 条，skill 6e0df6f 的加载规则）：head 里那条 Google Fonts 链接从 display=optional 改成 swap（仍是非阻塞的 media=print/onload）；fonts.mjs 的懒加载器读出 head 已请求的字体族（Oswald、PT Sans 等），这些族不再请求第二次。整页滚到底：Oswald 只有 1 条请求，logo 不再中途换字体。性能测试加一条：已在 head 的族不重复请求。6 页 check 0/0。 | 无 |
| 2026-11-27 | 文案（第二份评审）：教程第 2 步不再说敦煌壁画只做表皮，写明它两边都能当；/en/ 改成如实说明工作台导出的代码提示词和 DESIGN.md 是中文、只有生图提示词是英文。顺带核实：手机 390 顶栏溢出在统一导航那轮已修（各页 scrollWidth 390，EN 完整）。6 页 check 0/0。 | 无 |
| 2026-11-27 | 工作台预览吸顶（第二份评审）：桌面右栏预览改为吸顶，比视口高时在栏内滚动，预览按视口高度限宽；手机吸顶区预览缩到 19svh、说明压成一行（完整内容仍由 aria-live 读出），吸顶区从屏幕 50% 降到 41%。对比模式仍不吸顶。6 页 check 0/0。 | 无 |
| 2026-11-27 | 选表皮（第二份评审）：桌面端 24 种表皮不再挤在一条无箭头的横向滚动里，改为按东方 / 西方古典 / 二十世纪三组平铺成每行 5 张的网格（组名取自分组的 aria-label），分组按钮在桌面隐藏；手机保留横滑和分组按钮。6 页 check 0/0。 | 无 |
| 2026-11-27 | 流派页网页预览（第二份评审）：包豪斯等 6 个流派页套站点自己的壳（构成主义 × 浮世绘）是按本 DESIGN.md 有意为之，不改；缺的是该流派自己的网页样子。现在每页标题下先放一张构建时上色的示例书店页（和工作台同一个 #pv-tpl；骨架流派用自己当骨架，表皮流派借极简主义），按断点固定缩放，不靠 JS；示例页的标题在静态副本里改成普通元素，不进页面标题大纲。配色变量抽到 site/palette.mjs，工作台和流派页共用。6 页 check 0/0。 | 无 |
| 2026-11-27 | 图鉴（第二份评审）：超现实主义和波普的代表作仍在版权期，原来用无图注的 AI 图顶替、标题比同行高约 117px。现在 AI 示意图放在原作的位置（4:3，裁切填满），图注写明“代表作仍在版权期内，不收录原作；上图是 AI 生成的风格示意”，下面接同样的色条；原作图注预留两行高度，同一行标题对齐（误差 0px）。6 页 check 0/0。 | 无 |
| 2026-11-27 | 骨架缩略图（viki 定：黑白，换成线框）：第 1 步不再把整张示例页缩到约 0.11 倍，改为每副骨架一张手绘的黑白几何线框（SVG，viewBox 90×76），按 schools.json 的 grid 规则画：立体主义叠压四边形、未来主义同向斜推、至上主义陡对角漂浮、构成主义斜带、达达乱叠拼贴、风格派粗黑线分格、包豪斯 12 栏、装饰艺术中轴双框、极简单栏留白、孟菲斯错位硬投影、敦煌通栏横带。不放文字、不上色。顺带：首页标题大纲少了 11 组缩略页带进来的“ReadSlowly / 本周新书…”标题，已重存 baseline。6 页 check 0/0。 | 无 |
| 2026-11-28 | 工作台默认组合（viki 定）：默认从包豪斯 × 野兽派改为构成主义 × 浮世绘，和站点自己的壳一致；直接打开首页不再把网址改写成 #mix=…，只有访客换过组合、或带着 #mix= 打开时才写网址。6 页 check 0/0。 | 无 |
| 2026-11-28 | 标题大纲：工作台示例页模板（#pv-tpl）的 "Read Slowly" 和三张卡片标题从 h2/h3 改为普通元素（.pv-title / .pv-h），首页大纲不再混入示例页标题；导出的示例 HTML 里仍换回 h1 + h2。流派页原来的构建时替换随之删除。渲染尺寸不变。重存 baseline。6 页 check 0/0。 | 无 |
| 2026-11-28 | 手机点击区（viki 定：至少 32px）：900px 以下顶栏 EN、轮播 01–04 至少 32px 宽；图注链接、"看教程"、"认识这两个流派"、面包屑、相关阅读、图鉴标题链接、页脚链接至少 32px 高（页脚另加 32px 宽）。正文段落里的行内链接按 WCAG 2.5.8 豁免。390 下 6 个页面不在正文里的可点元素全部 ≥32×32，scrollWidth 都是 390，无横向溢出。6 页 check 0/0（check 的门槛是 24px，这一轮用页面脚本按 32px 量）。 | 无 |

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
检查时排除：`#hero-carousel`、`.thumb`、`.pv`、`.plate-visual`、`.study-img`、`.skin-img`

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
- Google Fonts：Oswald:wght@500;700 / PT Sans:wght@400;700

## 布局
- 栅格：倾斜 -8° 到 -15° 的对角网格，主轴从左下冲向右上
- 规则：
  - 大标题全大写窄体，沿对角线倾斜放置
  - 一条贯穿页面的斜向色带
  - 用箭头和粗线把视线引向 CTA
  - 图片做成裁切的蒙太奇块
  - 规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。
- 圆角：0；边框：粗黑线 3–6px；阴影：无；密度：紧凑

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

- 《神奈川冲浪里》 Under the Wave off Kanagawa，葛饰北斋 Katsushika Hokusai，1830–33。CC0（芝加哥艺术博物馆）。出处：https://www.artic.edu/artworks/24645
- 《见附·天龙川渡船》 Mitsuke: Ferries Crossing the Tenryu River，歌川广重 Utagawa Hiroshige，约 1837–42。CC0（芝加哥艺术博物馆）。出处：https://www.artic.edu/artworks/4368
- 《山下白雨》 Shower Below the Summit，葛饰北斋 Katsushika Hokusai，约 1830–33。CC0（芝加哥艺术博物馆）。出处：https://www.artic.edu/artworks/87008

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
Google Fonts：Oswald:wght@500;700 / PT Sans:wght@400;700

【布局】
栅格：倾斜 -8° 到 -15° 的对角网格，主轴从左下冲向右上
- 大标题全大写窄体，沿对角线倾斜放置
- 一条贯穿页面的斜向色带
- 用箭头和粗线把视线引向 CTA
- 图片做成裁切的蒙太奇块
规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。
圆角 0；边框 粗黑线 3–6px；阴影 无；密度 紧凑

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

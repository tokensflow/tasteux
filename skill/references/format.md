# 输出格式（手算时用）

`scripts/mix.mjs` 按这份格式输出。没有 Node、需要手算时，照这里逐项填写。

## 1. 展签

一行：`主 · {主.name} {主.en}，副 · {副.name} {副.en}`；纯粹形态写 `{name} {en} 原样`。
再用一句话写出视觉主张，说清骨架和表皮各来自哪里。不要写"融合了 A 与 B 的精髓"这类空话。
然后两小段，分别介绍两个流派：先照抄 `intro`，再写一句"这次负责"（骨架：网格和标题字体；表皮：配色、质感和主视觉题材）。纯粹形态合成一段。

## 2. DESIGN.md

手算时可以省略 YAML 前言（mix.mjs 会生成 Google Stitch 格式的 token 前言），但要保留第一行之前的这三行，让 check.mjs 和下一轮迭代认得出组合：

```markdown
---
x-style-mix: "{主.id}+{副.id}"
---
# {主.name} × {副.name}（纯粹形态写 # {name} 原样）

## 主张
{一句话视觉主张}

## 适用范围
整个页面。（多页面网站逐个列出页面模板，每个写一个示例网址和管或不管，比如「- 文章页 `/guide/`：管」；和首页共用一套外壳样式的页面默认算管，不管的写明原因。外壳和展品分开时，写明只管哪部分，再加一行：检查时排除：`.gallery`、`#preview`）

## 色彩
:root {
  --bg: {副.palette.bg};
  --surface: {副.palette.surface};
  --ink: {副.palette.ink};
  --muted: {副.palette.muted};
  --line: {副.palette.line};
  --accent: {副.palette.accent};
  --on-accent: {副.palette.onAccent};
  （按 accentSlots 继续列出 --accent2、--accent3）
}
用法：{副.colorUsage}

## 字体
- 标题：font-family: "{display.family}", {zh}；字重 {display.weight}；transform 为 uppercase 时写"全大写"，为 none 时不写；字距 {tracking}
- 正文：font-family: "{body.family}", {zh}；字重 {body.weight}
- 中文标题：拉丁标题字体没有中文字形，中文会落到回退字体，所以中文标题单独指定 700–900 字重，和拉丁标题的分量一致；字距不要用负值
- Google Fonts：{google}

## 布局
- 栅格：{grid}
- 规则：{rules，逐条}
- 圆角：{radius}；边框：{border}；阴影：{shadow}；密度：{density}

## 质感
{副.texture.desc}，强度 {计算后的强度}
强度是质感的浓淡（0–1），按观感理解：0.15 几乎看不见，0.3 能看出，0.5 明显，0.6 很重。不同质感换算成 CSS 不透明度时系数可以不同，以观感为准。质感层铺在页面底色上、正文下层，不进卡片，不压文字。强度上限由主流派的 textureCap 决定，比如极简主义最多 0.15，几乎看不见。

## 母题
{副.motifs}
母题首先用在主视觉和插图里。纯粹形态或没有冲突时，母题也可以做成界面上的单个图形（比如包豪斯的圆、方、三角），但不要铺成重复的底纹。有冲突时按 mixing.md 第 4 条只放进插图。

## 动效
{motion.desc}，{duration} {easing}。按下时也要有反馈。用键盘快捷键触发的状态切换不加过渡，遵守 prefers-reduced-motion。

## 禁止
{主.structure.dont + 副.dont，逐条}

## 无障碍
- 正文与背景对比度 ≥ 4.5:1。
- 文字放在 --accent 上用 --on-accent。
- --accent2、--accent3 没有校验过文字对比度：在 --ink 和 --on-accent 里选对比度更高的那个；≥ 4.5:1 才放正文，3–4.5:1 只放 24px 以上或 18.7px 以上粗体的大字和图标，< 3:1 只做色块，不放文字。强调色直接当 --bg 上的文字色时也按这个分级。
- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。
```

## 3. 写代码用的提示词

用一个代码块给出，让用户能直接贴进 Claude、Cursor、v0 这类工具。内容是第 2 部分的压缩版：先一句话说明风格，再列出 CSS 变量、字体、布局规则和禁止项。用中文写，token 值保持原样。结尾加一句"不要使用渐变文字、默认玻璃卡片、通用圆角阴影卡片网格"。

## 4. 生图用的提示词

用英文写，因为生图模型对英文更稳定。格式：

```
{主题}, {副.medium}, {主.structure.composition}, palette of {副.colorWords}, featuring {副.motifsEn}
Negative: {主.structure.negative + 副.negative，去重}
```

- 跨流派时，把 `composition` 里的 black 换成 dark（比如 black lines 写成 dark lines），具体颜色交给 palette of 那一段。
- 负向词只在和副流派的 `medium` 或 `motifsEn` 整词冲突时删除（curves 对 whiplash curves 删；symmetry 对 asymmetric 不删），不要凭联想删。
- 会被画成乱码文字的母题（题跋 inscription、书法 calligraphy、题签框 cartouche、字母 lettering、typography、剪报 newspaper、印章 stamp）不写进 featuring。负向词末尾加 `text, letters, calligraphy, watermark, signature`；媒介或构图本身就是字的（比如达达的剪报和混排字体），只加 `watermark, signature`。

用户没给主题时，按场景补一个具体主题（比如落地页就写这个产品的主视觉），不要写 "beautiful artwork" 这种空主题。只用流派名，不写艺术家名字。

## 5. 手算时还要补的几节

- 原作：副流派 `works` 非空时，DESIGN.md 在"母题"后面加"## 原作"，逐条列出作品、作者、年代、许可和出处，规则见 mixing.md 第 7 条。
- 界面框式：副流派 `frames` 非空时，列在"母题"一节末尾。
- 无障碍：加一行反相区块（--ink 底、--bg 字）的对比度。
- 生图提示词末尾加 `original composition, do not reproduce any famous artwork`。

## 6. 迭代记录

DESIGN.md 末尾固定是这一节，每轮加一行，不改旧行：

```markdown
## 迭代记录

| 日期 | 这一轮 | 偏离的规则 |
|---|---|---|
| 2026-11-27 | 生成：包豪斯 × 野兽派 | 无 |
| 2026-11-28 | 补建：页面现状对照规则 | 圆角 0 → 按钮 2px（待确认）；标题字体 Jost → Noto Serif SC（用户确认） |
| 2026-11-29 | 按规则修：首屏和导航 | 无 |
```

## 7. 没有 check.mjs 时的手查清单

在 1440px 和 390px 下各截首屏和改动区块，逐条写"通过"或"未通过 + 位置 + 原因"：

- 正文对比度 ≥ 4.5:1，大字 ≥ 3:1；强调色上的文字按"无障碍"的分级。
- 圆角、阴影、边框符合"布局"；没有渐变文字、玻璃卡片、通用圆角阴影卡片网格。
- 只用调色板里的颜色，强调色不超过规定的数量。
- 标题和正文是"字体"里的字体，中文标题字重 700–900。
- 390px 下没有横向滚动，可点元素不小于 24×24px。
- Tab 能看到 2px 焦点环；`prefers-reduced-motion` 下没有位移动效。
- 质感层在正文下层，主视觉图不压正文。
- 原作放在 `<figure data-original>` 里，没有滤镜和半透明，图注链接出处、写明许可。
- 深色区块只用 --ink 做底、--bg 做字。
- 迭代已有网站时：标题、meta、canonical、JSON-LD、h1–h3、链接、统计和广告代码没有变。

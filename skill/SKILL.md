---
name: style-mix
description: "Mixes two art movements (Bauhaus, Ukiyo-e, Fauvism, ...) into a web design system, then outputs DESIGN.md, a coding-agent prompt, an image-generation prompt, and optionally a page. Use when the user names a painting school or asks for an art-movement style for a web page or image."
metadata:
  keywords: "流派混合, 画派风格, 艺术流派, 立体主义, 未来主义, 至上主义, 构成主义, 达达, 风格派, 蒙德里安, 包豪斯, 装饰艺术, 极简主义, 孟菲斯, 敦煌壁画, 青绿山水, 水墨, 宋画, 工笔花鸟, 浮世绘, 巴洛克, 洛可可, 印象派, 点彩派, 新艺术运动, 野兽派, 表现主义, 超现实主义, 波普, X 风格的网页, X × Y, art movement style, Bauhaus page, style mix"
---

# Style Mix：把两个画派混成一套网页风格

流派数据在本目录的 `schools.json`，混合规则在 `references/mixing.md`。开始前两个文件都要完整读一遍。不要凭记忆描述流派，所有颜色、字体、规则都从 `schools.json` 里取。

## 流程

1. **识别流派**：用 `aliases` 匹配用户说的名字。匹配不到时，列出现有流派，推荐最接近的一个，等用户确认。
2. **定主副**：按 `mixing.md` 第 2 条决定主流派（结构）和副流派（表皮）。如果做了替换（比如两个都是表皮流派），在输出第一行说明。用户说"原样""纯粹""只要 X 风格"时，主副都是 X，下文称"纯粹形态"。
3. **计算**：按 `mixing.md` 第 3 条算出质感强度和强调色数量，按第 4 条处理禁忌冲突。
4. **输出**：按下面的格式依次输出。用户只要其中一部分时，只给那一部分。
5. **做页面**（只在用户要求时）：用用户项目现有的技术栈实现，第 2 部分的 DESIGN.md 就是唯一的设计依据。用户没有项目时，写一个没有依赖的单文件 HTML。做完对照第 2 部分的"禁止"逐条自查，把结果作为最后一部分输出：每条一行，写"通过"或"未通过 + 原因"。

## 输出格式

### 1. 展签

一行：`主 · {主.name} {主.en}，副 · {副.name} {副.en}`；纯粹形态写 `{name} {en} 原样`。
再用一句话写出视觉主张，说清骨架和表皮各来自哪里。不要写"融合了 A 与 B 的精髓"这类空话。
然后两小段，分别介绍两个流派：先照抄 `intro`，再写一句"这次负责"（骨架：网格和标题字体；表皮：配色、质感和主视觉题材）。纯粹形态合成一段。

### 2. DESIGN.md

```markdown
# {主.name} × {副.name}（纯粹形态写 # {name} 原样）

## 主张
{一句话视觉主张}

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
- 文字放在 --accent 上用 --on-accent；放在 --accent2、--accent3 上时，在 --ink 和 --on-accent 里选对比度更高的那个，并保证 ≥ 4.5:1。
- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。
```

### 3. 写代码用的提示词

用一个代码块给出，让用户能直接贴进 Claude、Cursor、v0 这类工具。内容是第 2 部分的压缩版：先一句话说明风格，再列出 CSS 变量、字体、布局规则和禁止项。用中文写，token 值保持原样。结尾加一句"不要使用渐变文字、默认玻璃卡片、通用圆角阴影卡片网格"。

### 4. 生图用的提示词

用英文写，因为生图模型对英文更稳定。格式：

```
{主题}, {副.medium}, {主.structure.composition}, palette of {副.colorWords}, featuring {副.motifsEn}
Negative: {主.structure.negative + 副.negative，去重}
```

- 跨流派时，`composition` 里的颜色词（比如 black lines）按 mixing.md 第 3 条换成表皮的对应颜色。
- 负向词只在和副流派的 `medium` 或 `motifsEn` 整词冲突时删除（curves 对 whiplash curves 删；symmetry 对 asymmetric 不删），不要凭联想删。

用户没给主题时，按场景补一个具体主题（比如落地页就写这个产品的主视觉），不要写 "beautiful artwork" 这种空主题。只用流派名，不写艺术家名字。

## 规则

- 不往调色板里加新颜色，也不改颜色值。数据里的配色都过了对比度校验。
- 不给一个流派造它没有的结构。表皮流派（`roles` 里只有 `surface`）不能决定布局。
- 用户要求偏离数据时（比如"包豪斯但要圆角"），照做，并在展签下面用一句话写出偏离了哪条规则。
- 一次最多混合两个流派。用户给三个时，前两个做主副，第三个只贡献母题，并说明这么做的原因。

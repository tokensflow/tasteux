<!-- style-mix: minimalism+ink · schools.json v1 · 重新生成：node scripts/mix.mjs minimalism ink -->
# 极简主义 × 水墨

## 展签
主 · 极简主义 Minimalism，副 · 水墨 Chinese Ink Wash

**极简主义 Minimalism** · 骨架 · 1960s– · 美国

极简主义 1960 年代在纽约兴起，贾德、弗莱文是代表。它去掉表现和装饰，用工业材料、重复的单元和精确的边缘，让作品和所在的真实空间直接对话。

这次负责：
- 排版：单栏
- 标题字体：Instrument Sans

**水墨 Chinese Ink Wash** · 表皮 · 唐宋至今 · 中国

水墨画在唐代兴起、宋代成熟，讲究墨分五色。它用墨的浓淡干湿表现远近和气韵，画面常留大片空白，也常配有题跋和朱红印章。

这次负责：
- 配色：墨色分浓淡做层级
- 质感：宣纸上的淡墨晕染，边缘柔和，强度 0.15（水墨 0.5 被极简主义上限 0.15 截断）
- 主视觉：远山、留白

## 主张
极简主义搭骨架：单栏；水墨上颜色：墨色分浓淡做层级。

## 色彩
```css
:root {
  --bg: oklch(0.95 0.015 85);
  --surface: oklch(0.92 0.02 85);
  --ink: oklch(0.2 0.005 60);
  --muted: oklch(0.48 0.008 60);
  --line: oklch(0.72 0.01 70);
  --accent: oklch(0.5 0.17 28);
  --on-accent: oklch(0.97 0.01 85);
}
```
用法：墨色分浓淡做层级，朱红只做一方印章大小的 CTA 或标记，石青极少量。
只使用 1 个强调色（极简主义的规矩）。上面的用法如果提到更多颜色，以这一条为准。

## 字体
- 标题：font-family: "Instrument Sans", "PingFang SC", "Noto Sans SC", sans-serif；字重 500；字距 -0.03em
- 正文：font-family: "Instrument Sans", "PingFang SC", "Noto Sans SC", sans-serif；字重 400
- 中文标题：拉丁标题字体没有中文字形，中文会落到回退字体，所以中文标题单独指定 700–900 字重，和拉丁标题的分量一致；字距不要用负值
- Google Fonts：Instrument Sans:wght@400;500

## 布局
- 栅格：单栏，左对齐，正文宽度不超过 60 字符
- 规则：
  - 留白占画面六成以上
  - 只用 1px 细线分隔
  - 一屏只放一个焦点
  - 字号最多三级
  - 规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。
- 圆角：0；边框：1px 细线；阴影：无；密度：稀疏

## 质感
宣纸上的淡墨晕染，边缘柔和，强度 0.15（水墨 0.5 被极简主义上限 0.15 截断）
强度是质感的浓淡（0–1），按观感理解：0.15 几乎看不见，0.3 能看出，0.5 明显，0.6 很重。质感层铺在页面底色上、正文下层，不进卡片，不压文字。

## 母题
远山、留白、朱红印章、竖排题跋
母题首先用在主视觉和插图里。和骨架规则不冲突时，也可以做成界面上的单个图形，但不要铺成重复的底纹。有冲突时按 mixing.md 第 4 条只放进插图。

## 动效
几乎静止：只做透明度过渡，150ms ease-out。按下时也要有反馈。用键盘快捷键触发的状态切换不加过渡，遵守 prefers-reduced-motion。

## 禁止
- 装饰
- 图标堆砌
- 阴影
- 高饱和色
- 硬投影
- 满版填充
- 渐变文字、默认玻璃卡片、通用圆角阴影卡片网格

## 无障碍
- 正文与背景对比度 ≥ 4.5:1（--ink / --bg 15.65:1，--muted / --bg 5.66:1）。
- --accent 上的文字用 --on-accent（6.00:1）。
- --accent 可以直接做 --bg 上的文字色（5.66:1）。
- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。

## 提示词

### 写代码用
```text
请按下面的设计系统实现页面：极简主义（Minimalism）的结构 × 水墨（Chinese Ink Wash）的色彩与质感。
极简主义搭骨架：单栏；水墨上颜色：墨色分浓淡做层级。

【CSS 变量】
:root {
  --bg: oklch(0.95 0.015 85);
  --surface: oklch(0.92 0.02 85);
  --ink: oklch(0.2 0.005 60);
  --muted: oklch(0.48 0.008 60);
  --line: oklch(0.72 0.01 70);
  --accent: oklch(0.5 0.17 28);
  --on-accent: oklch(0.97 0.01 85);
}
用色：墨色分浓淡做层级，朱红只做一方印章大小的 CTA 或标记，石青极少量。
只使用 1 个强调色（极简主义的规矩）。上面的用法如果提到更多颜色，以这一条为准。

【字体】
标题：Instrument Sans 500，字距 -0.03em
正文：Instrument Sans 400
中文回退："PingFang SC", "Noto Sans SC", sans-serif；中文标题 700–900 字重，字距不用负值
Google Fonts：Instrument Sans:wght@400;500

【布局】
栅格：单栏，左对齐，正文宽度不超过 60 字符
- 留白占画面六成以上
- 只用 1px 细线分隔
- 一屏只放一个焦点
- 字号最多三级
规则里的颜色词只表示角色：黑线 = --line，黑字 = --ink，白格 = --bg，彩色格 = 强调色。
圆角 0；边框 1px 细线；阴影 无；密度 稀疏

【质感】宣纸上的淡墨晕染，边缘柔和，强度 0.15（水墨 0.5 被极简主义上限 0.15 截断），只铺在背景上，不盖住文字
【母题】远山、留白、朱红印章、竖排题跋。母题首先用在主视觉和插图里。和骨架规则不冲突时，也可以做成界面上的单个图形，但不要铺成重复的底纹。有冲突时按 mixing.md 第 4 条只放进插图。
【动效】几乎静止：只做透明度过渡，150ms ease-out。按下时也要有反馈。用键盘快捷键触发的状态切换不加过渡，遵守 prefers-reduced-motion。
【禁止】装饰、图标堆砌、阴影、高饱和色、硬投影、满版填充。不要使用渐变文字、默认玻璃卡片、通用圆角阴影卡片网格。
【无障碍】
- 正文与背景对比度 ≥ 4.5:1（--ink / --bg 15.65:1，--muted / --bg 5.66:1）。
- --accent 上的文字用 --on-accent（6.00:1）。
- --accent 可以直接做 --bg 上的文字色（5.66:1）。
- 焦点环 2px，颜色在 --ink 和 --accent 里选与所在背景对比度 ≥ 3:1 的那个。即使主流派禁止描边，焦点环也必须保留。
```

### 生图用
```text
{主题：按场景写一个具体画面}, Chinese ink wash painting, Song dynasty, monochrome ink on rice paper, dry brush texture, vast negative space, single focal element placed off-center, palette of sumi ink black, diluted grey wash, seal red, azurite blue, rice paper, featuring misty distant mountains, empty space, red seal stamp, vertical calligraphy inscription
Negative: clutter, ornament, shadow, saturated color, hard shadow, busy composition, western perspective, 3d render
```

## 迭代记录

官网 tasteux.com 的页面外壳（顶栏、章节、按钮、安装区）以本文件为准；图鉴图版、轮播海报和工作台预览展示的是其他组合，按各自流派的数据渲染，不受本文件约束。

| 日期 | 这一轮 | 偏离的规则 |
|---|---|---|
| 2026-11-27 | 补建 DESIGN.md：按 `site/style.css` 的现有变量，外壳最接近 极简主义 × 水墨（`--c-seal` 与水墨强调色完全一致，`--c-ink` / `--c-muted` 只差 0.01–0.02 亮度）。只记录现状，不改页面。 | 已有偏离，待确认是否保留：① 标题用 Noto Serif SC 700/900，不用 Instrument Sans；② 底色稍亮（`--c-paper` 0.972 0.006 85）；③ 工作台用深色"展厅"（`--c-room*`），不在调色板里；④ 图鉴和安装区是多栏，不是单栏；⑤ 按钮圆角 2px。 |
| 2026-11-27 | 改一个区块（安装）：在下载卡片前加"一行安装" `npx skills add 24kHandsome1201/style-mix`，带复制按钮；手机上命令不折行。 | 无 |
| 2026-11-27 | 改一个区块（首屏标题区）：h1 下加一句介绍，写明两个独有特点：按规则分骨架和表皮混合、附带网页插图用的生图提示词。`<title>`、meta、h1 不变。 | 无 |

# Style Mix（流派混合）

把两个艺术流派混成一套网页风格：一个流派当骨架，管排版、字体和动效；另一个当表皮，管配色、质感和母题。规则是固定的，不取平均，同一组合每次结果一样。每一组还附带网页插图用的生图提示词。

Mix two art movements into one web design system. One movement sets the skeleton (layout, type, motion), the other sets the skin (color, texture, motifs). Fixed rules, no averaging: the same pair gives the same result every time, plus an image-generation prompt for illustrations.

- 官网 / Website: https://tasteux.com
- 24 个流派 / 24 movements: Bauhaus, Ukiyo-e, Constructivism, De Stijl, Dunhuang murals, Blue-green landscape, Fauvism, Memphis, Art Deco…

## 安装 / Install

```sh
npx skills add 24kHandsome1201/tasteux
```

支持 Claude Code、Codex、Pi 等 agent。官网安装区也提供 curl 命令和 zip 下载。

Works with Claude Code, Codex, Pi and other agents that read `SKILL.md`. The website also offers curl and zip installs.

## 用法 / Usage

装好以后对 agent 说：

```text
用 style-mix 把首页做成构成主义 × 浮世绘
```

```text
Use style-mix to style this landing page as Bauhaus × Fauvism
```

输出包括展签、DESIGN.md、给代码 agent 的提示词，以及生图提示词。

You get a short label card, a DESIGN.md, a prompt for your coding agent, and an image-generation prompt.

## 目录 / Layout

- `skill/`: the agent skill (`SKILL.md`, `schools.json`, `references/mixing.md`)
- `site/`: the tasteux.com website source
- `scripts/`: site build, tests and deploy

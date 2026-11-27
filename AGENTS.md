# Style Mix

把两个艺术流派混成一套网页风格：一个 Agent 技能，加一个静态展示页。没有运行时依赖；发布前用原生 Node 生成可抓取的 HTML，不需要框架构建。

## 结构

- `skill/schools.json`：唯一数据源。24 个流派按年代排序，每个都有 `group`（east / classic / modern）、调色板（OKLCH）、质感、母题、生图媒介和色彩禁忌；能当骨架（主流派）的 10 个另有 `structure`（栅格、规则、字体、动效、布局禁忌、`accentSlots`、`textureCap`）。
- `skill/SKILL.md`：技能入口，规定输出格式（展签、DESIGN.md、代码提示词、生图提示词）。
- `skill/references/mixing.md`：混合规则。骨架管布局、字体和动效，表皮管颜色、质感和母题，不取平均。
- `skill/scripts/mix.mjs`：技能自带的零依赖 Node 脚本，按 mixing.md 输出完整 DESIGN.md（`--json` 输出计算结果）。它移植自 `site/app.js` 的 `mix()`、`designDoc()`、`codePrompt()`、`imagePrompt()` 和无障碍分级 `a11y()`，改动任何一边都要同步另一边；`scripts/mix.test.mjs` 检查 mixing.md 里写明的结果。技能版比工作台导出多三处：Google Stitch 格式的 YAML 前言（`x-style-mix` 记录组合，能过 `npx @google/design.md lint`；npm 0.4.0 不认 `motion` 键，所以动效只在正文里）、"适用范围"和"迭代记录"两节，以及生图提示词去掉会画成文字的母题并在负向词里禁止文字。`skill/references/format.md` 是没有 Node 时手算用的输出格式。
- `skill/scripts/check.mjs`：技能自带的浏览器检查，用 Node 22 自带的 WebSocket 走 Chrome DevTools 协议，不装依赖。按 DESIGN.md 在 1440 / 390 截图并检查对比度、圆角、阴影、配色、字体、溢出、焦点、减少动态效果和 SEO 基线。`scripts/check.test.mjs` 用合规和逐条违规的夹具页验证，本机没有 Chrome 时跳过。
- `site/`：展示页。`index.html` 的顺序是：Style Mix 品牌轮播开场 → 混合工作台（① 选骨架，用中性灰缩略图 → ② 选表皮，用主视觉卡片 → ③ 复制提示词、下载文件；右侧是预览、"这次变了什么"提示、对比开关、"认识这两个流派"两栏展签（`intro` 原文 + 按规则生成的"这次负责"）和可折叠的组合详情；手机上预览固定在顶部，展签移到选项后面）→ 图鉴（24 张图版，按钮会填回工作台）→ 流派用法与教程入口 → 安装。`style.css` 是页面外壳，`preview.css` 是示例书店页（`.pv`）的各骨架布局和质感，`app.js` 是 ES module，在静态图鉴上增强交互，不重复生成卡片；未生成的源码模板仍有客户端渲染兜底。源码预览读 `../skill/schools.json`；发布产物读同一资源版本内的 schools.json，避免长缓存的 JS 和新数据错配。`app.js` 里的 `mix()` 必须和 `mixing.md` 保持一致。
- `site/catalog.mjs`：浏览器和生成脚本共用的图鉴、骨架和表皮选项 HTML，以及已发布详情页的流派 ID。文字和初始选项尺寸在 HTML 中就有；图鉴正文默认可见，只有复杂缩略预览在靠近视口时才增强。
- `site/hero.mjs`：4 组精选品牌海报的文案、静态 HTML 和轮播增强；设计参数仍来自 schools.json。默认手动切换，自动播放需主动开启，聚焦 / 悬停 / 页面隐藏 / 离开视口会停止或暂停，减少动态效果时禁用自动播放。隐藏幻灯片不可聚焦；CTA 保留 #mix 分享格式并聚焦工作台标题。无 JS 显示首张与全部组合链接。图片按实际版式选择候选，字体只加载当前海报骨架；隐藏页初始仅保存 data-src / data-srcset，选中后才激活，避免提前下载大图。模块参与内容指纹。
- `site/fonts.mjs`：预览字体按当前选择、骨架悬停 / 聚焦和可见图鉴加载，按字体与字重规格去重；字体样式表加载失败可重试。页面外壳字体非阻塞加载，使用 display=optional；无 JS 或加载失败时使用系统字体。
- `site/install.mjs` / `scripts/skill-packages.mjs`：Pi、Claude Code、Codex 的下载卡片、原生安装目录、调用示例和 curl 命令。3 个命名 ZIP 与通用 ZIP 从同一份 skill/ 生成，只含 `SKILL_FILES` 列出的 style-mix/SKILL.md、schools.json、references/mixing.md、references/format.md、scripts/mix.mjs、scripts/check.mjs；不复制维护平台数据。安装命令不覆盖已有目录；先在目标父目录的临时目录完整下载，再移动为 style-mix，失败只清理本次临时目录，重试不会被残缺安装挡住；测试只写临时 HOME。原有 Devin / .agents 入口保留，Codex 使用 ~/.agents/skills。SKILL.md 采用标准 name / description / metadata.keywords 前言。
- `scripts/build-site.mjs`：生成完整首页、6 个流派详情页、1 篇教程、根路径的 robots.txt / sitemap.xml / _redirects。`scripts/editorial.mjs` 只保存场景、搭配和教程文案；流派简介、颜色、字体和规则仍从 schools.json 读取。生成产物不进 git，不要直接修改 deploy/public/。
- `site/img/<id>.jpg`：每个流派一张主视觉（1200x800），由表皮流派决定用哪张。原图、日志在 `.cache/`（不进 git）。
- `scripts/assets.mjs` / `site/images.mjs`：发布时生成 240 / 480 / 800 / 1200px WebP 和小尺寸 JPEG，派生缓存放在 `.cache/responsive-images/`，不覆盖原图。通过 picture / srcset / sizes 按显示尺寸和 DPR 选图；工作台随缩放和骨架形状更新尺寸。导出 HTML 必须内嵌完整 JPEG，并移除 source / srcset / sizes，不留下在线图片依赖。
- `/assets/<内容指纹>/`：生成的 JS、模块、CSS、图像和运行时数据放在同一个版本目录。只有此目录通过生成的 _headers 使用一年 immutable 缓存；HTML、技能文件和非版本路径继续重新验证。Python 不执行 _headers，真实缓存头需要部署后检查。公开图片、模块与 skill 资源允许不带凭据的跨域读取，以兼容仍打开的旧域页面；不对 HTML 或私有接口开放 CORS。

## 命令

- 部署：`scripts/deploy.sh`（加 `--dry-run` 不发布，但仍会重建 deploy/public/；保留旧指纹资源，不清空整个发布目录，避免旧页面的懒加载图片或 HTML 导出失效），先校验数据，再用生成脚本把站点和技能写进 `deploy/public/`，用 Cloudflare 新 CLI `cf`（1.0.0-beta.9，Workers 静态资源，配置在 `deploy/cloudflare.config.ts` 和 `deploy/wrangler.config.ts`）发布到 https://tasteux.com/（唯一正式入口，不再使用 `/site/`）。也可通过 GitHub Actions（`.github/workflows/deploy.yml`）在推送 `main` 分支时自动校验、构建并部署（需要 GitHub 仓库配置 `CLOUDFLARE_API_TOKEN`）。源码仍在 site/，发布时内容生成到 public/ 根目录；旧 `/site/` 路径 301 到对应根路径，旧指纹资源复制保留。发布前用 `cf auth whoami` 和只读 Worker API 请求核实登录；需要重新授权时运行 `cf auth login`（OAuth 设备码）。whoami 的缓存过期时间可能陈旧，不要只凭这个时间强制重新登录。`~/.npm` 缓存有 root 权限问题时加 `npm_config_cache=/tmp/npm-cache-cf`。`cf` 不支持旧版 Pages，别用 `cf pages deploy`。经用户确认，根域和 www 已从 tasteux-page 占位 Pages 项目解绑，占位项目保留。style-mix Worker 仅绑定 tasteux.com；www 和 style-mix.tasteux.com 使用代理 CNAME 和 .devin/domain-redirects.json 的 Cloudflare 301 规则（别名与旧路径三条，根域 HTTP → HTTPS 一条），不承载另一份网站。不得修改其他域名或删除备份项目。原绑定记录在 .devin/domain-migration-backup.json。
- 生成环境：需要 Node 22+、ImageMagick 的 `magick`、WebP 编码器 `cwebp` 和 `zip`；图片与 ZIP 工具仅用于发布时生成下载资源。技能包测试还使用 `unzip` 验证实际解压结果。本机已经安装；其他环境缺少时，生成脚本会报明确错误，不会静默跳过响应式图。
- 完整本地预览：先运行 `node scripts/build-site.mjs`（默认写到 `.cache/seo-preview/`，也可传入输出目录），再运行 `python3 scripts/preview.py`，打开 `http://127.0.0.1:8765/`；可用 `--port`、`--directory` 和 `--quiet` 调整预览。该服务把连接队列增大到 128，避免 macOS 默认 Python 服务在资源突发并发时出现 ECONNRESET。源码根目录预览只能检查客户端兜底，不能验证静态内容、详情页和 Sitemap；直接双击 HTML 读不到 JSON。Python 不会处理 Cloudflare 的 _redirects，旧路径与别名的 301 要在部署后检查。
- SEO / 性能自动测试：`node --test scripts/*.test.mjs`，检查无 JS 内容、元数据、JSON-LD、内链、Sitemap、HTML 转义、生成目录保护、所有图片尺寸和原图完整性、版本缓存、字体去重 / 重试，以及本地服务的 90 请求并发访问。测试使用临时输出目录，可复用图片派生缓存，不发布、不改源码。
- 轮播浏览器回归：完整预览与 Chrome DevTools 端口启动后，运行 `PREVIEW_ORIGIN=http://127.0.0.1:8765 CHROME_DEBUG_ORIGIN=http://127.0.0.1:19231 node scripts/check-carousel-browser.mjs`；覆盖 4 张海报、组合 CTA、键盘焦点、真实播放计时、减少动态效果、5 种宽度、无 JS、字体失败与图片回退。截图写入 .cache/，不发布。
- 上线后 HTTP 检查：`node scripts/check-published.mjs`（可用 SITE_ORIGIN 覆盖域名），验证真实 301、8 个 canonical 页面、Sitemap / robots、404、指纹缓存、保留资源、三个 ZIP 实际解压与临时 HOME 安装。线上浏览器回归用 `PREVIEW_ORIGIN=https://tasteux.com node scripts/check-carousel-browser.mjs`；导航必须同时等待本次唯一查询标记和 document.readyState=complete，避免旧 DOM 或未加载 CSS 的假失败；两个浏览器套件顺序运行，避免争用同一 Chrome 前台页面。CHECK_LEGACY_LINKS=1 会模拟仍打开的旧页面（包含其已经加载且 origin-clean 的旧样式），验证跨域图片读取、HTML 导出和旧 #mix 链接迁到根域后仍恢复组合。
- 校验数据：`node scripts/check-schools.mjs skill/schools.json`，检查必填字段，以及 `ink/bg ≥ 7`、`ink/surface ≥ 4.5`、`muted/bg ≥ 4.5`、`onAccent/accent ≥ 4.5`。
- JS 语法：`node --check site/app.js`。
- 生成主视觉：`scripts/gen-images.sh [id...]`，调用本地 Codex 的内置 `image_gen`（不需要 API key），3 个并发，已有的跳过。用户配置里的默认模型对 ChatGPT 账号不可用，脚本固定传 `-m gpt-6-sol`（可用 `CODEX_MODEL` 覆盖）。`node scripts/gen-images.mjs <id>` 只打印提示词。重新生成某张：删掉 `.cache/images/<id>.png` 再跑。生成后必须逐张看图，有文字、数字、水印就重来。
- 截图：`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1440,900 --virtual-time-budget=8000 --screenshot=out.png "http://localhost:8765/#mix=bauhaus+fauvism"`（hash 只设定组合，不自动跳过品牌轮播；点击轮播 CTA 会滚动并聚焦工作台）。交互要用 DevTools 协议测：Chrome 加 `--remote-debugging-port`，用 Node 22 自带的 `WebSocket` 发 `Runtime.evaluate` 点击、`Emulation.setDeviceMetricsOverride` 模拟 390px。整页用 16000 高的窗口再用 `sips -c <h> <w> --cropOffset <y> 0` 切段（y 至少为 1）。headless Chrome 的窗口不能窄于约 500px，看手机宽度要把页面放进一个 390px 宽的 iframe 里再截。

## 加一个流派

1. 在 `schools.json` 里加一项，字段照抄同类流派，放到年代对应的位置。只做表皮的流派不要写 `structure`。新质感类型要同时加进 `textureKinds` 和 `preview.css`。
2. 跑校验脚本，对比度不达标就调整颜色，不要放宽阈值。
3. 如果它能当骨架，在 `site/preview.css` 里加一段 `.pv[data-structure="<id>"]` 布局（包括 `.pv-img` 的形状），并在 `@container (max-width: 560px)` 里检查单栏是否正常。
4. 跑 `scripts/gen-images.sh <id>` 生成主视觉并看图。
5. 把它的中文名加进 `SKILL.md` 的 `metadata.keywords`，并检查 description 的触发描述。

## 约定

- 生图提示词只写流派名，不写艺术家名字；母题里不要写会诱导出文字的东西（题款、报纸字母）。
- 质感只铺在页面底色上（`.pv-tex` 在内容下层），主视觉图也不能压在正文下面。
- 页面 UI 文案用中文；生图提示词用英文。

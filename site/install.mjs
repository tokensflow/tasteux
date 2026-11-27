import { esc } from "./catalog.mjs";

export const INSTALL_TARGETS = [
  { id: "pi", label: "Pi", dir: "~/.pi/agent/skills/style-mix", invocation: "/skill:style-mix 用包豪斯 × 野兽派设计一个网页", activation: "安装后在 Pi 中运行 /reload，再用 /skill:style-mix 调用。", archive: "/skill/downloads/style-mix-pi.zip" },
  { id: "claude", label: "Claude Code", dir: "~/.claude/skills/style-mix", invocation: "/style-mix 用包豪斯 × 野兽派设计一个网页", activation: "在 Claude Code 的新会话中用 /style-mix 调用。", archive: "/skill/downloads/style-mix-claude.zip" },
  { id: "codex", label: "Codex", dir: "~/.agents/skills/style-mix", invocation: "$style-mix 用包豪斯 × 野兽派设计一个网页", activation: "在 Codex 中输入 $style-mix，或从 /skills 选择；没有出现时重启 Codex。", archive: "/skill/downloads/style-mix-codex.zip" },
  { id: "devin", label: "Devin", dir: "~/.config/devin/skills/style-mix", invocation: "/style-mix 用包豪斯 × 野兽派设计一个网页", activation: "在 Devin 的新会话中用 /style-mix 调用。", archive: "/skill/downloads/style-mix.zip" },
  { id: "agents", label: "通用 · .agents", dir: "~/.agents/skills/style-mix", invocation: "用 style-mix 技能，按包豪斯 × 野兽派设计一个网页", activation: "适用于读取 .agents/skills 的工具；具体调用语法以工具文档为准。", archive: "/skill/downloads/style-mix.zip" },
];

export const SKILL_FILES = ["SKILL.md", "schools.json", "references/mixing.md", "references/format.md", "scripts/mix.mjs"];
const quote = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

export function installCommand(target, pageUrl) {
  const base = new URL("../skill/", pageUrl);
  if (!["https:", "http:"].includes(base.protocol)) throw new Error("技能下载需要 HTTP 或 HTTPS 地址");
  return [
    "(",
    "  set -eu",
    `  d="$HOME${target.dir.slice(1)}"`,
    '  if [ -e "$d" ] || [ -L "$d" ]; then',
    '    printf "%s\\n" "安装目录已存在：${d}；请先备份并确认更新。" >&2',
    "    exit 1",
    "  fi",
    '  mkdir -p "${d%/*}"',
    '  tmp=$(mktemp -d "${d%/*}/.style-mix.XXXXXXXX")',
    '  trap \'rm -rf "$tmp"\' EXIT',
    "  curl -fsSL --fail-early --create-dirs \\",
    ...SKILL_FILES.map((file, i) => `    -o "$tmp/${file}" ${quote(new URL(file, base).href)}${i < SKILL_FILES.length - 1 ? " \\" : ""}`),
    '  test ! -e "$d" && test ! -L "$d"',
    '  mv "$tmp" "$d"',
    "  trap - EXIT",
    ")",
  ].join("\n");
}

export function targetButtonsMarkup(selected) {
  return INSTALL_TARGETS.map((t) => `<button class="btn btn-sm" type="button" data-target="${t.id}" aria-pressed="${t.id === selected}">${esc(t.label)}</button>`).join("");
}

export function skillVersionsMarkup() {
  return INSTALL_TARGETS.slice(0, 3).map((t) => `<article class="skill-version"><h3>${esc(t.label)} 版本</h3><a class="btn btn-sm" href="${t.archive}" download="style-mix-${t.id}.zip">下载技能包 .zip</a><p>解压后，将整个 <code>style-mix</code> 文件夹放到：</p><code class="skill-dir">${esc(t.dir)}</code><p class="skill-activation">${esc(t.activation)}</p><code class="skill-call">${esc(t.invocation)}</code></article>`).join("");
}

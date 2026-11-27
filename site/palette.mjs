// 示例网页（.pv）的配色变量。工作台（app.js）和静态流派页（build-site.mjs）共用，两边颜色一致。

function luminance(color) {
  const [L, C, H] = color.match(/oklch\(([^)]+)\)/)[1].trim().split(/\s+/).map(Number);
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

export function contrast(x, y) {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

export const readableOn = (bg, candidates) => candidates.reduce((best, c) => (contrast(c, bg) > contrast(best, bg) ? c : best));

// 骨架只给 accentSlots 个强调色：多出来的槽位退回到 surface / muted / accent2。
function slotted(p, slots) {
  if (slots >= 3) return p;
  return { ...p, accent2: slots < 2 ? p.surface : p.accent2, accent3: slots < 2 ? p.muted : p.accent2 };
}

export function paletteVars(palette, slots) {
  const p = slotted(palette, slots);
  return {
    "--bg": p.bg,
    "--surface": p.surface,
    "--ink": p.ink,
    "--muted": p.muted,
    "--line": p.line,
    "--accent": p.accent,
    "--on-accent": p.onAccent,
    "--accent2": p.accent2,
    "--accent3": p.accent3,
    "--on-accent2": readableOn(p.accent2, [p.ink, p.onAccent, p.bg]),
    "--on-accent3": readableOn(p.accent3, [p.ink, p.onAccent, p.bg]),
    "--accent-text": contrast(p.accent, p.bg) >= 3 ? p.accent : p.ink,
  };
}

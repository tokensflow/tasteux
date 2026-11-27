import fs from "node:fs";
const data = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const lum = (s) => {
  const [L, C, H] = s.match(/oklch\(([^)]+)\)/)[1].trim().split(/\s+/).map(Number);
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const q = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const c = (v) => Math.min(1, Math.max(0, v));
  const r = c(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * q);
  const g = c(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * q);
  const bl = c(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * q);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
};
const cr = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
const req = ["id", "name", "en", "aliases", "era", "group", "roles", "essence", "intro", "palette", "colorWords", "colorUsage", "texture", "motifs", "motifsEn", "medium", "dont", "negative"];
const sreq = ["dont", "negative", "grid", "composition", "rules", "radius", "border", "shadow", "density", "accentSlots", "textureCap", "type", "motion"];
let fail = 0;
for (const s of data.schools) {
  for (const k of req) if (s[k] == null) { console.log(`${s.id}: missing ${k}`); fail++; }
  if (!data.textureKinds[s.texture.kind]) { console.log(`${s.id}: bad texture ${s.texture.kind}`); fail++; }
  if (s.roles.includes("structure")) for (const k of sreq) if (s.structure?.[k] == null) { console.log(`${s.id}: missing structure.${k}`); fail++; }
  // Google Fonts 只请求用得到的字重：只当标题字体的族只要标题字重；document.fonts.check 在多请求的字重没加载时会误报
  const t = s.structure?.type;
  for (const g of t?.google ?? []) {
    const [fam, w] = g.split(":wght@");
    const weights = w ? w.split(";").map(Number) : [400];
    if (fam === t.display.family && !weights.includes(t.display.weight)) { console.log(`${s.id}: ${g} lacks display weight ${t.display.weight}`); fail++; }
    if (fam === t.display.family && fam !== t.body.family && weights.some((x) => x !== t.display.weight)) { console.log(`${s.id}: ${g} requests weights the display face never uses`); fail++; }
  }
  const p = s.palette;
  const checks = [["ink/bg", p.ink, p.bg, 7], ["ink/surface", p.ink, p.surface, 4.5], ["muted/bg", p.muted, p.bg, 4.5], ["onAccent/accent", p.onAccent, p.accent, 4.5]];
  const out = checks.map(([n, a, b, min]) => { const v = cr(a, b); if (v < min) fail++; return `${n} ${v.toFixed(2)}${v < min ? " FAIL" : ""}`; });
  console.log(s.id.padEnd(15), out.join("  "));
}
console.log(fail ? `${fail} problems` : "ok");
process.exit(fail ? 1 : 0);

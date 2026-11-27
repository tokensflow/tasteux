#!/usr/bin/env node
// Print the image-generation prompt for one school (argv id) or all schools.
// Usage: node scripts/gen-images.mjs [id]        -> prompt text
//        node scripts/gen-images.mjs --ids        -> all ids, one per line, file order
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "skill/schools.json"), "utf8"));
const schools = data.schools;

export function prompt(s) {
  const avoid = [...new Set([...(s.negative ?? []), ...(s.structure?.negative ?? [])])];
  return [
    "Use case: stylized-concept",
    "Asset type: main visual for a web style specimen page, landscape 3:2, full bleed, no border or frame",
    "Subject: books and a quiet reader; the idea of reading slowly, for an independent bookstore",
    `Style/medium: ${s.medium}`,
    `Composition/framing: ${s.structure?.composition ?? "balanced composition with generous negative space"}`,
    `Color palette: ${(s.colorWords ?? []).join(", ")}`,
    `Motifs: ${(s.motifsEn ?? []).join(", ")}`,
    "Constraints: no text, no letters, no numbers, no logos, no watermark, no signature; do not imitate any specific named artist",
    `Avoid: ${avoid.join(", ")}`,
  ].join("\n");
}

const arg = process.argv[2];
if (arg === "--ids") {
  console.log(schools.map((s) => s.id).join("\n"));
} else if (arg) {
  const s = schools.find((x) => x.id === arg);
  if (!s) {
    console.error(`unknown school id: ${arg}`);
    process.exit(1);
  }
  console.log(prompt(s));
} else {
  for (const s of schools) console.log(`### ${s.id}\n${prompt(s)}\n`);
}

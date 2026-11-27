import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";
import { test } from "node:test";

const exec = promisify(execFile);
const script = new URL("../skill/scripts/mix.mjs", import.meta.url).pathname;
const run = async (...args) => (await exec(process.execPath, [script, ...args])).stdout;
const json = async (...args) => JSON.parse(await run(...args, "--json"));

test("Bauhaus × Fauvism matches the worked example in mixing.md", async () => {
  const m = await json("包豪斯", "野兽派");
  assert.equal(m.structure, "bauhaus");
  assert.equal(m.surface, "fauvism");
  assert.equal(m.textureLevel, 0.4);
  assert.deepEqual(m.accents, ["accent", "accent2", "accent3"]);
  assert.ok(m.dont.includes("大圆角卡片") && m.dont.includes("灰调"));
  assert.ok(!m.dont.includes("渐变"), "Bauhaus colour taboos stay behind when Fauvism owns colour");
});

test("structure order follows roles, not the order the user typed", async () => {
  const m = await json("印象派", "包豪斯");
  assert.equal(m.structure, "bauhaus");
  assert.equal(m.surface, "impressionism");
});

test("two surface-only schools fall back to Minimalism and the second only adds motifs", async () => {
  const m = await json("浮世绘", "水墨");
  assert.equal(m.structure, "minimalism");
  assert.equal(m.surface, "ukiyo-e");
  assert.deepEqual(m.accents, ["accent"]);
  assert.equal(m.textureLevel, 0.15);
  assert.match(m.notes[0], /极简主义/);
  const doc = await run("浮世绘", "水墨");
  assert.match(doc, /^---\nversion: alpha\n[\s\S]*^x-style-mix: "minimalism\+ukiyo-e"/m);
});

test("negatives drop only whole-word conflicts with the surface imagery", async () => {
  assert.ok(!(await json("风格派", "新艺术运动")).negative.includes("curves"));
  assert.ok((await json("风格派", "浮世绘")).negative.includes("curves"));
});

test("image prompts drop motifs that models render as garbled text", async () => {
  const prompt = (await run("minimalism", "ink")).split("### 生图用")[1];
  assert.doesNotMatch(prompt, /calligraphy inscription|seal stamp/);
  assert.match(prompt, /Negative: .*\btext, letters, calligraphy, watermark, signature/);
  // 达达的媒介本身就是剪报和混排字体，不能再禁止文字
  assert.match((await run("dada")).split("### 生图用")[1], /Negative: (?![^\n]*\bletters\b)[^\n]*watermark, signature/);
});

test("rules learned from the originals hold in the data", async () => {
  const sup = (await run("suprematism")).split("## 布局")[1];
  assert.match(sup, /主对角线倾斜（和竖直方向成约 20–35°）/);
  assert.doesNotMatch(sup, /各自倾斜 4–20°/);
  assert.match((await run("de-stijl")).split("## 布局")[1], /约占一成，不超过两成/);
});

test("surface schools with public-domain originals list them with source and license", async () => {
  const doc = await run("constructivism", "ukiyo-e");
  const section = doc.split("## 原作")[1].split("\n## ")[0];
  assert.match(section, /神奈川冲浪里.*CC0.*https:\/\/www\.artic\.edu\/artworks\/24645/);
  assert.match(section, /不加滤镜/);
  assert.match(doc, /original composition, do not reproduce any famous artwork/);
  assert.doesNotMatch(await run("minimalism"), /## 原作/, "没有原作的流派不出这一节");
});

test("inverse blocks, Chinese display headings and textures follow fixed rules", async () => {
  const doc = await run("constructivism", "ukiyo-e");
  assert.match(doc, /反相区块.*--ink 做底，--bg 做字（\d+\.\d+:1）/);
  assert.match(doc, /中文大标题不套用全大写和窄体/);
  assert.doesNotMatch(await run("bauhaus"), /中文大标题不套用/, "包豪斯的标题不是全大写窄体");
  assert.match(doc, /data-texture="paper"/);
  const css = await fs.readFile(new URL("../skill/references/textures.css", import.meta.url), "utf8");
  const kinds = JSON.parse(await fs.readFile(new URL("../skill/schools.json", import.meta.url), "utf8")).textureKinds;
  for (const k of Object.keys(kinds)) assert.ok(css.includes(`[data-texture="${k}"]`), k);
});

test("accessibility never promises 4.5:1 text on an accent that cannot reach it", async () => {
  const m = await json("包豪斯", "巴洛克");
  const line = m.accessibility.find((x) => x.startsWith("- --accent2 "));
  assert.match(line, /只做色块和插图，不放文字/);
  const ok = (await json("包豪斯", "野兽派")).accessibility.find((x) => x.startsWith("- --accent3 上"));
  assert.match(ok, /上的文字用 --ink/);
});

test("an unknown school fails and lists the available ones", async () => {
  await assert.rejects(run("赛博朋克"), (error) => error.code === 1 && /现有流派：.*包豪斯/.test(error.stderr));
});

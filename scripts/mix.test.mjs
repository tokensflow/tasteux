import assert from "node:assert/strict";
import { execFile } from "node:child_process";
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
  assert.match(doc, /^<!-- style-mix: minimalism\+ukiyo-e /);
});

test("negatives drop only whole-word conflicts with the surface imagery", async () => {
  assert.ok(!(await json("风格派", "新艺术运动")).negative.includes("curves"));
  assert.ok((await json("风格派", "浮世绘")).negative.includes("curves"));
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

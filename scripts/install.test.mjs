import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";
import { INSTALL_TARGETS, installCommand, skillVersionsMarkup } from "../site/install.mjs";
import { buildSkillPackages } from "./skill-packages.mjs";

const exec = promisify(execFile);
const source = new URL("../skill/", import.meta.url).pathname;
const files = ["SKILL.md", "schools.json", "references/mixing.md", "references/format.md", "references/textures.css", "scripts/mix.mjs", "scripts/check.mjs"];
const required = {
  pi: ["~/.pi/agent/skills/style-mix", "/skill:style-mix"],
  claude: ["~/.claude/skills/style-mix", "/style-mix"],
  codex: ["~/.agents/skills/style-mix", "$style-mix"],
};

test("platform versions expose native install directories, invocation examples and ZIPs", () => {
  const html = skillVersionsMarkup();
  for (const [id, [dir, invocation]] of Object.entries(required)) {
    const target = INSTALL_TARGETS.find((t) => t.id === id);
    assert.equal(target.dir, dir);
    assert.ok(target.invocation.startsWith(invocation));
    assert.ok(html.includes(`style-mix-${id}.zip`));
    assert.ok(html.includes(dir));
    assert.ok(html.includes(invocation));
  }
  assert.ok(INSTALL_TARGETS.some((t) => t.id === "devin"));
});

test("generated platform archives extract into a single skill with identical complete resources", async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-packages-"));
  try {
    await buildSkillPackages(output);
    for (const id of ["pi", "claude", "codex", "agents"]) {
      const target = INSTALL_TARGETS.find((t) => t.id === id);
      const archive = path.join(output, target.archive);
      const { stdout } = await exec("unzip", ["-Z1", archive]);
      assert.deepEqual(stdout.trim().split("\n").sort(), files.map((f) => `style-mix/${f}`).sort());
      const extracted = path.join(output, `extracted-${id}`);
      await fs.mkdir(extracted);
      await exec("unzip", ["-q", archive, "-d", extracted]);
      for (const file of files) assert.deepEqual(await fs.readFile(path.join(extracted, "style-mix", file)), await fs.readFile(path.join(source, file)));
      const skill = await fs.readFile(path.join(extracted, "style-mix/SKILL.md"), "utf8");
      const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/)[1];
      assert.equal(frontmatter.match(/^name: (.+)$/m)[1], "style-mix");
      assert.ok(JSON.parse(frontmatter.match(/^description: (.+)$/m)[1]).length <= 1024);
      assert.ok(frontmatter.includes("metadata:\n  keywords:"));
      assert.ok(!frontmatter.includes("when_to_use:"));
    }
  } finally { await fs.rm(output, { recursive: true, force: true }); }
});

test("every displayed installer downloads a complete skill and refuses an existing installation", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-install-home-"));
  let missing = false;
  const server = http.createServer(async (req, res) => {
    const file = files.find((f) => req.url === `/skill/${f}`);
    if (!file || (missing && file === "schools.json")) { res.writeHead(404); res.end(); return; }
    res.end(await fs.readFile(path.join(source, file)));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const target of INSTALL_TARGETS) {
      const targetHome = path.join(home, target.id);
      await fs.mkdir(targetHome);
      const command = installCommand(target, `${origin}/site/#install`);
      await exec("bash", ["-c", command], { env: { ...process.env, HOME: targetHome } });
      const dir = path.join(targetHome, target.dir.slice(2));
      for (const file of files) assert.deepEqual(await fs.readFile(path.join(dir, file)), await fs.readFile(path.join(source, file)));
      await fs.writeFile(path.join(dir, "SKILL.md"), "user modification");
      await assert.rejects(exec("bash", ["-c", command], { env: { ...process.env, HOME: targetHome } }), (error) => error.stderr.includes("已存在"));
      assert.equal(await fs.readFile(path.join(dir, "SKILL.md"), "utf8"), "user modification");
    }
    missing = true;
    const failedHome = path.join(home, "failed");
    await fs.mkdir(failedHome);
    const retryCommand = installCommand(INSTALL_TARGETS[0], `${origin}/site/`);
    const retryEnv = { ...process.env, HOME: failedHome };
    await assert.rejects(exec("bash", ["-c", retryCommand], { env: retryEnv }), (error) => error.stderr.includes("404"));
    const parent = path.dirname(path.join(failedHome, INSTALL_TARGETS[0].dir.slice(2)));
    assert.deepEqual(await fs.readdir(parent), []);
    missing = false;
    await exec("bash", ["-c", retryCommand], { env: retryEnv });
    const installed = path.join(failedHome, INSTALL_TARGETS[0].dir.slice(2));
    for (const file of files) assert.deepEqual(await fs.readFile(path.join(installed, file)), await fs.readFile(path.join(source, file)));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(home, { recursive: true, force: true });
  }
});

test("installer quotes download addresses and rejects non-HTTP URLs", () => {
  const command = installCommand(INSTALL_TARGETS[0], "https://example.com/a'quote/site/");
  assert.ok(command.includes("'\\''"));
  assert.throws(() => installCommand(INSTALL_TARGETS[0], "file:///site/"), /HTTP/);
});

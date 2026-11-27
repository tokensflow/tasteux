import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildSite } from "./build-site.mjs";

test("local preview survives a burst of concurrent asset requests", async (t) => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-preview-test-"));
  let child;
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill();
      await once(child, "exit");
    }
    await fs.rm(output, { recursive: true, force: true });
  });
  await buildSite(output);
  child = spawn("python3", [fileURLToPath(new URL("./preview.py", import.meta.url)), "--port", "0", "--directory", output, "--quiet"]);
  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("预览服务没有启动")), 10000);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const match = stdout.match(/http:\/\/127\.0\.0\.1:\d+\//);
      if (match) { clearTimeout(timeout); resolve(match[0]); }
    });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => { clearTimeout(timeout); reject(error); });
    child.once("exit", () => { clearTimeout(timeout); reject(new Error(stderr || "预览服务提前退出")); });
  });
  const page = await fetch(url);
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes("网页设计风格与 AI 提示词生成器"));
  const results = await Promise.all(Array.from({ length: 90 }, async () => {
    const response = await fetch(new URL("../skill/schools.json", url), { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    return (await response.json()).schools.length;
  }));
  assert.ok(results.every((count) => count === 24));
  assert.equal((await fetch(new URL("/missing-preview-page", url))).status, 404);
});

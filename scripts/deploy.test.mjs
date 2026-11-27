import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";

const exec = promisify(execFile);

test("deployment rebuilds current pages without deleting prior immutable releases", async () => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-deploy-test-"));
  try {
    const scripts = path.join(fixture, "scripts");
    const pub = path.join(fixture, "deploy/public");
    const previous = path.join(pub, "site/assets/previous/app.js");
    await fs.mkdir(scripts);
    await fs.mkdir(path.dirname(previous), { recursive: true });
    await fs.mkdir(path.join(fixture, "deploy/node_modules"));
    await fs.mkdir(path.join(fixture, "bin"));
    await fs.writeFile(previous, "previous immutable content");
    await fs.copyFile(new URL("./deploy.sh", import.meta.url), path.join(scripts, "deploy.sh"));
    await fs.writeFile(path.join(scripts, "check-schools.mjs"), "process.exit(0);\n");
    await fs.writeFile(path.join(scripts, "build-site.mjs"), 'import fs from "node:fs/promises";import path from "node:path";await fs.mkdir(path.join(process.argv[2],"site"),{recursive:true});await fs.writeFile(path.join(process.argv[2],"site/index.html"),"current page");\n');
    await fs.writeFile(path.join(fixture, "bin/cf"), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 });
    const { stdout } = await exec("bash", [path.join(scripts, "deploy.sh"), "--dry-run"], { env: { ...process.env, PATH: `${path.join(fixture, "bin")}:${process.env.PATH}` } });
    assert.equal(await fs.readFile(previous, "utf8"), "previous immutable content");
    assert.equal(await fs.readFile(path.join(pub, "site/index.html"), "utf8"), "current page");
    assert.equal(stdout, "deploy\n--dry-run\n");
  } finally {
    await fs.rm(fixture, { recursive: true, force: true });
  }
});

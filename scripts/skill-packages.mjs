import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { INSTALL_TARGETS, SKILL_FILES } from "../site/install.mjs";

const exec = promisify(execFile);
const source = fileURLToPath(new URL("../skill/", import.meta.url));

export async function buildSkillPackages(output) {
  const dir = path.join(output, "skill/downloads");
  await fs.mkdir(dir, { recursive: true });
  const staging = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-skill-stage-"));
  try {
    for (const file of SKILL_FILES) {
      const destination = path.join(staging, "style-mix", file);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(path.join(source, file), destination);
    }
    const archives = [...new Set(INSTALL_TARGETS.map((t) => path.basename(t.archive)))];
    for (const archive of archives) {
      const zipped = path.join(staging, archive);
      try {
        await exec("zip", ["-q", "-X", zipped, ...SKILL_FILES.map((file) => `style-mix/${file}`)], { cwd: staging });
      } catch (error) {
        if (error.code === "ENOENT") throw new Error("生成技能下载包需要本地 zip 命令；网站运行时没有这个依赖。");
        throw error;
      }
      await fs.copyFile(zipped, path.join(dir, archive));
    }
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

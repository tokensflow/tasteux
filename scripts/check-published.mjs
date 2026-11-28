import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import https from "node:https";
import { isIP } from "node:net";
import { FEATURED_IDS } from "../site/catalog.mjs";
import { INSTALL_TARGETS, installCommand, SKILL_FILES } from "../site/install.mjs";

const origin = process.env.SITE_ORIGIN ?? "https://tasteux.com";
const exec = promisify(execFile);
const legacyAddress = process.env.LEGACY_RESOLVE_ADDRESS;
if (legacyAddress) assert.ok(isIP(legacyAddress));
const probeRedirect = async (url) => {
  if (!legacyAddress || new URL(url).hostname !== "style-mix.tasteux.com") return fetch(url, { redirect: "manual" });
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method: "HEAD", lookup: (host, options, callback) => options.all ? callback(null, [{ address: legacyAddress, family: isIP(legacyAddress) }]) : callback(null, legacyAddress, isIP(legacyAddress)) }, (response) => {
      response.resume();
      resolve({ status: response.statusCode, headers: new Headers(response.headers) });
    });
    request.setTimeout(15000, () => request.destroy(new Error("旧域名 HTTPS 检查超时")));
    request.on("error", reject);
    request.end();
  });
};
const get = async (url, options) => {
  const response = await fetch(new URL(url, origin), options);
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  return response;
};
const redirect = await fetch(`${origin}/site/`, { redirect: "manual" });
assert.equal(redirect.status, 301);
assert.equal(new URL(redirect.headers.get("location"), origin).href, `${origin}/`);
const httpUpgrade = await fetch(`${origin.replace(/^https:/, "http:")}/?scheme=check`, { redirect: "manual" });
assert.equal(httpUpgrade.status, 301);
assert.equal(httpUpgrade.headers.get("location"), `${origin}/?scheme=check`);
const html = await (await get("/")).text();
assert.ok(html.includes(`rel="canonical" href="${origin}/"`));
assert.equal((html.match(/class="hero-slide"/g) ?? []).length, 4);
assert.equal((html.match(/class="plate reveal"/g) ?? []).length, 24);
assert.equal((html.match(/class="skill-version"/g) ?? []).length, 3);
const base = html.match(/src="(\/assets\/[a-f0-9]{16}\/)app\.js"/)[1];
const immutable = (response) => {
  const cache = response.headers.get("cache-control");
  assert.ok(cache?.includes("max-age=31536000") && cache.includes("immutable"), cache);
};
const asset = await get(`${base}app.js`);
immutable(asset);
assert.equal(asset.headers.get("access-control-allow-origin"), "*");
const runtime = await (await get(`${base}schools.json`)).json();
assert.equal(runtime.schools.length, 24);
const sitemap = await (await get("/sitemap.xml")).text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const zhUrls = ["/", ...FEATURED_IDS.map((id) => `/schools/${id}/`), "/guides/art-movement-web-design/", "/about/", "/privacy/"];
assert.deepEqual([...urls].sort(), [...zhUrls, ...zhUrls.map((url) => `/en${url}`)].map((url) => origin + url).sort());
for (const url of urls) {
  const page = await (await get(url)).text();
  assert.ok(page.includes(`rel="canonical" href="${url}"`));
}
assert.ok((await (await get("/robots.txt")).text()).includes(`Sitemap: ${origin}/sitemap.xml`));
const llms = await get("/llms.txt");
assert.ok((await llms.text()).includes("npx skills add tokensflow/tasteux"));
assert.ok((await (await get("/privacy/")).text()).includes('rel="canonical" href="https://tasteux.com/privacy/"'));
assert.equal((await fetch(`${origin}/schools/not-a-published-school/`)).status, 404);
const versions = [];
const home = await fs.mkdtemp(path.join(os.tmpdir(), "style-mix-published-check-"));
try {
  for (const target of INSTALL_TARGETS.slice(0, 3)) {
    const archive = await get(target.archive);
    assert.ok(archive.headers.get("content-type")?.includes("zip"));
    const bytes = Buffer.from(await archive.arrayBuffer());
    const zip = path.join(home, `${target.id}.zip`);
    await fs.writeFile(zip, bytes);
    const { stdout } = await exec("unzip", ["-Z1", zip]);
    assert.deepEqual(stdout.trim().split("\n").sort(), SKILL_FILES.map((file) => `style-mix/${file}`).sort());
    const userHome = path.join(home, target.id);
    await fs.mkdir(userHome);
    await exec("bash", ["-c", installCommand(target, `${origin}/`)], { env: { ...process.env, HOME: userHome } });
    const installed = path.join(userHome, target.dir.slice(2));
    for (const file of SKILL_FILES) assert.deepEqual(await fs.readFile(path.join(installed, file)), await fs.readFile(new URL(`../skill/${file}`, import.meta.url)));
    versions.push({ id: target.id, bytes: bytes.length, installed: true });
  }
  const releases = await fs.readdir(new URL("../deploy/public/assets/", import.meta.url));
  for (const release of releases.filter((id) => /^[a-f0-9]{16}$/.test(id))) {
    immutable(await get(`/assets/${release}/images/fauvism.jpg`, { method: "HEAD" }));
  }
  const aliases = ["https://www.tasteux.com", "https://style-mix.tasteux.com"];
  for (const alias of aliases) {
    for (const oldPath of ["/", "/site", "/site/", "/site/schools/bauhaus/?from=old", "/site/guides/art-movement-web-design/", "/skill/downloads/style-mix-codex.zip"]) {
      const response = await probeRedirect(alias + oldPath);
      assert.equal(response.status, 301, alias + oldPath);
      const destination = oldPath.replace(/^\/site(?=\/|$)/, "") || "/";
      assert.equal(new URL(response.headers.get("location"), alias).href, origin + destination);
      await get(origin + destination);
    }
  }
  console.log(JSON.stringify({ origin, aliases, legacyDnsOverride: Boolean(legacyAddress), redirect: 301, canonicalPages: urls.length, release: base, immutable: true, retainedReleases: releases.length, unknownPage: 404, versions }, null, 2));
} finally {
  await fs.rm(home, { recursive: true, force: true });
}

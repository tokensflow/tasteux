import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { HERO_SLIDES } from "../site/hero.mjs";

const origin = process.env.PREVIEW_ORIGIN ?? "http://127.0.0.1:18866";
const debug = process.env.CHROME_DEBUG_ORIGIN ?? "http://127.0.0.1:19231";
const tab = await (await fetch(`${debug}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
const errors = [];
let cachedDocument;
const cachedStyles = new Map();
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (pending.has(message.id)) {
    const { resolve, reject, timer } = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(timer);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails);
  if (message.method === "Fetch.requestPaused") {
    const css = cachedStyles.get(new URL(message.params.request.url).pathname);
    send("Fetch.fulfillRequest", { requestId: message.params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: css ? "text/css" : "text/html; charset=utf-8" }], body: (css ?? cachedDocument).toString("base64") });
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const key = ++id;
  const timer = setTimeout(() => { pending.delete(key); reject(new Error(`Timeout: ${method}`)); }, 20000);
  pending.set(key, { resolve, reject, timer });
  ws.send(JSON.stringify({ id: key, method, params }));
});
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (expression) => {
  for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await wait(100); }
  throw new Error(`Not ready: ${expression}`);
};
const navigate = async (ready = 'document.querySelector("#showcase")?.dataset.enhanced') => {
  const url = new URL(`${origin}/?carousel-check=${Date.now()}`);
  await send("Page.navigate", { url: url.href });
  await waitFor(`location.search === ${JSON.stringify(url.search)} && document.readyState === "complete" && (${ready})`);
};
const screenshot = async (name) => {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  await fs.writeFile(new URL(`../.cache/${name}.png`, import.meta.url), Buffer.from(data, "base64"));
};
const current = () => evaluate('document.querySelector(".hero-slide:not([hidden])")?.dataset.s');
const select = async (index) => {
  await evaluate(`document.querySelectorAll("[data-hero-picker]")[${index}].click()`);
  await waitFor(`document.querySelector(".hero-slide:not([hidden])").dataset.s === ${JSON.stringify(HERO_SLIDES[index].s)}`);
  await waitFor('document.querySelector(".hero-slide:not([hidden]) img").complete && document.querySelector(".hero-slide:not([hidden]) img").naturalWidth > 0');
  await wait(300);
};

try {
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate();
  assert.equal(await evaluate('document.querySelectorAll(".hero-slide").length'), 4);
  assert.equal(await evaluate('document.querySelectorAll("h1").length'), 1);
  assert.equal(await evaluate('document.querySelector("#showcase").dataset.rotation'), "paused");
  assert.equal(await evaluate('document.querySelectorAll(".hero-slide[hidden]").length'), 3);
  const initialVisuals = await evaluate('performance.getEntriesByType("resource").filter(r=>/images\\/(ukiyo-e|dunhuang)\\./.test(r.name)).map(r=>r.name)');
  assert.ok(initialVisuals.every((url) => url.endsWith(".240.webp")), JSON.stringify({ initialVisuals, page: await evaluate('({scroll:scrollY,width:innerWidth,dpr:devicePixelRatio,images:[...document.images].filter(i=>/ukiyo-e|dunhuang/.test(i.src)).map(i=>({container:i.closest("[id]")?.id,src:i.currentSrc,sizes:i.sizes,rect:i.getBoundingClientRect().toJSON(),hidden:i.closest("[hidden]")!==null}))})') }));
  await evaluate('document.querySelector(".hero-cta").focus()');
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  assert.equal(await evaluate('document.activeElement.hasAttribute("data-hero-rotation")'), true);
  const measurements = [];
  for (let i = 0; i < HERO_SLIDES.length; i++) {
    await select(i);
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
    measurements.push(await evaluate('(()=>{const s=document.querySelector(".hero-slide:not([hidden])"),w=s.querySelector(".hero-wordmark"),a=s.querySelector(".hero-art");return {s:s.dataset.s,height:s.getBoundingClientRect().height,poster:w.getBoundingClientRect().toJSON(),art:a.getBoundingClientRect().toJSON(),image:s.querySelector("img").currentSrc,font:getComputedStyle(w).fontSize}})()'));
    await screenshot(`carousel-desktop-${i + 1}`);
    if (i === 0) await evaluate('history.replaceState(null,"","#showcase")');
    await evaluate('document.querySelector(".hero-slide:not([hidden]) .hero-cta").click()');
    assert.equal(await evaluate('location.hash'), `#mix=${HERO_SLIDES[i].s}+${HERO_SLIDES[i].f}`);
    assert.equal(await evaluate('document.querySelector("#stage .pv").dataset.structure'), HERO_SLIDES[i].s);
    assert.equal(await evaluate('document.activeElement.id'), "bench-title");
    await waitFor('document.querySelector("#workbench").getBoundingClientRect().top < 80');
    await evaluate('window.scrollTo(0,0)');
    await wait(600);
  }
  await evaluate('document.querySelector("[data-hero-next]").click()');
  assert.equal(await current(), "bauhaus");
  await evaluate('document.querySelector("[data-hero-prev]").click()');
  assert.equal(await current(), "memphis");
  await evaluate('document.querySelectorAll("[data-hero-picker]")[0].focus()');
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  assert.equal(await current(), "minimalism");
  assert.equal(await evaluate('document.activeElement === document.querySelectorAll("[data-hero-picker]")[1]'), true);
  await evaluate('document.querySelector("#showcase").dispatchEvent(new PointerEvent("pointerleave"));document.querySelector("[data-hero-rotation]").click()');
  assert.equal(await evaluate('document.querySelector("#showcase").dataset.rotation'), "playing");
  await wait(6800);
  assert.equal(await current(), "art-deco");
  await evaluate('document.querySelector("#showcase").dispatchEvent(new PointerEvent("pointerenter"))');
  assert.equal(await evaluate('document.querySelector("#showcase").dataset.rotation'), "paused");
  await evaluate('document.querySelector("#showcase").dispatchEvent(new PointerEvent("pointerleave"));document.querySelector("[data-hero-next]").focus()');
  assert.equal(await evaluate('document.querySelector("#showcase").dataset.rotation'), "paused");
  await evaluate('document.querySelector("#showcase").dispatchEvent(new PointerEvent("pointerleave"))');
  assert.equal(await evaluate('document.querySelector("#showcase").dataset.rotation'), "paused");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await waitFor('document.querySelector("[data-hero-rotation]").disabled');
  await select(0);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".hero-slide:not([hidden]) .hero-poster-content")).animationName'), "none");
  for (const width of [320, 390, 720, 900, 1920]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: width < 720 ? 1100 : 1000, deviceScaleFactor: 1, mobile: width < 720 });
    for (let i = 0; i < HERO_SLIDES.length; i++) {
      await select(i);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Overflow: ${width}, ${i}`);
      assert.ok(await evaluate('(()=>{const s=document.querySelector(".hero-slide:not([hidden])");return s.querySelector("h2").scrollWidth <= s.querySelector("h2").clientWidth+1})()'), `Title clipped: ${width}, ${i}`);
      assert.ok(await evaluate('(()=>{const s=document.querySelector(".hero-slide:not([hidden])"),r=s.querySelector(".hero-art").getBoundingClientRect(),walker=document.createTreeWalker(s.querySelector(".hero-wordmark"),NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){const range=document.createRange();range.selectNodeContents(node);for(const w of range.getClientRects())if(Math.min(r.right,w.right)-Math.max(r.left,w.left)>1 && Math.min(r.bottom,w.bottom)-Math.max(r.top,w.top)>1)return false}return true})()'), `Visual under brand text: ${width}, ${i}`);
      assert.ok(await evaluate('(()=>{const s=document.querySelector(".hero-slide:not([hidden])");return s.querySelector(".hero-poster-foot").getBoundingClientRect().bottom <= s.querySelector(".hero-poster-content").getBoundingClientRect().bottom+1})()'), `Poster footer outside frame: ${width}, ${i}`);
      if (width === 390) await screenshot(`carousel-mobile-${i + 1}`);
    }
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 1100, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setScriptExecutionDisabled", { value: true });
  await navigate('document.querySelectorAll(".hero-slide").length === 4 && !document.documentElement.classList.contains("js")');
  assert.equal(await evaluate('[...document.querySelectorAll(".hero-slide")].filter(s=>getComputedStyle(s).display!=="none").length'), 1);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".hero-combinations")).display'), "flex");
  assert.equal(await evaluate('document.querySelectorAll(".hero-combinations a").length'), 4);
  assert.equal(await evaluate('document.querySelectorAll(".plate").length'), 24);
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
  await screenshot("carousel-no-js");
  await send("Emulation.setScriptExecutionDisabled", { value: false });
  await send("Network.setBlockedURLs", { urls: ["https://fonts.googleapis.com/*", "https://fonts.gstatic.com/*"] });
  await navigate();
  for (let i = 0; i < 4; i++) { await select(i); assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth')); }
  await select(0);
  await evaluate('(()=>{const img=document.querySelector(".hero-slide:not([hidden]) img");img.parentElement.querySelector("source").srcset="/missing-hero.webp 240w";img.srcset="/missing-hero.jpg 240w"})()');
  await waitFor('(()=>{const i=document.querySelector(".hero-slide:not([hidden]) img");return !i.srcset && i.complete && i.naturalWidth>0})()');
  assert.equal(await evaluate('document.querySelectorAll(".hero-slide").length'), 4);
  if (process.env.CHECK_LEGACY_LINKS === "1") {
    await send("Network.setBlockedURLs", { urls: [] });
    cachedDocument = await fs.readFile(new URL("../deploy/public/site/index.html", import.meta.url));
    const patterns = [{ urlPattern: "https://style-mix.tasteux.com/site/?cached-migration*", resourceType: "Document", requestStage: "Request" }];
    for (const [, href] of cachedDocument.toString().matchAll(/href="([^"]+\/(?:style|preview)\.css)"/g)) {
      const url = new URL(href, "https://style-mix.tasteux.com");
      cachedStyles.set(url.pathname, await fs.readFile(new URL(`../deploy/public${url.pathname}`, import.meta.url)));
      patterns.push({ urlPattern: url.href, resourceType: "Stylesheet", requestStage: "Request" });
    }
    await send("Fetch.enable", { patterns });
    await send("Page.navigate", { url: "https://style-mix.tasteux.com/site/?cached-migration=1#mix=bauhaus+fauvism" });
    await waitFor('location.origin === "https://style-mix.tasteux.com" && document.querySelector("#code-out")?.textContent.includes("包豪斯")');
    const legacyImage = await evaluate('(async()=>{const src=document.querySelector("#stage img").src;const response=await fetch(src);return {ok:response.ok,bytes:(await response.arrayBuffer()).byteLength}})()');
    assert.ok(legacyImage.ok && legacyImage.bytes > 100000);
    const legacyExport = await evaluate('(async()=>{let exported;const create=URL.createObjectURL;URL.createObjectURL=(blob)=>{exported=blob;return create(blob)};const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(!this.download)click.call(this)};document.querySelector("#export-html").click();for(let i=0;i<100&&!exported;i++)await new Promise(r=>setTimeout(r,100));return exported?await exported.text():""})()');
    assert.ok(legacyExport.includes("data:image/jpeg;base64,") && !legacyExport.includes("srcset="), JSON.stringify({ length: legacyExport.length, prefix: legacyExport.slice(0, 100), page: await evaluate('({url:location.href,message:document.querySelector("#export-msg").textContent,resources:performance.getEntriesByType("resource").slice(-8).map(r=>r.name)})') }));
    await send("Fetch.disable");
    await send("Page.navigate", { url: "https://style-mix.tasteux.com/site/?migration-check=1#mix=art-deco+dunhuang" });
    await waitFor(`location.origin === ${JSON.stringify(origin)} && location.pathname === "/" && location.hash === "#mix=art-deco+dunhuang" && document.querySelector("#stage .pv")?.dataset.structure === "art-deco"`);
    assert.ok(await evaluate('document.querySelector("#code-out").textContent.includes("敦煌壁画")'));
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ slides: 4, viewports: 5, noJs: true, keyboard: true, optInRotation: true, reducedMotion: true, cta: true, imageFallback: true, initialVisuals, measurements, errors }, null, 2));
} finally {
  await send("Emulation.setScriptExecutionDisabled", { value: false });
  ws.close();
  await fetch(`${debug}/json/close/${tab.id}`);
}

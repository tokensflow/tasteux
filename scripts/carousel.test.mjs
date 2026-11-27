import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { test } from "node:test";
import { HERO_SLIDES, heroMarkup, enhanceHero } from "../site/hero.mjs";

const data = JSON.parse(await fs.readFile(new URL("../skill/schools.json", import.meta.url), "utf8"));

test("hero emits curated, valid combinations with one eager responsive visual", () => {
  const html = heroMarkup(data.schools, "/site/assets/test/images/");
  assert.equal(HERO_SLIDES.length, 4);
  assert.equal((html.match(/class="hero-slide"/g) ?? []).length, 4);
  assert.equal((html.match(/loading="eager"/g) ?? []).length, 1);
  assert.equal((html.match(/fetchpriority="high"/g) ?? []).length, 1);
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 3);
  assert.equal((html.match(/<img src=/g) ?? []).length, 1);
  assert.equal((html.match(/<img data-src=/g) ?? []).length, 3);
  assert.deepEqual([...html.matchAll(/<article class="hero-slide"[^>]*>/g)].map(([tag]) => /\shidden\s/.test(tag)), [false, true, true, true]);
  for (const slide of HERO_SLIDES) {
    const S = data.schools.find((s) => s.id === slide.s);
    const F = data.schools.find((s) => s.id === slide.f);
    assert.ok(S.roles.includes("structure"));
    assert.ok(F);
    assert.ok(html.includes(`href="#mix=${S.id}+${F.id}"`));
    assert.ok(html.includes(`--ink:${F.palette.ink}`));
    assert.ok(html.includes(`--tex-level:${Math.min(S.structure.textureCap, F.texture.level)}`));
    assert.ok(html.includes(`&quot;${S.structure.type.display.family}&quot;`));
    assert.ok(html.includes(`${F.id}.480.webp 480w`));
    assert.ok(html.includes(`${S.name} × ${F.name}`));
  }
  assert.ok(html.includes("AI 生成"));
  assert.ok(html.includes('class="hero-controls" hidden'));
});

test("hero escapes editorial and data content, and rejects missing combinations", () => {
  const schools = structuredClone(data.schools);
  schools.find((s) => s.id === "bauhaus").name = '<script>alert("x")</script>';
  assert.ok(!heroMarkup(schools).includes("<script>"));
  assert.throws(() => heroMarkup(schools.filter((s) => s.id !== "fauvism")), /无效轮播组合/);
});

class Element {
  constructor(dataset = {}) { this.dataset = dataset; this.listeners = {}; this.attrs = {}; this.hidden = false; }
  addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); }
  emit(name, event = {}) { for (const fn of this.listeners[name] ?? []) fn({ target: this, ...event }); }
  setAttribute(name, value) { this.attrs[name] = value; }
  contains(el) { return el === this; }
  focus() { this.focused = true; }
}

function fixture(reduced = false) {
  const slides = HERO_SLIDES.map((slide) => new Element({ s: slide.s, f: slide.f }));
  const pickers = slides.map(() => new Element());
  const prev = new Element();
  const next = new Element();
  const rotation = new Element();
  const controls = new Element();
  const status = new Element();
  const root = new Element();
  const doc = new Element();
  const media = new Element();
  media.matches = reduced;
  let intersect;
  doc.defaultView = { IntersectionObserver: class { constructor(fn) { intersect = fn; } observe() {} } };
  const tasks = new Map();
  let id = 0;
  const clock = { setTimeout(fn) { tasks.set(++id, fn); return id; }, clearTimeout(key) { tasks.delete(key); } };
  root.ownerDocument = doc;
  root.querySelectorAll = (selector) => selector === ".hero-slide" ? slides : pickers;
  root.querySelector = (selector) => ({ ".hero-controls": controls, "[data-hero-prev]": prev, "[data-hero-next]": next, "[data-hero-rotation]": rotation, ".hero-status": status })[selector];
  const selected = [];
  const shown = [];
  enhanceHero(root, { media, clock, onShow: (slide) => shown.push(slide), onSelect: (...args) => selected.push(args) });
  const tick = () => { const jobs = [...tasks.values()]; tasks.clear(); jobs.forEach((fn) => fn()); };
  return { root, doc, media, slides, pickers, prev, next, rotation, controls, status, tasks, selected, shown, tick, intersect: (visible) => intersect([{ isIntersecting: visible }]) };
}

test("carousel enhances once, wraps controls, selects slides, and preserves focus", () => {
  const f = fixture();
  assert.equal(f.controls.hidden, false);
  assert.equal(f.tasks.size, 0);
  assert.deepEqual(f.slides.map((s) => s.hidden), [false, true, true, true]);
  f.prev.emit("click");
  assert.equal(f.slides[3].hidden, false);
  f.next.emit("click");
  assert.equal(f.slides[0].hidden, false);
  f.pickers[2].emit("click");
  assert.equal(f.slides[2].hidden, false);
  assert.equal(f.pickers[2].attrs["aria-pressed"], "true");
  let prevented = false;
  f.root.emit("keydown", { target: f.pickers[2], key: "ArrowRight", preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.slides[3].hidden, false);
  assert.equal(f.pickers[3].focused, true);
  const cta = { dataset: { heroMix: "" }, closest() { return this; } };
  f.root.emit("click", { target: cta, preventDefault() {} });
  assert.deepEqual(f.selected[0].slice(0, 2), ["memphis", "fauvism"]);
  f.root.emit("click", { target: cta, metaKey: true, preventDefault() { assert.fail("Modified link must keep native behavior"); } });
  assert.equal(f.selected.length, 1);
  const count = f.shown.length;
  enhanceHero(f.root);
  assert.equal(f.shown.length, count);
});

test("automatic rotation is opt-in and suspends on hover, focus, visibility and reduced motion", () => {
  const f = fixture();
  assert.equal(f.root.dataset.rotation, "paused");
  f.rotation.emit("click");
  assert.equal(f.tasks.size, 1);
  assert.equal(f.status.attrs["aria-live"], "off");
  f.tick();
  assert.equal(f.slides[1].hidden, false);
  f.root.emit("pointerenter");
  assert.equal(f.tasks.size, 0);
  f.root.emit("pointerleave");
  assert.equal(f.tasks.size, 1);
  f.root.emit("focusin", { target: f.rotation });
  assert.equal(f.tasks.size, 0);
  f.root.emit("pointerleave");
  assert.equal(f.tasks.size, 0);
  assert.equal(f.status.attrs["aria-live"], "polite");
  f.rotation.emit("click");
  f.doc.hidden = true;
  f.doc.emit("visibilitychange");
  assert.equal(f.tasks.size, 0);
  f.doc.hidden = false;
  f.doc.emit("visibilitychange");
  assert.equal(f.tasks.size, 1);
  f.intersect(false);
  assert.equal(f.tasks.size, 0);
  f.intersect(true);
  assert.equal(f.tasks.size, 1);
  f.media.matches = true;
  f.media.emit("change");
  assert.equal(f.tasks.size, 0);
  assert.equal(f.rotation.disabled, true);
  f.next.emit("click");
  assert.equal(f.slides[2].hidden, false);
  const reduced = fixture(true);
  reduced.rotation.emit("click");
  assert.equal(reduced.tasks.size, 0);
});

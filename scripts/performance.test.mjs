import assert from "node:assert/strict";
import { test } from "node:test";
import { imageMarkup, imageUrls, IMAGE_WIDTHS } from "../site/images.mjs";
import { createFontLoader, fontsHref } from "../site/fonts.mjs";

const imageBase = "/site/assets/123456789abc/images/";

test("responsive images offer WebP and JPEG at known widths", () => {
  assert.deepEqual(IMAGE_WIDTHS, [240, 480, 800, 1200]);
  const markup = imageMarkup("fauvism", { imageBase, alt: '一张 "风格图"', sizes: "auto, 150px" });
  assert.ok(markup.includes('<source type="image/webp"'));
  assert.ok(markup.includes("fauvism.240.webp 240w"));
  assert.ok(markup.includes("fauvism.480.jpg 480w"));
  assert.ok(markup.includes("fauvism.jpg 1200w"));
  assert.ok(markup.includes("&quot;风格图&quot;"));
  assert.ok(markup.includes('width="1200" height="800"'));
});

test("unbuilt source keeps a functional original-image fallback", () => {
  const markup = imageMarkup("fauvism", { imageBase: null });
  assert.ok(markup.includes('src="img/fauvism.jpg"'));
  assert.ok(!markup.includes("srcset="));
  assert.equal(imageUrls("fauvism", imageBase).original, `${imageBase}fauvism.jpg`);
});

function fakeDocument() {
  const links = [];
  return { links, head: { append: (link) => links.push(link) }, createElement: () => ({ events: {}, addEventListener(name, fn) { this.events[name] = fn; }, remove() { links.splice(links.indexOf(this), 1); } }) };
}

test("font loading is explicit and deduplicated by family and weight specification", () => {
  const document = fakeDocument();
  const load = createFontLoader(document);
  load(["Jost:wght@400;700"]);
  load(["Jost:wght@400;700"]);
  assert.equal(document.links.length, 1);
  assert.ok(document.links[0].href.includes("family=Jost:wght@400;700"));
  load(["Jost:wght@400;700", "Bungee", "Rubik:wght@400;600"]);
  assert.equal(document.links.length, 2);
  assert.ok(!document.links[1].href.includes("Jost"));
  assert.ok(document.links[1].href.includes("Bungee"));
  assert.ok(fontsHref(["Poiret One"]).includes("family=Poiret+One"));
});

test("a failed font stylesheet can be retried without poisoning the family cache", () => {
  const document = fakeDocument();
  const load = createFontLoader(document);
  load(["Bungee"]);
  document.links[0].events.error();
  assert.equal(document.links.length, 0);
  load(["Bungee"]);
  assert.equal(document.links.length, 1);
});

test("the lazy font loader skips families the page head already requested", () => {
  const appended = [];
  const document = { createElement: () => ({ addEventListener() {} }), head: { append: (link) => appended.push(link.href) } };
  const load = createFontLoader(document, ["Oswald", "PT Sans"]);
  load(["Oswald:wght@700", "PT Sans:wght@400;700"]);
  assert.equal(appended.length, 0);
  load(["Jost:wght@400;700", "Oswald:wght@700"]);
  assert.equal(appended.length, 1);
  assert.ok(appended[0].includes("family=Jost") && !appended[0].includes("Oswald"));
});

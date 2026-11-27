export const IMAGE_WIDTHS = [240, 480, 800, 1200];
export const IMAGE_BASE = null;
const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function imageUrls(id, base = IMAGE_BASE) {
  const original = `${base ?? "img/"}${id}.jpg`;
  return {
    original,
    webp: base ? IMAGE_WIDTHS.map((w) => `${base}${id}.${w}.webp ${w}w`).join(", ") : "",
    jpeg: base ? IMAGE_WIDTHS.map((w) => `${base}${id}${w === 1200 ? "" : `.${w}`}.jpg ${w}w`).join(", ") : "",
  };
}

export function imageMarkup(id, { alt = "", sizes = "auto, 100vw", loading = "lazy", priority = "auto", imageBase = IMAGE_BASE } = {}) {
  const urls = imageUrls(id, imageBase);
  const source = urls.webp ? `<source type="image/webp" srcset="${escape(urls.webp)}" sizes="${escape(sizes)}">` : "";
  return `<picture>${source}<img src="${escape(urls.original)}"${urls.jpeg ? ` srcset="${escape(urls.jpeg)}" sizes="${escape(sizes)}"` : ""} alt="${escape(alt)}" width="1200" height="800" loading="${loading}" fetchpriority="${priority}" decoding="async"></picture>`;
}

export function setImageSource(img, id, sizes = "100px") {
  const urls = imageUrls(id);
  img.dataset.school = id;
  img.sizes = sizes;
  const source = img.parentElement.querySelector("source");
  if (source) {
    source.sizes = sizes;
    if (urls.webp) source.srcset = urls.webp;
    else source.removeAttribute("srcset");
  }
  if (urls.jpeg) img.srcset = urls.jpeg;
  else img.removeAttribute("srcset");
  img.src = urls.original;
}

export function clearImageSource(img) {
  img.removeAttribute("src");
  img.removeAttribute("srcset");
  img.parentElement.querySelector("source")?.removeAttribute("srcset");
  delete img.dataset.school;
}

export function fallbackImage(img, fallback = `img/${img.dataset.school}.jpg`) {
  if (img.getAttribute("src") === fallback && !img.hasAttribute("srcset")) return false;
  img.removeAttribute("srcset");
  img.parentElement.querySelector("source")?.removeAttribute("srcset");
  img.src = fallback;
  return true;
}

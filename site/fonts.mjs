export const fontsHref = (families) => `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f.replace(/ /g, "+")}`).join("&")}&display=swap`;

// 页面 <head> 里那条 Google Fonts 链接已经请求过的字体族不再请求：同一族只加载一次、只用一种 font-display（DESIGN.md 字体·加载）。
const familyName = (spec) => spec.split(":")[0];
export function shellFamilies(document) {
  const link = document.querySelector?.('link[rel="stylesheet"][href^="https://fonts.googleapis.com/css2?"]');
  return link ? [...new URL(link.href).searchParams.getAll("family")].map(familyName) : [];
}

export function createFontLoader(document, loaded = shellFamilies(document)) {
  const requested = new Set();
  const shell = new Set(loaded);
  return (families) => {
    const missing = [...new Set(families)].filter((family) => !requested.has(family) && !shell.has(familyName(family)));
    if (!missing.length) return;
    missing.forEach((family) => requested.add(family));
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontsHref(missing);
    link.addEventListener("error", () => {
      missing.forEach((family) => requested.delete(family));
      link.remove();
    });
    document.head.append(link);
  };
}

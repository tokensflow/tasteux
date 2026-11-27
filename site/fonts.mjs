export const fontsHref = (families) => `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f.replace(/ /g, "+")}`).join("&")}&display=swap`;

export function createFontLoader(document) {
  const requested = new Set();
  return (families) => {
    const missing = [...new Set(families)].filter((family) => !requested.has(family));
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

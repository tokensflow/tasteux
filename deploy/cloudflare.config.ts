import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "style-mix",
    compatibilityDate: "2026-09-30",
    domains: ["tasteux.com"],
    observability: { enabled: true },
  },
});

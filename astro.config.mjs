import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://332712.xyz",
  base: "/",
  trailingSlash: "never",
  prefetch: true,
  adapter: cloudflare({
    imageService: "cloudflare",
  }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["node:fs/promises", "node:path", "node:url", "node:crypto"],
    },
  },
  integrations: [partytown(), sitemap()],
});

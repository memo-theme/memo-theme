import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://332712.xyz",
  base: "/",
  trailingSlash: "always",
  output: "server",
  prefetch: true,
  adapter: cloudflare({
    imageService: "cloudflare",
    sessionKVBindingName: "THEME_MEMORIES_SESSION",
  }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["node:fs/promises", "node:path", "node:url", "node:crypto"],
    },
  },
  integrations: [partytown(), sitemap()],
});

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/content", "@nuxt/image"],

  // Vevey Positive (la police du design) est déclarée dans tokens.css et servie
  // depuis public/fonts/. Quicksand, self-hébergée via @fontsource, ne sert plus
  // que de repli — aucun build ne dépend d'un CDN de polices.
  css: [
    "@fontsource/quicksand/500.css",
    "@fontsource/quicksand/700.css",
    "~/assets/css/tokens.css",
    "~/assets/css/main.css",
  ],

  image: {
    // Provider is env-driven so the build can pick where images are transformed:
    //  - unset (local dev / GitHub Pages): IPX — sharp transforms at build time.
    //  - "cloudflare" (production on CF): images become /cdn-cgi/image/ URLs
    //    transformed on-demand at the edge. Requires a Cloudflare-proxied zone
    //    with Images > Transformations enabled.
    provider: process.env.NUXT_IMAGE_PROVIDER || "ipx",
    cloudflare: {
      baseURL: process.env.NUXT_IMAGE_BASE_URL || "https://faiscommecheztoi.ch",
    },
    quality: 80,
    densities: [1],
    format: ["webp"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },

  app: {
    // app.baseURL is picked up from NUXT_APP_BASE_URL at build time — the
    // GitHub Pages workflow sets it to /faiscommecheztoi/ so the preview works
    // under the project subpath. Production (custom domain) leaves it unset.
    head: {
      title: "Fais comme chez toi",
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      htmlAttrs: { lang: "fr" },
    },
  },

  sourcemap: false,

  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: true,
      failOnError: false,
      // Edge-transformed image URLs have no static route; don't crawl them.
      ignore: ["/cdn-cgi/image"],
    },
  },

  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },

  compatibilityDate: "2026-08-10",
});

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
    "~/assets/css/rideau.css",
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
      link: [
        // Le rideau d'ouverture affiche le titre du festival dès le premier
        // peint : sans préchargement, il s'écrirait en Quicksand puis
        // basculerait en Vevey sous les yeux du visiteur (font-display: swap).
        {
          rel: "preload",
          as: "font",
          type: "font/otf",
          href: "/fonts/vevey-positive.otf",
          crossorigin: "anonymous",
        },
      ],
      script: [
        {
          // Décide AVANT le premier peint si le rideau se joue, et marque
          // <html> sinon : le CSS ne montre alors jamais les panneaux, au lieu
          // de les laisser clignoter le temps que Vue s'hydrate.
          //
          // Quatre raisons de ne pas le jouer :
          //  - une ancre (#infos, #grille…) : on arrive d'un lien partagé, vers
          //    un point précis de la page ; un rideau plein écran suivi d'un
          //    saut en plein milieu du document désoriente plus qu'il n'accueille ;
          //  - un rechargement (ou un retour arrière) : ce n'est jamais une
          //    première arrivée, et le navigateur va restaurer la position de
          //    défilement — le rideau s'ouvrirait sur un milieu de page ;
          //  - joué il y a moins de 24 h : « la première fois aujourd'hui »
          //    plutôt que « la première fois dans cet onglet », qui rejouerait
          //    l'animation à chaque onglet ouvert en parallèle ;
          //  - le système demande moins d'animations.
          //
          // L'horodatage n'est réécrit que quand le rideau se joue vraiment
          // (voir RideauOuverture.vue) : la fenêtre court depuis la dernière
          // ouverture, elle ne se repousse pas à chaque visite.
          innerHTML: `try{
  var h=location.hash,
      n=(performance.getEntriesByType('navigation')[0]||{}).type,
      t=+localStorage.getItem('fcct-rideau')||0;
  if(h||n==='reload'||n==='back_forward'||Date.now()-t<864e5||matchMedia('(prefers-reduced-motion: reduce)').matches)
    document.documentElement.classList.add('sans-rideau');
}catch(e){}`,
          tagPosition: "head",
        },
      ],
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

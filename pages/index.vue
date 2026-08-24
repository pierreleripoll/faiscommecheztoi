<template>
  <main id="contenu">
    <!-- Hero : texte d'intro + nuage appel à projet + photo pleine largeur -->
    <header class="hero page">
      <div class="hero__text">
        <ContentRenderer v-if="hero" :value="hero" />
      </div>
      <AppelCloud v-if="appel?.visible" :appel="appel" variant="hero" />
    </header>
    <!-- La maquette mobile d'origine enchaînait l'intro et Artistes sans la
         photo ; la maquette « Améliorations » (août 2026) la remet sur tous
         les gabarits — l'intro seule faisait une page d'entrée sans image. -->
    <figure v-if="hero?.photo?.src" class="hero__photo">
      <ThumbhashImage
        :image="hero.photo"
        sizes="100vw sm:100vw lg:1280px xl:1440px"
        priority
      />
    </figure>

    <div class="page">
      <SectionArtistes :years="years || []" :artistes="artistes || []" />

      <SectionGrille :artistes="artistes || []" :annee="anneeCourante" />

      <section id="infos" class="section">
        <h2 class="section__title">{{ infos?.title }}</h2>
        <ContentRenderer v-if="infos" :value="infos" />
      </section>

      <section id="partenariats" class="section">
        <h2 class="section__title">Partenariats</h2>
        <div
          v-for="partenaire in partenaires"
          :key="partenaire._path"
          class="partenaire"
        >
          <h3 class="partenaire__title">{{ partenaire.title }}</h3>
          <ContentRenderer :value="partenaire" />
        </div>
      </section>

      <section id="participer" class="section section--participer">
        <h2 class="section__title">{{ participer?.title }}</h2>
        <ContentRenderer v-if="participer" :value="participer" />
        <template v-if="appel?.visible">
          <AppelCloud :appel="appel" variant="participer" :scale="0.75" />
          <AppelCloud variant="puff" :scale="0.375" decorative />
        </template>
      </section>

      <section id="contact" class="section section--team">
        <h2 class="section__title">{{ team?.title }}</h2>
        <ContentRenderer v-if="team" :value="team" />
      </section>

      <section id="soutiens" class="section">
        <h2 class="section__title">{{ soutiens?.title }}</h2>
        <div class="soutiens">
          <component
            :is="logo.url ? 'a' : 'span'"
            v-for="logo in soutiens?.logos || []"
            :key="logo.src"
            :href="logo.url"
            class="soutiens__logo"
          >
            <img
              :src="apercu ? logo.src : img(logo.src, { quality: 90 })"
              :alt="logo.alt || ''"
              :width="logo.width"
              :height="logo.height"
              loading="lazy"
            />
          </component>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
const img = useImage();
// Dans l'iframe d'aperçu de l'admin, les images se rendent telles quelles :
// les dérivées IPX n'existent que pour ce que le build a vu.
const apercu = useApercuActif();

// useContenu = useAsyncData + queryContent, avec l'aperçu de l'admin par-dessus
// (composables/useContenu.js) ; chaque constante s'utilise comme `data`.
const hero = await useContenu("hero", () => queryContent("/hero").findOne());
const appel = await useContenu("appel", () =>
  queryContent("/appel").findOne()
);
// Les fiches artistes de l'édition, affichées dans la section Artistes.
// $numeric est indispensable : sans lui queryContent compare les nombres comme
// des chaînes et classe 1, 10, 11, 12, 2, 3…
const artistes = await useContenu(
  "artistes-fiches",
  () => queryContent("/programme").sort({ order: 1, $numeric: true }).find(),
  { tri: TRI_ORDRE }
);
const years = await useContenu(
  "artistes",
  () => queryContent("/artistes").sort({ year: -1 }).find(),
  { tri: TRI_ANNEE_DESC }
);
// La grille horaire ne concerne que l'édition en cours : les archives n'ont pas
// d'horaires exploitables. `years` est trié décroissant, la première entrée est
// donc l'édition la plus récente — pas d'année en dur à mettre à jour chaque an.
const anneeCourante = computed(() => years.value?.[0]?.year || "");

const infos = await useContenu("infos", () =>
  queryContent("/infos").findOne()
);
const partenaires = await useContenu(
  "partenariats",
  () => queryContent("/partenariats").sort({ order: 1, $numeric: true }).find(),
  { tri: TRI_ORDRE }
);
const participer = await useContenu("participer", () =>
  queryContent("/participer").findOne()
);
const team = await useContenu("team", () => queryContent("/team").findOne());
const soutiens = await useContenu("soutiens", () =>
  queryContent("/soutiens").findOne()
);
</script>

<style scoped>
/* Hero ---------------------------------------------------------------------- */
.hero {
  position: relative;
  /* 15 px au-dessus / 25 px en dessous du texte dans la maquette. */
  padding-top: 15px;
  padding-bottom: 25px;
}

.hero__text {
  font-size: var(--fs-h1);
}

.hero__photo {
  margin: 0;
  width: 100%;
  position: relative;
  /* Sans isolation, le plus-lighter du calque de teinte se mélangerait aussi
     au fond de page et déborderait de la photo. */
  isolation: isolate;
}

.hero__photo :deep(img) {
  width: 100%;
  height: auto;
  display: block;
}

/* Deux calques se superposent à la photo, dans cet ordre :
   1. la teinte magenta, mélangée à l'image ;
   2. la lueur des bords, posée par-dessus.
   Un box-shadow: inset ne conviendrait pas : il serait peint sous l'image. */
.hero__photo::after,
.hero__photo::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* La photo source est neutre ; le design la teinte d'un magenta additif à
   28 %. En plus-lighter, la lueur des projecteurs reste lumineuse au lieu
   d'être noyée sous un voile opaque. */
.hero__photo::after {
  z-index: 1;
  background: var(--c-ink);
  opacity: 0.28;
  mix-blend-mode: plus-lighter;
}

/* Lueur projetée par les blocs roses au-dessus et en dessous de la photo. */
.hero__photo::before {
  z-index: 2;
  background: linear-gradient(
      to bottom,
      var(--glow-photo),
      transparent 35px
    ),
    linear-gradient(to top, var(--glow-photo), transparent 35px);
}

/* Partenariats -------------------------------------------------------------- */
.partenaire {
  margin-bottom: 25px;
}

.partenaire:last-child {
  margin-bottom: 0;
}

.partenaire__title {
  text-transform: uppercase;
  font-size: 1em;
}

/* Participer : les nuages se superposent au texte, comme dans la maquette. */
.section--participer {
  position: relative;
}

/* Soutiens ------------------------------------------------------------------ */
.soutiens {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px 25px;
  flex-wrap: wrap;
  padding-top: 25px;
  padding-bottom: 50px;
}

.soutiens__logo img {
  display: block;
  /* Rangée de 82 px de haut dans la maquette, les logos y sont centrés. */
  height: clamp(38px, 4.5vw, 61px);
  width: auto;
}
</style>

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
         les gabarits — l'intro seule faisait une page d'entrée sans image.
         Depuis septembre 2026 ce sont plusieurs photos qui défilent
         (components/HeroCarrousel.vue, liste `photos` de hero.md). -->
    <HeroCarrousel v-if="hero?.photos?.length" :photos="hero.photos" />

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
              :src="
                apercu || logo.src.endsWith('.svg')
                  ? logo.src
                  : img(logo.src, { quality: 90 })
              "
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
  /* Les logos officiels (Siméon, 27.08.2026) sont des SVG noirs à fond
     transparent : la multiplication ne leur fait rien. On la garde pour un
     PNG à fond blanc qui arriverait un jour par le CMS — le blanc prend alors
     la couleur de la page et disparaît. */
  mix-blend-mode: multiply;
}
</style>

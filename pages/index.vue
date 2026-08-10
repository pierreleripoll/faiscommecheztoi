<template>
  <main>
    <!-- Hero : texte d'intro + nuage appel à projet + photo pleine largeur -->
    <header class="hero page">
      <div class="hero__text">
        <ContentRenderer v-if="hero" :value="hero" />
      </div>
      <AppelCloud v-if="appel?.visible" :appel="appel" variant="hero" />
    </header>
    <figure v-if="hero?.photo?.src" class="hero__photo">
      <ThumbhashImage :image="hero.photo" sizes="100vw sm:100vw lg:1024px xl:1280px" priority />
    </figure>

    <div class="page">
      <SectionArtistes :years="years || []" />

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
        <AppelCloud v-if="appel?.visible" :appel="appel" variant="participer" />
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
              :src="img(logo.src, { quality: 85 })"
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

const { data: hero } = await useAsyncData("hero", () =>
  queryContent("/hero").findOne()
);
const { data: appel } = await useAsyncData("appel", () =>
  queryContent("/appel").findOne()
);
const { data: years } = await useAsyncData("artistes", () =>
  queryContent("/artistes").sort({ year: -1 }).find()
);
const { data: infos } = await useAsyncData("infos", () =>
  queryContent("/infos").findOne()
);
const { data: partenaires } = await useAsyncData("partenariats", () =>
  queryContent("/partenariats").sort({ order: 1 }).find()
);
const { data: participer } = await useAsyncData("participer", () =>
  queryContent("/participer").findOne()
);
const { data: team } = await useAsyncData("team", () =>
  queryContent("/team").findOne()
);
const { data: soutiens } = await useAsyncData("soutiens", () =>
  queryContent("/soutiens").findOne()
);
</script>

<style scoped>
/* Hero */
.hero {
  position: relative;
  padding-top: 1.6rem;
  padding-bottom: 1.6rem;
}

.hero__text {
  font-size: clamp(1.35rem, 0.7rem + 2.6vw, 2.55rem);
  font-weight: 700;
  line-height: 1.25;
}

.hero__photo {
  margin: 0;
  /* Pleine largeur d'écran, comme la maquette desktop. */
  width: 100%;
}

.hero__photo :deep(img) {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 640px) {
  /* La maquette mobile ne montre pas la photo : hero texte → Artistes. */
  .hero__photo {
    display: none;
  }
}

/* Partenariats */
.partenaire {
  margin-bottom: 1.6em;
}

.partenaire__title {
  text-transform: uppercase;
  font-weight: 500;
  font-size: 1em;
  letter-spacing: 0.02em;
}

/* Participer : le nuage se superpose au texte, comme la maquette. */
.section--participer {
  position: relative;
}

/* Team : e-mails en rose plus doux */
.section--team :deep(a) {
  color: var(--c-ink-soft);
}

/* Soutiens */
.soutiens {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.4rem 2rem;
  flex-wrap: wrap;
  padding: 1rem 0 3rem;
}

.soutiens__logo img {
  display: block;
  height: clamp(2.2rem, 1.6rem + 2vw, 3.4rem);
  width: auto;
}
</style>

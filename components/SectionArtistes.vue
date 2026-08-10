<template>
  <section id="artistes" class="section artistes">
    <div class="artistes__head">
      <h2 class="artistes__title">Artistes</h2>
      <div class="artistes__years">
        <button
          v-for="y in years"
          :key="y.year"
          class="artistes__year"
          :class="{ 'artistes__year--active': selected === y.year }"
          type="button"
          @click="toggle(y.year)"
        >
          {{ y.year }}
        </button>
      </div>
    </div>

    <div class="artistes__grid">
      <figure v-for="p in posters" :key="p.src" class="artistes__poster">
        <ThumbhashImage :image="p" sizes="92vw sm:45vw lg:320px" />
        <figcaption v-if="p.credit" class="artistes__credit">
          {{ p.credit }}
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  years: { type: Array, default: () => [] },
});

// Année sélectionnée : filtre les affiches ; re-cliquer désélectionne.
const selected = ref(null);

function toggle(year) {
  selected.value = selected.value === year ? null : year;
}

const posters = computed(() =>
  props.years
    .filter((y) => !selected.value || y.year === selected.value)
    .flatMap((y) => y.posters || [])
);
</script>

<style scoped>
.artistes__head {
  display: flex;
  align-items: baseline;
  gap: 1.6em;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}

.artistes__title {
  text-transform: uppercase;
  font-size: clamp(1.4rem, 1rem + 1.8vw, 2.1rem);
}

.artistes__years {
  display: flex;
  gap: 0.9em;
  flex-wrap: wrap;
}

.artistes__year {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-weight: 700;
  font-size: clamp(1.2rem, 0.9rem + 1.3vw, 1.7rem);
  color: var(--c-ink);
  cursor: pointer;
}

.artistes__year--active {
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.artistes__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.artistes__poster {
  margin: 0;
  min-width: 0;
}

/* Le wrapper ThumbhashImage est pensé pour des boîtes à hauteur fixe
   (height: 100%). Ici la hauteur doit découler de la largeur de colonne via
   l'aspect-ratio, sinon le min-content gonfle les pistes de la grille. */
.artistes__poster :deep(.thumbhash-image) {
  height: auto;
}

.artistes__credit {
  text-align: right;
  font-size: clamp(0.8rem, 0.65rem + 0.5vw, 1rem);
  color: var(--c-ink-soft);
  margin-top: 0.35em;
}

@media (max-width: 640px) {
  .artistes__head {
    justify-content: center;
    text-align: center;
  }

  .artistes__grid {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
}
</style>

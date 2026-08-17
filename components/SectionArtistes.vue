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
        <ThumbhashImage :image="p" sizes="90vw sm:45vw lg:385px" />
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
  align-items: center;
  flex-wrap: wrap;
  /* 40 px séparent le titre des années dans la maquette. */
  gap: 10px 40px;
  padding: 5px 0;
  margin-bottom: 20px;
}

.artistes__title {
  text-transform: uppercase;
  font-size: var(--fs-h1);
}

.artistes__years {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
}

.artistes__year {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-size: var(--fs-body);
  line-height: 1;
  color: var(--c-ink);
  cursor: pointer;
}

.artistes__year--active {
  text-decoration: underline;
  text-underline-offset: 0.16em;
}

.artistes__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  /* 13.4 px entre les colonnes sur les 1180 px de colonne utile. */
  gap: 13px;
}

.artistes__poster {
  margin: 0;
  min-width: 0;
}

/* ThumbhashImage est prévu pour des boîtes à hauteur fixe (height: 100%). Ici
   la hauteur doit découler de la largeur via l'aspect-ratio, sinon le
   min-content gonfle les pistes de la grille. */
.artistes__poster :deep(.thumbhash-image) {
  height: auto;
}

.artistes__credit {
  text-align: right;
  font-size: var(--fs-legend);
  line-height: 1.3;
  margin-top: 3px;
}

@media (max-width: 720px) {
  .artistes__head {
    justify-content: center;
    text-align: center;
  }

  .artistes__grid {
    grid-template-columns: 1fr;
    gap: 25px;
  }
}
</style>

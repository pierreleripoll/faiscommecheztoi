<template>
  <section id="programme" class="section programme">
    <h2 class="section__title">Programme 2026</h2>

    <div class="programme__grid">
      <article v-for="a in artistes" :key="a._path" class="artiste">
        <!-- Les portraits gardent leur cadrage d'origine : la hauteur découle
             de la largeur, d'où le height:auto imposé à ThumbhashImage, qui est
             sinon prévu pour des boîtes à hauteur fixe. Zoé Schwyzer n'a pas
             encore de photo. -->
        <figure v-if="a.photo?.src" class="artiste__photo">
          <ThumbhashImage :image="a.photo" sizes="90vw sm:45vw lg:385px" />
          <figcaption v-if="a.photo.credit" class="artiste__credit">
            {{ a.photo.credit }}
          </figcaption>
        </figure>

        <p v-if="a.collaboration" class="artiste__tag">{{ a.collaboration }}</p>

        <h3 class="artiste__name">{{ a.name }}</h3>
        <p class="artiste__title">{{ a.title }}</p>
        <p class="artiste__meta">{{ a.duration }} · {{ a.format }}</p>
        <p v-if="a.with" class="artiste__meta">Avec {{ a.with }}</p>

        <p class="artiste__dates">
          {{ a.venue }}<br />
          <template v-for="d in a.dates" :key="d">{{ d }}<br /></template>
        </p>

        <div class="artiste__bio">
          <ContentRenderer :value="a" />
        </div>

        <p v-if="a.school" class="artiste__meta">{{ a.school }}</p>

        <p v-if="a.also" class="artiste__meta">
          Aussi à {{ a.also.festival }}, {{ a.also.venue }} —
          {{ a.also.dates.join(" et ") }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  artistes: { type: Array, default: () => [] },
});
</script>

<style scoped>
.programme__grid {
  display: grid;
  /* Mêmes colonnes et même gouttière que la grille d'affiches. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
  /* Les cartes n'ont pas la même hauteur : chacune s'arrête où elle finit
     plutôt que de s'étirer sur la rangée. */
  align-items: start;
}

/* Une carte est un bloc dense dans une colonne de 385 px : le corps de texte de
   la page (jusqu'à 37 px) y serait illisible. On redescend donc à l'échelle de
   la navigation pour les intitulés et à celle des crédits pour le reste — deux
   tailles déjà présentes dans le design. */
.artiste {
  min-width: 0;
  font-size: var(--fs-nav);
  line-height: 1.2;
}

.artiste__photo {
  margin: 0;
}

/* Cf. SectionArtistes : sans ça, le height:100% du composant gonfle les
   pistes de la grille. */
.artiste__photo :deep(.thumbhash-image) {
  height: auto;
}

.artiste__credit {
  text-align: right;
  font-size: var(--fs-legend);
  line-height: 1.3;
  margin-top: 3px;
}

.artiste__tag {
  font-size: var(--fs-legend);
  line-height: 1.3;
  opacity: 0.65;
  margin-top: 10px;
}

.artiste__name {
  text-transform: uppercase;
  margin-top: 10px;
}

.artiste__title,
.artiste__meta,
.artiste__dates,
.artiste__bio {
  margin-top: 10px;
}

.artiste__dates,
.artiste__bio {
  font-size: var(--fs-legend);
  line-height: 1.35;
}

.artiste__meta {
  font-size: var(--fs-legend);
  line-height: 1.3;
  opacity: 0.65;
}

@media (max-width: 720px) {
  .programme__grid {
    grid-template-columns: 1fr;
    gap: 25px;
  }
}
</style>

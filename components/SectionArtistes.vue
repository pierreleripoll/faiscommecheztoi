<template>
  <section id="artistes" class="section artistes">
    <div class="artistes__colonne">
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
          <!-- L'affiche est le second déclencheur : cliquer dessus revient à
               cliquer sur son onglet d'année. -->
          <button
            class="artistes__affiche"
            type="button"
            :aria-pressed="selected === p.year"
            :aria-label="`Artistes ${p.year}`"
            @click="toggle(p.year)"
          >
            <!-- Les affiches n'ont pas toutes exactement le même ratio ; la
                 maquette les cale sur une même hauteur (385 × 547), ce qui
                 aligne les crédits d'une colonne à l'autre. -->
            <ThumbhashImage
              :image="p"
              :aspect-ratio="385 / 547"
              sizes="90vw sm:45vw lg:385px"
            />
          </button>
          <figcaption v-if="p.credit" class="artistes__credit">
            {{ p.credit }}
          </figcaption>
        </figure>
      </div>
    </div>

    <!-- Les fiches de l'édition : dans le Figma elles vivent ici, sous les
         onglets d'année, pas dans une section « Programme » à part, et elles
         flottent par-dessus tout — les affiches comme le titre de section, une
         carte de la maquette remontant même au-dessus du bord haut de la
         section. Elles n'apparaissent qu'une fois une année choisie : la
         maquette de base (/page) ne porte aucune carte, seules
         /artistes_avant et /artistes_dos en montrent, dans un cadre nommé
         d'après l'année. -->
    <div v-if="cartes.length" class="artistes__scene">
      <div class="artistes__cartes">
        <ArtisteCard
          v-for="(a, i) in cartes"
          :key="a._path"
          :artiste="a"
          :style="eparpillement(i)"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  years: { type: Array, default: () => [] },
  artistes: { type: Array, default: () => [] },
});

// Année sélectionnée : décide quelles fiches flottent ; re-cliquer désélectionne.
const selected = ref(null);

function toggle(year) {
  selected.value = selected.value === year ? null : year;
}

// Le mur d'affiches reste entier quelle que soit l'année choisie — c'est ce que
// montre la maquette, 2025 souligné et les trois affiches toujours là : les
// cartes viennent flotter par-dessus. Chaque affiche porte son année, c'est
// elle qui bascule la sélection au clic.
const posters = computed(() =>
  props.years.flatMap((y) =>
    (y.posters || []).map((p) => ({ ...p, year: y.year }))
  )
);

// Tant qu'aucune année n'est choisie, la section s'en tient aux affiches.
const cartes = computed(() =>
  selected.value
    ? props.artistes.filter((a) => String(a.year) === selected.value)
    : []
);

// Dans la maquette les cartes ne sont pas alignées : chacune est posée plus
// haut ou plus bas que sa voisine (0, 133 et 275 px dans le mock à cinq cartes
// du Figma). Le décalage suit ici un cycle de quatre valeurs, et non un tirage
// aléatoire qui ferait diverger le rendu serveur du rendu client : quatre étant
// premier avec trois, deux cartes côte à côte sur une rangée de trois colonnes
// ne tombent jamais à la même hauteur, et le motif ne se répète qu'au bout de
// douze cartes.
const DECALAGES = [0, 190, 96, 275];

function eparpillement(i) {
  return {
    "--carte-y": `${DECALAGES[i % DECALAGES.length]}px`,
    // Les cartes se posent l'une après l'autre plutôt que d'apparaître en bloc.
    animationDelay: `${Math.min(i, 11) * 40}ms`,
  };
}
</script>

<style scoped>
.artistes__head {
  grid-row: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  /* 40 px séparent le titre des années dans la maquette. */
  gap: 10px 40px;
  padding: 5px 0;
  margin-bottom: 20px;
  /* Le titre et les années restent au-dessus des cartes : ce sont les
     commandes de la section, il ne faut ni les masquer ni les rendre
     incliquables. */
  position: relative;
  z-index: 2;
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

/* Fiches --------------------------------------------------------------------
   La carte fait 323 px dans les deux gabarits du Figma : c'est le nombre de
   colonnes qui change, pas la carte. */
/* Dans la maquette les cartes ne s'intercalent pas entre les onglets et les
   affiches : elles flottent par-dessus, le mur d'affiches restant visible entre
   elles, et débordent plus bas sur le fond. Une carte remonte même au-dessus du
   bord haut de la section, dans le vide à droite des années — d'où un calque
   qui couvre toute la section, titre compris, et pas seulement les affiches.
   La section est donc une grille de deux rangées, le titre puis les affiches ;
   le calque de cartes les enjambe toutes les deux, si bien que la section
   grandit avec lui au lieu de recouvrir la suivante. */
.artistes {
  display: grid;
  /* Sans cela les deux calques s'étirent à la hauteur de la cellule : la grille
     d'affiches suivrait celle des cartes et sa seconde rangée dévalerait de
     sept cents pixels. */
  align-items: start;
}

/* Une seule cellule pour les deux calques : ils partent du même haut — celui de
   la section, titre compris — et la cellule prend la hauteur du plus grand, si
   bien que la section grandit avec les cartes au lieu de recouvrir la suivante.
   Faire enjamber deux rangées au calque de cartes ne marcherait pas : la grille
   répartit la hauteur d'un élément à cheval entre les rangées qu'il traverse,
   et la bande du titre enflait de deux cents pixels. */
.artistes > * {
  grid-area: 1 / 1;
}

/* L'ordre du DOM ne suffit pas à poser les cartes au-dessus : dans
   ThumbhashImage l'image porte un z-index de 1 et son enveloppe, simplement
   position: relative, ne forme pas de contexte d'empilement — ce z-index
   remonte donc jusqu'à la section et fait passer les affiches devant. On rend
   le calque de cartes positionné à son tour pour trancher.
   pointer-events: none, car il couvre toute la cellule et intercepterait sinon
   les clics sur les affiches qu'il laisse pourtant voir entre les cartes. */
.artistes__scene {
  position: relative;
  z-index: 1;
  pointer-events: none;
  /* Les cartes débordent la colonne de texte pour occuper tout l'écran : à
     1180 px de large on n'en voit que trois de front, et il faut quatre rangées
     pour douze fiches. Le calc annule la marge automatique et le padding de
     .page — 50 % de la zone moins un demi-écran — quelle que soit la largeur.
     Il reste 21 px de garde de chaque côté, la gouttière entre cartes, pour que
     la lueur magenta ne soit pas coupée net par le bord de l'écran. */
  margin-inline: calc(50% - 50vw);
  padding-inline: 21px;
}

.artistes__cartes > * {
  pointer-events: auto;
}

/* Le décalage ci-dessous doit s'aligner sur le nombre réel de colonnes, qui
   dépend de la largeur utile et non de celle de la fenêtre : les deux ne
   coïncident pas (padding, barre de défilement) et une media query laissait une
   bande d'une quarantaine de pixels où l'on décalait trois colonnes alors que
   deux seulement tenaient. D'où ce conteneur — sur un parent, car une requête
   @container ne s'applique jamais à l'élément qui déclare le conteneur, mais
   seulement à ses descendants : portée par la rangée elle-même, elle laissait
   tomber en silence tout ce qui vise .artistes__cartes. */
.artistes__scene {
  container-type: inline-size;
}

.artistes__cartes {
  /* Flex plutôt que grid : une piste de grille de 323 px ne rétrécit pas et
     déborderait sous 353 px de large. */
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  /* Pas vertical de la pile mobile dans la maquette : 458,45 − 437,45. */
  gap: 21px;
  margin-bottom: 25px;
}

.artistes__cartes > * {
  flex: 0 1 var(--card-w);
  animation: carte-apparition 0.35s ease both;
}

@keyframes carte-apparition {
  from {
    opacity: 0;
  }
}

/* Le décalage vient d'un translate et non d'une marge, sinon il s'accumulerait
   d'une rangée à l'autre ; le padding rattrape la hauteur ainsi débordée.
   L'écart entre rangées (296) couvre le plus grand décalage (275) plus la
   gouttière (21) : sans cela une carte peu décalée passerait sous celle du
   dessus, alors que dans la maquette les cartes ne se chevauchent jamais. Il
   faut bien la valeur maximale et non la plus forte baisse observée à trois
   colonnes : depuis que la rangée occupe tout l'écran le nombre de colonnes
   n'est plus borné, et à cinq colonnes le cycle enchaîne 275 puis 0 dans une
   même colonne.
   667 px = 2 × 323 + 21, soit exactement le seuil de la 2e colonne — en dessous
   la maquette mobile empile les cartes bien alignées, sans éparpillement. */
@container (min-width: 667px) {
  .artistes__cartes {
    row-gap: 296px;
    padding-bottom: 275px;
  }

  .artistes__cartes > * {
    transform: translateY(var(--carte-y, 0px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .artistes__cartes > * {
    animation: none;
  }
}

/* Affiches ------------------------------------------------------------------ */
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

/* L'affiche est un bouton : on lui retire toute l'apparence d'un bouton. */
.artistes__affiche {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

/* ThumbhashImage est prévu pour des boîtes à hauteur fixe (height: 100%). Ici
   la hauteur doit découler de la largeur via l'aspect-ratio, sinon le
   min-content gonfle les pistes de la grille. */
.artistes__poster :deep(.thumbhash-image) {
  height: auto;
}

/* ThumbhashImage letterboxe par défaut (object-fit: contain) ; sur une boîte
   au ratio imposé, il faut recadrer pour ne pas laisser de liseré. L'écart de
   ratio entre les affiches est inférieur à 1 %, le recadrage est invisible. */
.artistes__poster :deep(.thumbhash-image__img) {
  object-fit: cover;
}

.artistes__credit {
  text-align: right;
  font-size: var(--fs-legend);
  line-height: 1.3;
  margin-top: 3px;
}

@media (max-width: 720px) {
  /* La maquette mobile centre le titre et les années, qui passent alors
     sur deux lignes. */
  .artistes__head {
    justify-content: center;
    text-align: center;
  }

  .artistes__years {
    justify-content: center;
    width: 100%;
  }

  /* Une seule colonne de cartes, centrée dans les 345 px utiles. */
  .artistes__cartes {
    justify-content: center;
  }

  .artistes__grid {
    grid-template-columns: 1fr;
    gap: 25px;
  }
}
</style>

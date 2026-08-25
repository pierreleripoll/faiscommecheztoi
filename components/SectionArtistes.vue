<template>
  <section id="artistes" class="section artistes">
    <div class="artistes__colonne">
      <div ref="head" class="artistes__head">
        <h2 class="artistes__title">Artistes</h2>
        <div class="artistes__years">
          <button
            v-for="y in years"
            :key="y.year"
            class="artistes__year surligne"
            :class="{
              'artistes__year--active': selected === y.year,
              'surligne--actif': selected === y.year,
            }"
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
            <span class="reflet" aria-hidden="true" />
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
    <div
      class="artistes__scene"
      :class="{ 'artistes__scene--repliee': !rangs.size }"
      :style="{ '--head-h': `${hauteurHead}px` }"
    >
      <div class="artistes__cartes">
        <ArtisteCard
          v-for="a in artistes"
          v-show="rangs.has(a._path)"
          :key="a._path"
          :data-path="a._path"
          :artiste="a"
          :ouverte="ouverte === a._path"
          :style="eparpillement(rangs.get(a._path) ?? 0)"
          @ouvrir="ouverte = a._path"
          @fermer="ouverte = null"
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
// En useState (comme le nuage « Appel à projet ») : l'aperçu de l'admin choisit
// l'année et retourne la fiche qu'on édite (apercu/plugin.client.js).
const selected = useState("artistes-annee", () => null);

// Chemin de la fiche retournée, s'il y en a une. L'état vit ici et non dans la
// carte : en ouvrir une remet ainsi les autres de face, plutôt que de laisser
// un mur de versos empilés les uns par-dessus les autres.
const ouverte = useState("artistes-ouverte", () => null);

// Hauteur du bandeau titre + années. Le calque de cartes couvre toute la section
// (voir plus bas), titre compris : sans ce décalage la première fiche — celle de
// rang 0, que l'éparpillement ne descend pas — se pose pile sous le titre et les
// années, qui lui passent devant. Son nom, calé en haut de la photo, devenait
// illisible, et les premières lignes du verso se superposaient au texte de la
// section. La hauteur se mesure au lieu de se calculer : les tailles
// interpolent en clamp() et le bandeau passe sur deux lignes en mobile. Mesurer
// après coup ne fait pas sauter la mise en page — la scène est repliée tant
// qu'aucune année n'est choisie.
const head = ref(null);
const hauteurHead = ref(0);
let observateur = null;

onMounted(() => {
  if (!head.value) return;
  const mesurer = () => {
    const el = head.value;
    if (!el) return;
    const bas = parseFloat(getComputedStyle(el).marginBottom) || 0;
    hauteurHead.value = Math.ceil(el.offsetHeight + bas);
  };
  mesurer();
  observateur = new ResizeObserver(mesurer);
  observateur.observe(head.value);
});

onBeforeUnmount(() => observateur?.disconnect());

function toggle(year) {
  selected.value = selected.value === year ? null : year;
  // Changer d'année remet tout de face : la fiche ouverte appartenait à
  // l'édition qu'on vient de quitter.
  ouverte.value = null;
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

// Rang de chaque fiche parmi celles de l'année choisie, ou rien si elle n'en est
// pas : toutes restent montées dans le DOM et se masquent en CSS. Les monter au
// clic paraissait plus propre, mais le prérendu ne fabrique les dérivées
// d'image que pour les URL présentes dans le HTML généré, et sur un
// hébergement statique personne n'est là pour les transformer à la demande —
// les douze portraits partaient en 404 sur GitHub Pages alors que les affiches,
// elles, passaient. Le rang porte l'éparpillement : il compte parmi les cartes
// visibles, pas dans la liste entière, sinon le cycle sauterait des valeurs dès
// qu'une autre année aura ses fiches.
const rangs = computed(() => {
  const m = new Map();
  if (!selected.value) return m;
  props.artistes
    .filter((a) => String(a.year) === selected.value)
    .forEach((a, i) => m.set(a._path, i));
  return m;
});

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
    // Le reflet de chaque carte part à son tour : même cycle de quatre que
    // l'éparpillement, pour que deux voisines ne scintillent jamais ensemble.
    "--reflet-delai": `${-(i % DECALAGES.length) * 1.3}s`,
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

/* Les années à 50 %, comme les entrées de nav (Siméon, commentaire Figma #1) ;
   l'édition choisie et l'année survolée reviennent pleines. Le surligneur
   (.surligne, main.css) remplace le soulignement, et reste posé sur l'année
   active. background-color et non `background: none`, qui effacerait la
   bande. */
.artistes__year {
  border: 0;
  background-color: transparent;
  padding: 0;
  font: inherit;
  font-size: var(--fs-body);
  line-height: 1;
  color: var(--c-ink);
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s ease, background-size 0.35s ease;
}

.artistes__year--active,
.artistes__year:hover,
.artistes__year:focus-visible {
  opacity: 1;
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
/* Repliée, la scène sort de la grille : ses cartes sont masquées une à une,
   mais son padding de rattrapage occuperait encore 275 px de vide. */
.artistes__scene--repliee {
  display: none;
}

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
  /* Les cartes commencent sous le bandeau titre, dont la hauteur est mesurée au
     montage. Le calque continue de couvrir toute la section — le titre reste
     au-dessus et cliquable, mais plus aucune carte ne vient sous son texte. */
  padding-top: var(--head-h, 0px);
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

  .artistes__affiche {
    transition: none;
  }

  .artistes__affiche:hover,
  .artistes__affiche:focus-visible {
    transform: none;
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
  /* Ancre de la lueur d'invitation, et léger grossissement au survol. */
  position: relative;
  transition: transform 0.4s ease;
  /* Le z-index de la lueur ci-dessous doit rester enfermé ici. Sans ce
     contexte d'empilement il remonte jusqu'à la section — même piège que le
     z-index de l'image dans ThumbhashImage, déjà documenté plus bas — et la
     lueur de l'affiche vient alors se peindre PAR-DESSUS les cartes, qui ne
     sont qu'à z-index 1 : on croit voir les affiches au travers des cartes.
     isolation plutôt qu'un z-index, pour ne pas déplacer le bouton dans
     l'ordre d'empilement de la section. */
  isolation: isolate;
}

/* Rien dans le design ne dit que les affiches se cliquent : un reflet les
   traverse (.reflet, main.css — retour de Siméon, 25.08.2026, qui remplace la
   lueur qui respirait) et, au survol, la lueur s'allume. L'opacité seule
   s'anime — pas le box-shadow, coûteux à repeindre à chaque frame. */
.artistes__affiche::after {
  content: "";
  position: absolute;
  inset: 0;
  /* Au-dessus de l'image de ThumbhashImage (z-index 1). */
  z-index: 2;
  box-shadow: var(--glow-invite);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

.artistes__affiche .reflet {
  z-index: 2;
}

/* Déphasées, sinon les trois affiches scintillent en chœur. Delay négatif : le
   cycle est déjà entamé au chargement, pas d'attente à froid. */
.artistes__poster:nth-child(3n + 2) {
  --reflet-delai: -1.8s;
}

.artistes__poster:nth-child(3n) {
  --reflet-delai: -3.6s;
}

.artistes__affiche:hover,
.artistes__affiche:focus-visible {
  transform: scale(1.015);
}

.artistes__affiche:hover::after,
.artistes__affiche:focus-visible::after {
  opacity: 1;
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

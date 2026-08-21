<template>
  <!--
    Carte « VAL-VERSO » du Figma : une carte à deux faces de 323 × 437 px.
    Recto = la photo en plein cadre sous un aplat magenta, le nom posé dessus ;
    verso = le même cadre, sans image, rempli de texte. Les deux sections
    /artistes_avant et /artistes_dos du fichier de design sont la même page avec
    toutes les cartes retournées — d'où le pivot plutôt qu'un fondu.
  -->
  <div
    class="carte"
    :class="{ 'carte--retournee': verso, 'carte--tronquee': tronquee }"
  >
    <div class="carte__pivot">
      <!-- RECTO ------------------------------------------------------------ -->
      <div class="carte__face carte__face--recto">
        <ThumbhashImage
          v-if="photo"
          :key="photo.src"
          :image="photo"
          class="carte__photo"
          sizes="323px"
        />
        <div class="carte__teinte" aria-hidden="true" />

        <p class="carte__nom">{{ artiste.name }}</p>

        <!-- Le bouton couvre toute la face : c'est la carte entière qui se
             retourne. Les commandes du carrousel passent au-dessus. -->
        <button
          class="carte__bascule"
          type="button"
          :aria-label="`Voir les infos de ${artiste.name}`"
          @click="retourner"
        />

        <template v-if="photos.length > 1">
          <button
            class="carte__fleche carte__fleche--prec"
            type="button"
            aria-label="Photo précédente"
            @click="tourner(-1)"
          >
            <svg viewBox="0 0 12 20" aria-hidden="true">
              <path
                d="M10 1L2 10l8 9"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            class="carte__fleche carte__fleche--suiv"
            type="button"
            aria-label="Photo suivante"
            @click="tourner(1)"
          >
            <svg viewBox="0 0 12 20" aria-hidden="true">
              <path
                d="M2 1l8 9-8 9"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div class="carte__points">
            <button
              v-for="(p, i) in photos"
              :key="p.src"
              class="carte__point"
              :class="{ 'carte__point--actif': i === index }"
              type="button"
              :aria-label="`Photo ${i + 1} sur ${photos.length}`"
              :aria-current="i === index ? 'true' : undefined"
              @click="index = i"
            />
          </div>
        </template>

        <div class="carte__lueur" aria-hidden="true" />
      </div>

      <!-- VERSO ------------------------------------------------------------ -->
      <div
        ref="face"
        class="carte__face carte__face--verso"
        :style="hauteurVerso ? { height: `${hauteurVerso}px` } : null"
      >
        <div ref="texte" class="carte__texte">
          <p class="carte__nom carte__nom--verso">{{ artiste.name }}</p>

          <p v-if="artiste.title">{{ artiste.title }}</p>
          <p v-if="artiste.duration || artiste.format">
            {{ [artiste.duration, artiste.format].filter(Boolean).join(" · ") }}
          </p>
          <p v-if="artiste.collaboration">{{ artiste.collaboration }}</p>

          <p v-if="artiste.venue">{{ representation }}</p>
          <p v-if="artiste.also">{{ representationAilleurs }}</p>

          <div class="carte__bio">
            <ContentRenderer :value="artiste" />
          </div>

          <p v-if="artiste.with">Avec {{ artiste.with }}</p>
          <p v-if="artiste.school">{{ artiste.school }}</p>
          <!-- Le recto ne porte pas de crédit photo dans le design ; on ne le
               perd pas pour autant, il finit la fiche. -->
          <p v-if="credits">{{ credits }}</p>
        </div>

        <!-- Même croix que le nuage « Appel à projet » : le seul geste de
             fermeture déjà présent dans le design. -->
        <button
          class="carte__fermer"
          type="button"
          aria-label="Revenir à la photo"
          @click="refermer"
        >
          <svg viewBox="0 0 29.25 29.25" aria-hidden="true">
            <path
              d="M1.875 27.375L27.375 1.875"
              stroke="currentColor"
              stroke-width="3.75"
              stroke-linecap="round"
            />
            <path
              d="M27.375 27.375L1.875 1.875"
              stroke="currentColor"
              stroke-width="3.75"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <div class="carte__lueur" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  artiste: { type: Object, required: true },
});

const verso = ref(false);
const index = ref(0);
const face = ref(null);
const texte = ref(null);

// Hauteur du verso une fois déployé, en pixels : la fiche s'agrandit vers le bas
// pour montrer tout son texte d'un coup. Elle grandit en absolu, sans toucher au
// flux : les fiches sont un calque flottant au-dessus des affiches, et les faire
// bouger déplacerait tout le mur à chaque clic.
const hauteurVerso = ref(null);
// Vrai quand, même déployée, la fiche reste plus courte que son texte (bio très
// longue, ou petit écran) : elle garde alors son défilement et son dégradé.
const tronquee = ref(false);

// Ce qu'on laisse respirer sous une fiche qui touche le bas de la fenêtre.
const MARGE_ECRAN = 40;
// Mi-parcours du pivot : la carte est sur la tranche, donc invisible.
const MI_PIVOT = 250;

function retourner() {
  const cadre = face.value?.offsetHeight;
  const el = texte.value;
  if (cadre && el) {
    // Le bloc de texte est calé en inset: 0 dans le cadre : leur différence de
    // hauteur, ce sont les bordures. Son scrollHeight donne donc la hauteur qu'il
    // faudrait au cadre — jamais moins que celle de départ, une fiche courte ne
    // rétrécit pas.
    const bord = cadre - el.clientHeight;
    const besoin = Math.max(Math.ceil(el.scrollHeight) + bord, cadre);
    const plafond = Math.max(window.innerHeight - MARGE_ECRAN, cadre);
    hauteurVerso.value = Math.min(besoin, plafond);
    tronquee.value = besoin > plafond;
  }
  verso.value = true;
}

function refermer() {
  verso.value = false;
  tronquee.value = false;
  // Le cadre ne reprend sa taille qu'à mi-pivot : d'ici là le verso est encore
  // face à nous, et le voir rapetisser pendant qu'il tourne ferait un à-coup.
  setTimeout(() => {
    if (!verso.value) hauteurVerso.value = null;
  }, MI_PIVOT);
}

const photos = computed(() => props.artiste.photos || []);
// Bornée : le nombre de photos peut diminuer (édition dans le CMS) alors que
// l'index pointe encore plus loin — la carte se retrouverait sans image.
const photo = computed(
  () => photos.value[Math.min(index.value, photos.value.length - 1)]
);

function tourner(pas) {
  const n = photos.value.length;
  index.value = (index.value + pas + n) % n;
}

// Le design écrit la représentation sur une seule ligne, séparée par des barres :
// « Théâtre de Valère | Ven. 3 oct. – 18h30 | Sam. 4 oct. 19h30 ».
const representation = computed(() =>
  [props.artiste.venue, ...(props.artiste.dates || [])].join(" | ")
);

const credits = computed(() => {
  const liste = [...new Set(photos.value.map((p) => p.credit).filter(Boolean))];
  return liste.length ? `Photo ${liste.join(", ")}` : "";
});

const representationAilleurs = computed(() => {
  const a = props.artiste.also;
  if (!a) return "";
  return [a.festival, a.venue, ...(a.dates || [])].filter(Boolean).join(" | ");
});

// La grille horaire ouvre la fiche depuis l'extérieur : cliquer un créneau
// doit montrer la présentation, pas seulement la photo.
defineExpose({ ouvrir: retourner });
</script>

<style scoped>
.carte {
  /* Le gabarit fait 323 px de large ; en dessous (petits téléphones) la carte
     rétrécit à la largeur utile plutôt que de déborder, sans se déformer. */
  width: 100%;
  max-width: var(--card-w);
  aspect-ratio: var(--card-ratio);
  /* Sans perspective le rotateY est une simple compression horizontale. */
  perspective: 1200px;
}

.carte__pivot {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.carte--retournee .carte__pivot {
  transform: rotateY(180deg);
}

/* Déployée, la fiche empiète sur ses voisines — au mieux 21 px les séparent une
   fois l'éparpillement appliqué. Elle passe donc au-dessus des autres. Le
   z-index porte sur un élément flex, pas besoin de le positionner. */
.carte--retournee {
  z-index: 2;
}

/* Le cadre du Figma, identique sur les deux faces. */
.carte__face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 1px solid var(--c-card-border);
  border-radius: var(--card-radius);
  background: var(--c-card-bg);
  box-shadow: var(--glow-card);
  /* Le cadre du Figma est à 90 % d'opacité, mais rien n'est posé derrière lui
     dans la maquette : la translucidité n'y est donc jamais visible. Sur le mur
     d'affiches elle l'est, et l'affiche transparaît au travers de la photo. */
  backface-visibility: hidden;
  /* La face cachée reste focusable tant qu'elle est seulement retournée ;
     on la retire de l'arbre le temps que le pivot finisse sa rotation. */
  visibility: hidden;
  transition: visibility 0s linear 0.25s;
}

.carte__face--recto,
.carte--retournee .carte__face--verso {
  visibility: visible;
  transition-delay: 0s;
}

.carte--retournee .carte__face--recto {
  visibility: hidden;
  transition-delay: 0.25s;
}

.carte__face--verso {
  transform: rotateY(180deg);
  /* Hauteur du cadre au repos, que le style en ligne remplace à l'ouverture.
     Sur-contrainte avec top et bottom à 0 : c'est bottom qui cède, la fiche
     s'agrandit donc vers le bas. Elle change d'un coup et n'est pas animée :
     Chrome fige toute transition de height dont une extrémité est un
     pourcentage — et de toute façon le saut tombe au moment où la carte est sur
     la tranche, où il n'y a rien à voir. */
  height: 100%;
}

/* La lueur interne est peinte par-dessus l'image : un box-shadow inset sur la
   face passerait sous elle. */
.carte__lueur {
  position: absolute;
  inset: 0;
  z-index: 4;
  border-radius: inherit;
  box-shadow: var(--glow-card-inset);
  pointer-events: none;
}

/* Recto ---------------------------------------------------------------------
   La photo remplit le cadre : ThumbhashImage letterboxe par défaut (boîte à
   hauteur fixe, object-fit: contain), on repasse ses deux calques en cover. */
.carte__photo {
  position: absolute;
  inset: 0;
}

.carte__photo :deep(.thumbhash-image__img) {
  object-fit: cover;
  transition: transform 0.6s ease;
}

/* Survoler le recto grossit doucement la photo : la carte répond au curseur
   et invite à la retourner (le cadre, overflow: hidden, rogne le débord). */
.carte__face--recto:hover .carte__photo :deep(.thumbhash-image__img) {
  transform: scale(1.05);
}

.carte__photo :deep(.thumbhash-image__placeholder) {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  background-size: cover;
}

.carte__teinte {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--c-ink);
  opacity: var(--card-tint);
  pointer-events: none;
}

.carte__nom {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 100%;
  margin: 0;
  padding: var(--card-pad);
  font-size: var(--fs-card);
  line-height: 1.15;
  color: var(--c-ink);
  text-transform: uppercase;
  pointer-events: none;
}

/* Le magenta du nom se perd sur les photos claires — celle de Tibère Dewier est
   un mur blanc pile là où le nom se pose, et la teinte à 25 % n'y change rien :
   on tombe à 2,1:1 de contraste. Un voile aux couleurs de la carte, fondu vers
   le bas, ramène le nom à la lisibilité du verso (magenta sur fond de carte),
   qui est celle que le design assume déjà. Le voile ne vaut que pour le recto :
   au verso le nom est déjà sur ce fond. */
.carte__face--recto .carte__nom {
  padding-bottom: 28px;
  background: linear-gradient(
    to bottom,
    rgba(255, 252, 255, 0.92) 0%,
    rgba(255, 252, 255, 0.85) 60%,
    rgba(255, 252, 255, 0) 100%
  );
}

.carte__bascule {
  position: absolute;
  inset: 0;
  z-index: 3;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
}

/* Le carrousel n'est pas dessiné dans le Figma (les points visibles sur la
   maquette appartiennent aux captures collées par le designer) : on reprend
   l'idiome de la nav — magenta à 50 %, plein au survol et sur l'élément actif. */
.carte__fleche,
.carte__point {
  z-index: 5;
  border: 0;
  padding: 0;
  background: none;
  color: var(--c-ink);
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.carte__fleche:hover,
.carte__fleche:focus-visible,
.carte__point:hover,
.carte__point:focus-visible,
.carte__point--actif {
  opacity: 1;
}

.carte__fleche {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carte__fleche svg {
  width: 12px;
  height: 20px;
}

.carte__fleche--prec {
  left: 2px;
}

.carte__fleche--suiv {
  right: 2px;
}

.carte__points {
  position: absolute;
  z-index: 5;
  left: 0;
  bottom: 10px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.carte__point {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* Verso --------------------------------------------------------------------
   Le design cale tout le verso sur une seule taille et une seule couleur ;
   seules les lignes vides rythment le bloc. */
.carte__texte {
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: var(--card-pad);
  font-size: var(--fs-card);
  line-height: 1.15;
  color: var(--c-ink);
  /* Masqué et non défilant par défaut : la fiche se dimensionne sur son texte,
     et la mesure au clic doit se faire sans barre de défilement — présente, elle
     rétrécirait la colonne de texte et fausserait la hauteur calculée. */
  overflow: hidden;
}

/* Seul cas restant : un texte plus haut que la fenêtre. */
.carte--tronquee .carte__texte {
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.carte__texte p,
.carte__bio :deep(p) {
  margin: 0;
}

/* Au verso le nom fait partie du flux : il reprend la casse et la taille du
   recto, mais pas son calage en absolu ni son padding (déjà porté par le bloc). */
.carte__nom--verso {
  position: static;
  width: auto;
  padding: 0 20px 0 0;
}

/* Une ligne vide avant la biographie et après le nom, comme dans la maquette.
   Sélecteur descendant obligatoire : `.carte__texte p` remettrait la marge à 0. */
.carte__texte .carte__nom--verso,
.carte__bio {
  margin-bottom: 1em;
}

.carte__bio {
  margin-top: 1em;
}

/* Un dégradé vers le fond de la carte signale qu'il reste du texte — seulement
   quand la fiche déployée n'a pas pu tout montrer. */
.carte--tronquee .carte__face--verso::after {
  content: "";
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  height: 40px;
  background: linear-gradient(to top, var(--c-card-bg), transparent);
  pointer-events: none;
}

.carte__fermer {
  position: absolute;
  z-index: 3;
  top: 12.4px;
  right: 6.2px;
  width: 14px;
  height: 14px;
  border: 0;
  padding: 0;
  background: none;
  color: var(--c-ink);
  cursor: pointer;
}

.carte__fermer svg {
  display: block;
  width: 100%;
  height: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .carte__pivot {
    transition: none;
  }

  .carte__photo :deep(.thumbhash-image__img) {
    transition: none;
  }

  .carte__face--recto:hover .carte__photo :deep(.thumbhash-image__img) {
    transform: none;
  }
}
</style>

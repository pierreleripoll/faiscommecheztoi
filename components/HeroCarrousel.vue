<template>
  <!-- Le cadre porte le ratio de la première photo : les suivantes se
       calent dedans (object-fit: contain), la page ne bouge pas quand elles
       défilent. -->
  <figure class="carrousel">
    <div
      class="carrousel__cadre"
      :style="{ aspectRatio: ratio }"
      @mouseenter="survol = true"
      @mouseleave="survol = false"
      @pointerdown="toucher"
      @pointerup="relacher"
      @pointercancel="relacher"
      @dragstart.prevent
    >
      <div
        v-for="(p, i) in photos"
        :key="p.src"
        class="carrousel__diapo"
        :class="{ 'carrousel__diapo--active': i === index }"
        :aria-hidden="i === index ? undefined : 'true'"
      >
        <!-- Seule la première est prioritaire (LCP) ; les autres se chargent
             en différé, elles sont dans la fenêtre donc tout de suite. -->
        <ThumbhashImage
          :image="p"
          sizes="100vw sm:100vw lg:1280px xl:1440px"
          :priority="i === 0"
        />
      </div>

      <template v-if="photos.length > 1">
        <!-- Les bords de la photo sont deux grands boutons, la flèche au
             ras du bord : on n'a pas à viser, on clique du côté où on veut
             aller. Même chevron que sur les cartes artistes. -->
        <button
          class="carrousel__zone carrousel__zone--prec"
          type="button"
          aria-label="Photo précédente"
          @click="cliquer(-1)"
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
          class="carrousel__zone carrousel__zone--suiv"
          type="button"
          aria-label="Photo suivante"
          @click="cliquer(1)"
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

        <div class="carrousel__points">
          <button
            v-for="(p, i) in photos"
            :key="p.src"
            class="carrousel__point"
            :class="{ 'carrousel__point--actif': i === index }"
            type="button"
            :aria-label="`Photo ${i + 1} sur ${photos.length}`"
            :aria-current="i === index ? 'true' : undefined"
            @click="aller(i)"
          />
        </div>
      </template>
    </div>
    <figcaption v-if="credit" class="carrousel__credit">{{ credit }}</figcaption>
  </figure>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

// Carrousel du haut de page : les photos des éditions passées défilent toutes
// seules, en fondu (demande du design, août 2026). On peut aussi les
// feuilleter : flèches sur les bords, points, balayage au doigt ou à la
// souris. Après un geste le défilement s'arrête un moment, puis reprend.
const props = defineProps({
  photos: { type: Array, required: true },
});

// Temps d'affichage d'une photo (le fondu est en CSS, plus bas).
const INTERVALLE = 5000;
// Répit après un geste avant que le défilement reprenne.
const REPIT = 12000;
// Déplacement minimal pour qu'un glissé compte comme un balayage.
const SEUIL_BALAYAGE = 40;

const index = ref(0);
const survol = ref(false);
// Instant du dernier geste (clic, point, balayage) : on ne retire pas la
// photo sous les yeux de quelqu'un qui vient de la choisir.
let dernierGeste = 0;

// Bornée : la liste peut raccourcir (édition dans le CMS) alors que l'index
// pointe encore plus loin.
watch(
  () => props.photos.length,
  (n) => {
    if (index.value >= n) index.value = Math.max(0, n - 1);
  }
);

const ratio = computed(() => {
  const p = props.photos[0];
  return p?.width && p?.height ? `${p.width} / ${p.height}` : "7 / 5";
});

const credit = computed(() => {
  const c = props.photos[index.value]?.credit;
  return c ? `Photo ${c}` : "";
});

function aller(i) {
  index.value = i;
  dernierGeste = Date.now();
}

function tourner(pas) {
  const n = props.photos.length;
  aller((index.value + pas + n) % n);
}

// Balayage : un pointeur (doigt ou souris) qui parcourt au moins SEUIL
// horizontalement, plus que verticalement. touch-action: pan-y (CSS) laisse
// le défilement vertical de la page au navigateur.
let depart = null;
// Vrai juste après un balayage : le clic que le navigateur envoie ensuite au
// bouton sous le doigt ne doit pas tourner une seconde fois.
let balaye = false;

function toucher(e) {
  if (e.button !== undefined && e.button !== 0) return;
  depart = { x: e.clientX, y: e.clientY };
  balaye = false;
}

function relacher(e) {
  if (!depart) return;
  const dx = e.clientX - depart.x;
  const dy = e.clientY - depart.y;
  depart = null;
  if (e.type === "pointercancel") return;
  if (Math.abs(dx) < SEUIL_BALAYAGE || Math.abs(dx) < Math.abs(dy)) return;
  balaye = true;
  tourner(dx < 0 ? 1 : -1);
}

function cliquer(pas) {
  if (balaye) {
    balaye = false;
    return;
  }
  tourner(pas);
}

let minuteur = null;

function avancer() {
  const n = props.photos.length;
  if (n < 2 || survol.value || document.hidden) return;
  if (Date.now() - dernierGeste < REPIT) return;
  index.value = (index.value + 1) % n;
}

onMounted(() => {
  // Le réglage système « réduire les animations » coupe le défilement
  // automatique ; les points restent.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  minuteur = setInterval(avancer, INTERVALLE);
});

onUnmounted(() => {
  if (minuteur) clearInterval(minuteur);
});
</script>

<style scoped>
.carrousel {
  margin: 0;
  width: 100%;
}

.carrousel__cadre {
  position: relative;
  width: 100%;
  overflow: hidden;
  /* Le balayage horizontal est à nous, le défilement vertical reste au
     navigateur. Sans user-select, un glissé à la souris sélectionnerait
     le texte autour. */
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  /* Sans isolation, le plus-lighter du calque de teinte se mélangerait aussi
     au fond de page et déborderait de la photo. */
  isolation: isolate;
}

.carrousel__diapo {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.9s ease;
}

.carrousel__diapo--active {
  opacity: 1;
}

/* Deux calques se superposent aux photos, dans cet ordre :
   1. la teinte magenta, mélangée à l'image ;
   2. la lueur des bords, posée par-dessus.
   Un box-shadow: inset ne conviendrait pas : il serait peint sous l'image. */
.carrousel__cadre::after,
.carrousel__cadre::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Les photos sources sont neutres ; le design les teinte d'un magenta additif
   à 28 %. En plus-lighter, la lueur des projecteurs reste lumineuse au lieu
   d'être noyée sous un voile opaque. */
.carrousel__cadre::after {
  z-index: 1;
  background: var(--c-ink);
  opacity: 0.28;
  mix-blend-mode: plus-lighter;
}

/* Lueur projetée par les blocs roses au-dessus et en dessous de la photo. */
.carrousel__cadre::before {
  z-index: 2;
  background: linear-gradient(
      to bottom,
      var(--glow-photo),
      transparent 35px
    ),
    linear-gradient(to top, var(--glow-photo), transparent 35px);
}

/* Flèches et points reprennent ceux des cartes artistes : magenta à 50 %,
   plein au survol et sur la photo affichée. Au-dessus des calques de teinte. */
.carrousel__zone {
  position: absolute;
  z-index: 3;
  top: 0;
  bottom: 0;
  /* Un bon cinquième de la photo de chaque côté, jamais moins qu'un pouce. */
  width: max(18%, 56px);
  display: flex;
  align-items: center;
  border: 0;
  padding: 0 10px;
  background: none;
  color: var(--c-ink);
  cursor: pointer;
}

.carrousel__zone--prec {
  left: 0;
  justify-content: flex-start;
}

.carrousel__zone--suiv {
  right: 0;
  justify-content: flex-end;
}

.carrousel__zone svg {
  width: 18px;
  height: 30px;
  opacity: 0.5;
  transition: opacity 0.15s ease;
}

.carrousel__zone:hover svg,
.carrousel__zone:focus-visible svg {
  opacity: 1;
}

/* Le liseré de focus commun (main.css) déborderait du cadre : à l'intérieur. */
.carrousel__zone:focus-visible {
  outline-offset: -3px;
}

.carrousel__points {
  position: absolute;
  z-index: 4;
  left: 0;
  bottom: 12px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.carrousel__point {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  background: currentColor;
  color: var(--c-ink);
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.carrousel__point:hover,
.carrousel__point:focus-visible,
.carrousel__point--actif {
  opacity: 1;
}

/* Même écriture que le crédit des affiches. */
.carrousel__credit {
  text-align: right;
  font-size: var(--fs-legend);
  line-height: 1.3;
  margin-top: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .carrousel__diapo {
    transition: none;
  }
}
</style>

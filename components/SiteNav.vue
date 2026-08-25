<template>
  <nav class="site-nav" :class="{ 'site-nav--compacte': compacte }">
    <!-- La ligne de la maquette desktop. Dès qu'elle ne tient plus en entier
         dans la fenêtre, elle cède la place au nuage-menu (Siméon, 25.08.2026)
         — elle ne défile plus latéralement, ce que rien ne signalait. Elle
         reste dans le DOM, invisible, pour qu'on puisse la remesurer. -->
    <div ref="ligne" class="site-nav__inner">
      <a class="site-nav__brand" href="#top">Fais comme chez toi</a>
      <a v-for="e in ENTREES" :key="e.href" :href="e.href">{{ e.label }}</a>
    </div>

    <!-- Barre compacte : la marque et un nuage-menu. Sous 720 px d'office
         (HTML prérendu), au-dessus dès que la ligne déborde (mesuré). -->
    <div class="site-nav__mobile">
      <a class="site-nav__brand" href="#top">Fais comme chez toi</a>
      <!-- Le tracé est celui du nuage « Appel à projet » (nœud CLOUD du Figma),
           le hamburger en traits à bouts ronds, aux couleurs du nuage. -->
      <button
        ref="nuage"
        class="site-nav__nuage"
        type="button"
        aria-label="Menu"
        aria-controls="menu-nuage"
        :aria-expanded="ouvert"
        @click="ouvrir"
      >
        <svg viewBox="0 0 428 257" aria-hidden="true">
          <path class="site-nav__nuage-corps" :d="NUAGE" />
          <path
            class="site-nav__nuage-traits"
            d="M162 121H266M162 158H266M162 195H266"
          />
        </svg>
      </button>
    </div>

    <div
      v-show="ouvert"
      id="menu-nuage"
      class="site-nav__panneau"
      @keydown.esc="fermer"
    >
      <div class="site-nav__panneau-tete">
        <span class="site-nav__brand">Fais comme chez toi</span>
        <!-- Même croix que le nuage et le verso de la carte. -->
        <button
          ref="croix"
          class="site-nav__fermer"
          type="button"
          aria-label="Fermer le menu"
          @click="fermer"
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
      </div>
      <div class="site-nav__liens">
        <a
          v-for="e in ENTREES"
          :key="e.href"
          :href="e.href"
          :class="{ 'site-nav__lien--courant': courant === e.href }"
          @click="fermer"
          >{{ e.label }}</a
        >
      </div>
    </div>
  </nav>
</template>

<script setup>
const ENTREES = [
  { label: "Artistes", href: "#artistes" },
  { label: "Grille", href: "#grille" },
  { label: "Infos", href: "#infos" },
  { label: "Partenariats", href: "#partenariats" },
  { label: "Participer", href: "#participer" },
  { label: "Contact & Team", href: "#contact" },
];

const NUAGE =
  "M390.481 256.962L37.9204 257C17.8298 257 0.0857717 241.547 0.0643417 221.075L5.17068e-05 167.133C-0.0320933 140.511 14.926 117.084 38.183 104.58C51.7535 97.2822 67.0224 94.2634 82.7359 95.1857C70.3333 53.657 95.6528 11.0667 137.136 1.80112C179.021 -7.55556 220.177 20.5038 226.274 63.6732C262.989 55.5927 299.758 76.3222 311.957 112.103C334.983 96.0972 364.835 94.1133 389.876 107.813C412.41 120.14 428.021 144.339 428 171.331L427.952 221.08C427.936 241.273 410.46 256.957 390.476 256.957L390.481 256.962Z";

// La section d'où l'on vient, lue dans l'ancre de l'URL — après montage
// seulement, le HTML prérendu ne connaît pas l'ancre.
const courant = ref("");
function lireAncre() {
  courant.value = location.hash;
}

// Barre compacte --------------------------------------------------------------
// La ligne complète ne s'affiche que si elle tient en entier : sinon la barre
// passe en marque + nuage-menu. Mesuré plutôt que fixé par une media query, la
// largeur de la ligne dépendant de la police (Vevey ou son repli) et de ses
// entrées. Sous 720 px la feuille de style tranche déjà toute seule, avant
// l'hydratation ; la mesure ne fait qu'étendre la barre compacte vers le haut.
const ligne = ref(null);
const compacte = ref(false);

function mesurer() {
  const el = ligne.value;
  if (!el) return;
  // La ligne mesure toujours la largeur de la barre, même cachée (position
  // absolue de bord à bord) : scrollWidth dit ce qu'il lui faudrait.
  compacte.value = el.scrollWidth - el.clientWidth > 1;
}

// Si la fenêtre s'élargit assez pour la ligne avec le menu ouvert, le panneau
// se ferme : sinon il resterait affiché et le défilement bloqué.
watch(compacte, (c) => {
  if (!c) fermer();
});


// Nuage-menu ------------------------------------------------------------------
const ouvert = ref(false);
const nuage = ref(null);
const croix = ref(null);

async function ouvrir() {
  ouvert.value = true;
  // Le panneau couvre toute la fenêtre : la page dessous ne doit plus défiler.
  document.documentElement.style.overflow = "hidden";
  await nextTick();
  croix.value?.focus();
}

function fermer() {
  if (!ouvert.value) return;
  ouvert.value = false;
  document.documentElement.style.overflow = "";
  nuage.value?.focus({ preventScroll: true });
}

onMounted(() => {
  mesurer();
  // La largeur de la ligne dépend de la police : on remesure quand Vevey
  // arrive, et à chaque redimensionnement.
  document.fonts?.ready.then(mesurer);
  window.addEventListener("resize", mesurer, { passive: true });
  lireAncre();
  window.addEventListener("hashchange", lireAncre);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", mesurer);
  window.removeEventListener("hashchange", lireAncre);
});
</script>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--c-bar);
  box-shadow: var(--glow-nav);
}

.site-nav__inner {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  /* 20 px de padding vertical + 26 px de ligne = les 66 px de la maquette. */
  padding: 20px var(--pad-x);
  font-size: var(--fs-nav);
  line-height: 1.3;
  /* Sur une seule ligne, jamais à la ligne : ce qui déborde est mesuré et
     fait basculer la barre en compacte. Le rognage n'est visible que le temps
     de l'hydratation, dans la bande entre 720 px et la largeur de la ligne. */
  white-space: nowrap;
  overflow: hidden;
}

/* Barre compacte : la ligne se retire — mais reste mesurable, de bord à bord —
   et la marque + le nuage prennent sa place. */
.site-nav--compacte .site-nav__inner {
  position: absolute;
  inset-inline: 0;
  top: 0;
  visibility: hidden;
  pointer-events: none;
}

.site-nav--compacte .site-nav__mobile {
  display: flex;
}

.site-nav a {
  text-decoration: none;
  /* Les entrées de nav sont à 50 % d'opacité dans le design. */
  opacity: 0.5;
  transition: opacity 0.15s ease;
}

.site-nav a:hover,
.site-nav a:focus-visible {
  opacity: 1;
}

.site-nav__brand {
  text-transform: uppercase;
}

/* Mobile : la marque et le nuage ---------------------------------------------- */
.site-nav__mobile {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 10px var(--pad-x);
  /* Même hauteur que la ligne desktop : scroll-padding-top compte dessus. */
  min-height: 66px;
  font-size: var(--fs-nav);
  line-height: 1.3;
}

.site-nav__nuage {
  flex: none;
  width: 72px;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
  filter: drop-shadow(var(--glow-cloud));
}

.site-nav__nuage svg {
  display: block;
  width: 100%;
  height: auto;
  /* La lueur déborde du tracé. */
  overflow: visible;
}

.site-nav__nuage-corps {
  fill: var(--c-cloud);
}

.site-nav__nuage-traits {
  fill: none;
  stroke: var(--c-cloud-ink);
  /* Le poids de la croix du nuage, rapporté à la boîte de 428 px. */
  stroke-width: 17;
  stroke-linecap: round;
}

/* Le panneau ouvert : toute la fenêtre aux couleurs de la barre. -------------- */
.site-nav__panneau {
  position: fixed;
  inset: 0;
  /* Par-dessus la barre elle-même (20) et les cartes retournées. */
  z-index: 30;
  display: flex;
  flex-direction: column;
  padding: 20px var(--pad-x) 40px;
  background: var(--c-bar);
  overflow-y: auto;
  font-size: var(--fs-nav);
  line-height: 1.3;
  animation: panneau-fondu 0.25s ease;
}

@keyframes panneau-fondu {
  from {
    opacity: 0;
  }
}

.site-nav__panneau-tete {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

/* La marque du panneau n'est pas un lien : même présence que dans la barre. */
.site-nav__panneau-tete .site-nav__brand {
  opacity: 0.5;
}

.site-nav__fermer {
  flex: none;
  width: 22px;
  height: 22px;
  border: 0;
  padding: 0;
  background: none;
  color: var(--c-ink);
  cursor: pointer;
}

.site-nav__fermer svg {
  display: block;
  width: 100%;
  height: 100%;
}

.site-nav__liens {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-top: 60px;
}

/* Les entrées à la taille du corps mobile (37 px), pleines et non à 50 % :
   seules, sur toute la fenêtre, elles n'ont plus à s'effacer devant la page. */
.site-nav__liens a {
  font-size: 37px;
  line-height: 1;
  opacity: 1;
}

/* La section d'où l'on vient reste soulignée — l'état actif du design. */
.site-nav__liens a:hover,
.site-nav__liens a:focus-visible,
.site-nav__liens .site-nav__lien--courant {
  text-decoration: underline;
  text-decoration-thickness: 0.06em;
  text-underline-offset: 0.16em;
}

/* Sous 720 px, compacte d'office : le HTML prérendu sort déjà juste, sans
   attendre la mesure. Même retrait que par la classe, pour qu'on puisse
   toujours mesurer la ligne. */
@media (max-width: 720px) {
  .site-nav__inner {
    position: absolute;
    inset-inline: 0;
    top: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .site-nav__mobile {
    display: flex;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-nav__panneau {
    animation: none;
  }
}
</style>

<template>
  <nav
    class="site-nav"
    :class="{ 'site-nav--compacte': compacte, 'site-nav--ouverte': ouvert }"
    @keydown.esc="fermer"
  >
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
           ici en contour et non rempli (FCCT_2, 27.08.2026). Pas de ≡ à
           l'intérieur : la maquette n'en prévoit pas, un nuage posé là où
           presque tous les sites mettent leur menu se lisant sans icône. Ce
           qui dit « bouton », c'est le balayage : le même que sur les textes
           cliquables, une fenêtre de plein qui parcourt le trait en boucle.
           D'où le tracé en double — l'un pâle, l'autre plein, celui-ci
           découpé par la fenêtre. -->
      <button
        ref="nuage"
        class="site-nav__nuage"
        type="button"
        :aria-label="ouvert ? 'Fermer le menu' : 'Menu'"
        aria-controls="menu-nuage"
        :aria-expanded="ouvert"
        @click="basculer"
      >
        <svg viewBox="0 0 428 257" aria-hidden="true">
          <path class="site-nav__nuage-corps" :d="NUAGE" />
          <path class="site-nav__nuage-balayage" :d="NUAGE" />
        </svg>
      </button>
    </div>

    <Transition name="panneau">
      <div v-show="ouvert" id="menu-nuage" class="site-nav__panneau">
        <div ref="liens" class="site-nav__liens">
          <a
            v-for="(e, i) in ENTREES"
            :key="e.href"
            :href="e.href"
            :style="{ '--i': i }"
            :class="{ 'site-nav__lien--courant': courant === e.href }"
            @click="fermer"
            >{{ e.label }}</a
          >
        </div>
      </div>
    </Transition>
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
// Le nuage est une bascule : il reste visible par-dessus le panneau ouvert
// (maquette FCCT_2) et c'est lui qu'on retape pour refermer.
const ouvert = ref(false);
const nuage = ref(null);
const liens = ref(null);

function basculer() {
  if (ouvert.value) fermer();
  else ouvrir();
}

async function ouvrir() {
  ouvert.value = true;
  // Le panneau couvre toute la fenêtre : la page dessous ne doit plus défiler.
  document.documentElement.style.overflow = "hidden";
  await nextTick();
  liens.value?.querySelector("a")?.focus();
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

/* Mobile : la marque et le nuage ----------------------------------------------
   Marges de la maquette FCCT_2 : 35 px de part et d'autre, 66 px de haut. En
   dessous de 720 px --pad-x vaut 15 px, d'où le max() ; au-delà (barre
   compacte étendue par la mesure) c'est --pad-x qui l'emporte, la barre
   s'alignant alors sur le reste de la page. */
.site-nav__mobile {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 0 max(35px, var(--pad-x));
  /* Même hauteur que la ligne desktop : scroll-padding-top compte dessus. */
  min-height: 66px;
  font-size: var(--fs-nav);
  line-height: 1.3;
  /* Au-dessus du panneau, qui couvre le reste de la fenêtre : la barre reste
     entière et le nuage cliquable, comme dans la maquette ouverte. */
  position: relative;
  z-index: 1;
}

/* Le nuage fait 42 px de large dans la maquette ; le bouton, lui, garde les
   66 px de la barre pour rester une cible tactile confortable, et sa marge
   négative ramène le bord droit du tracé à 35 px du bord de l'écran. */
.site-nav__nuage {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 66px;
  margin-right: -12px;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
}

.site-nav__nuage svg {
  display: block;
  width: 42px;
  height: auto;
  /* La lueur déborde du tracé. */
  overflow: visible;
  filter: drop-shadow(var(--glow-cloud));
}

/* Contour magenta sur fond de barre : le nuage est dessiné, plus rempli
   (FCCT_2). Le trait est donné en pixels d'écran — sans non-scaling-stroke,
   2 unités de la boîte de 428 ne feraient pas 0,2 px à l'écran. */
.site-nav__nuage-corps,
.site-nav__nuage-balayage {
  stroke: var(--c-ink);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.site-nav__nuage-corps {
  fill: var(--c-bar);
  opacity: 0.5;
  transition:
    fill 0.3s ease,
    opacity 0.3s ease;
}

/* La fenêtre du balayage : le même tracé, en plein, découpé par un masque qui
   le parcourt de gauche à droite. Mêmes proportions et même cycle que la
   fenêtre de lettres de .balayage (main.css) : c'est ce qui remplace le ≡ et
   range le nuage dans la catégorie des boutons.
   Le masque est posé sur le tracé et non sur un calque HTML en double : un
   seul <path> de plus, et le nuage reste un seul objet à mettre à l'échelle. */
.site-nav__nuage-balayage {
  fill: none;
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 36%,
    #000 46%,
    #000 54%,
    transparent 64%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 36%,
    #000 46%,
    #000 54%,
    transparent 64%
  );
  -webkit-mask-size: 300% 100%;
  mask-size: 300% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  animation: nuage-balayage var(--balayage-cycle) linear infinite;
}

@keyframes nuage-balayage {
  from {
    -webkit-mask-position: 100% 0;
    mask-position: 100% 0;
  }
  to {
    -webkit-mask-position: 0% 0;
    mask-position: 0% 0;
  }
}

.site-nav__nuage:hover .site-nav__nuage-corps,
.site-nav__nuage:focus-visible .site-nav__nuage-corps {
  opacity: 1;
}

/* Ouvert : le nuage se remplit de magenta (à 30 %, maquette FCCT_2) — c'est
   tout ce qui distingue les deux états, la croix n'existe plus. Le balayage
   s'arrête : il invitait à ouvrir, le menu est ouvert. */
.site-nav--ouverte .site-nav__nuage-corps {
  fill: var(--c-ink);
  opacity: 0.3;
}

.site-nav--ouverte .site-nav__nuage-balayage {
  animation: none;
  opacity: 0;
}

/* Le panneau ouvert : toute la fenêtre aux couleurs de la barre, la barre
   elle-même restant posée dessus (d'où le z-index inférieur à celui de
   .site-nav__mobile). Les entrées commencent juste sous elle, à 72 px. */
.site-nav__panneau {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: flex;
  flex-direction: column;
  padding: 72px 10px 105px;
  background: var(--c-bar);
  overflow-y: auto;
  font-size: var(--fs-nav);
  line-height: 1.3;
}

/* Les entrées à 37 px sur un interligne de 56, centrées et pleines : seules,
   sur toute la fenêtre, elles n'ont plus à s'effacer devant la page. Leur
   rythme vient de l'interligne, pas d'un gap (maquette FCCT_2). */
.site-nav__liens {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.site-nav__liens a {
  font-size: 37px;
  line-height: 56px;
  opacity: 1;
  /* Entrée en cascade, une entrée après l'autre. L'animation repart à chaque
     ouverture : v-show remet le panneau de display: none à visible. */
  animation: lien-entree 0.35s ease backwards;
  animation-delay: calc(var(--i, 0) * 45ms);
}

/* Pas de soulignement, ni au survol ni sur l'entrée courante : six mots seuls
   sur l'écran se passent d'un repère de plus. Le focus clavier garde son
   liseré (main.css). */

/* Le panneau descend de sous la barre, les entrées le suivent une à une. */
.panneau-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.panneau-leave-active {
  transition: opacity 0.15s ease;
}

.panneau-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.panneau-leave-to {
  opacity: 0;
}

@keyframes lien-entree {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
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

/* Le menu s'ouvre et se ferme d'un coup : ni glissement, ni cascade, ni bascule
   du nuage — seules restent les couleurs, qui portent l'information. */
@media (prefers-reduced-motion: reduce) {
  .site-nav__nuage-corps {
    transition: none;
  }

  /* Sans balayage, la fenêtre laisserait un morceau de trait plus foncé au
     hasard : on montre le nuage entier en plein, comme .balayage fige son
     texte. */
  .site-nav__nuage-balayage {
    animation: none;
    -webkit-mask-image: none;
    mask-image: none;
  }

  .panneau-enter-active,
  .panneau-leave-active {
    transition: none;
  }

  .site-nav__liens a {
    animation: none;
  }
}
</style>

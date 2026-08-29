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
      <!-- Le tracé est celui exporté du design pour ce bouton (29.08.2026) :
           un petit nuage dessiné pour la barre, dans sa propre boîte de
           45 × 27, plus large et plus plat que celui de l'« Appel à projet »
           qui servait jusqu'ici. Fond et contour en deux tracés superposés
           comme dans l'export — le fond porte la lueur blanche interne, que le
           contour ne doit pas subir. Pas de ≡ à l'intérieur : la maquette n'en
           prévoit pas, un nuage posé là où presque tous les sites mettent leur
           menu se lisant sans icône. Ce qui dit « bouton », c'est le balayage :
           le même que sur les textes cliquables, une fenêtre de plein qui
           parcourt le trait en boucle. D'où un troisième tracé, découpé par
           la fenêtre. -->
      <button
        ref="nuage"
        class="site-nav__nuage"
        type="button"
        :aria-label="ouvert ? 'Fermer le menu' : 'Menu'"
        aria-controls="menu-nuage"
        :aria-expanded="ouvert"
        @click="basculer"
      >
        <svg viewBox="0 0 45 27" aria-hidden="true">
          <defs>
            <!-- Lueur blanche interne de l'export : l'alpha du nuage décalé
                 vers le bas puis flouté, ce qui laisse le haut du tracé
                 s'éclaircir. Reprise telle quelle du fichier d'export. -->
            <filter
              id="nuage-lueur"
              x="0"
              y="0"
              width="44.024"
              height="33.935"
              filterUnits="userSpaceOnUse"
              color-interpolation-filters="sRGB"
            >
              <feFlood flood-opacity="0" result="vide" />
              <feBlend in="SourceGraphic" in2="vide" result="forme" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="alpha"
              />
              <feOffset dy="7" />
              <feGaussianBlur stdDeviation="5" />
              <feComposite in2="alpha" operator="arithmetic" k2="-1" k3="1" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
              />
              <feBlend in2="forme" />
            </filter>
          </defs>
          <g class="site-nav__nuage-corps">
            <path
              class="site-nav__nuage-fond"
              :d="NUAGE_MENU"
              filter="url(#nuage-lueur)"
            />
            <path class="site-nav__nuage-contour" :d="NUAGE_MENU" />
          </g>
          <path class="site-nav__nuage-balayage" :d="NUAGE_MENU" />
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

// Le nuage du bouton de menu, tel qu'exporté du design : sa propre boîte de
// 45 × 27, plus large et plus plate que le nuage de l'« Appel à projet ». Le
// contour tombe à mi-course du tracé (stroke-width 2 dans une boîte de 45),
// d'où un dessin qui déborde de 1 unité de chaque côté : la boîte le prévoit.
const NUAGE_MENU =
  "M37.4556 25.8146C36.3936 25.8318 35.3316 25.8274 34.2696 25.8012L33.9156 25.7925C32.8536 25.7663 31.7916 25.7883 30.7296 25.8585L30.3756 25.8819C29.3136 25.9521 28.2516 25.9533 27.1896 25.8855L26.8356 25.8629C25.7736 25.7951 24.7116 25.7768 23.6496 25.8079L23.2956 25.8183C22.2336 25.8495 21.1716 25.8441 20.1096 25.8022L19.7556 25.7882C18.6936 25.7463 17.6316 25.7317 16.5696 25.7443L16.2156 25.7485C15.1536 25.7611 14.0916 25.7446 13.0296 25.6988L12.6756 25.6835C11.6136 25.6378 10.5516 25.6436 9.48959 25.7009L9.13559 25.72C8.07359 25.7774 7.00825 25.8106 5.93957 25.8197L5.58334 25.8227C4.51465 25.8319 3.5945 25.4935 2.82289 24.8078L2.56569 24.5792C1.79408 23.8934 1.34232 23.0284 1.21042 21.9842L1.16645 21.6361C1.03455 20.5919 0.981042 19.5382 1.00592 18.4751L1.01422 18.1208C1.0391 17.0577 1.20656 16.0129 1.5166 14.9864L1.61995 14.6443C1.92999 13.6178 2.51468 12.79 3.37402 12.1607L3.66047 11.9509C4.51981 11.3216 5.45359 10.8866 6.46182 10.6458L6.79789 10.5656C7.80612 10.3248 8.38315 9.78803 8.52899 8.95518L8.57761 8.67756C8.72345 7.84471 8.99562 6.94087 9.39413 5.96606L9.52697 5.64113C9.92548 4.66632 10.5088 3.83904 11.277 3.15931L11.5331 2.93273C12.3013 2.25299 13.176 1.74608 14.1571 1.41198L14.4841 1.30061C15.4652 0.96651 16.4695 0.910901 17.4972 1.13378L17.8397 1.20808C18.8674 1.43096 19.8085 1.86539 20.663 2.51138L20.9479 2.72671C21.8025 3.37269 22.4108 4.20744 22.7728 5.23094L22.8934 5.57211C23.2554 6.59562 23.9569 7.10827 24.9979 7.11009L25.3449 7.11069C26.3859 7.1125 27.3395 7.39993 28.2058 7.97296L28.4946 8.16398C29.3609 8.73702 30.123 9.43726 30.781 10.2647L31.0003 10.5405C31.6583 11.368 32.4668 11.6054 33.4257 11.2527L33.7453 11.1352C34.7043 10.7825 35.6967 10.6663 36.7228 10.7866L37.0648 10.8267C38.0908 10.947 39.047 11.2954 39.9333 11.8718L40.2288 12.0639C41.1151 12.6403 41.7707 13.4152 42.1954 14.3886L42.337 14.713C42.7618 15.6864 42.9858 16.7033 43.009 17.7637L43.0168 18.1171C43.04 19.1775 43.0069 20.2283 42.9175 21.2695L42.8877 21.6166C42.7983 22.6578 42.425 23.5677 41.7679 24.3463L41.5488 24.6058C40.8917 25.3844 40.389 25.7751 40.0409 25.7779L39.9248 25.7789C39.5767 25.7817 38.8716 25.7917 37.8096 25.8089L37.4556 25.8146Z";

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
   (FCCT_2). Le trait est donné en pixels d'écran : la boîte fait 45 unités
   pour 42 px affichés, c'est presque un pour un, mais non-scaling-stroke
   garantit les 2 px de l'export quelle que soit la taille rendue. */
.site-nav__nuage-contour,
.site-nav__nuage-balayage {
  fill: none;
  stroke: var(--c-ink);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

/* L'opacité de l'export est portée par le groupe ; le fond et le contour, eux,
   gardent leurs couleurs pleines. */
.site-nav__nuage-corps {
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.site-nav__nuage-fond {
  fill: var(--c-bar);
  transition: fill 0.3s ease;
}

/* La fenêtre du balayage : le même tracé, en plein, découpé par un masque qui
   le parcourt de gauche à droite. Mêmes proportions et même cycle que la
   fenêtre de lettres de .balayage (main.css) : c'est ce qui remplace le ≡ et
   range le nuage dans la catégorie des boutons.
   Le masque est posé sur le tracé et non sur un calque HTML en double : un
   seul <path> de plus, et le nuage reste un seul objet à mettre à l'échelle. */
.site-nav__nuage-balayage {
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

/* Ouvert : le nuage se remplit de magenta (à 40 %, comme l'export ouvert) —
   c'est tout ce qui distingue les deux états, la croix n'existe plus. Le
   balayage s'arrête : il invitait à ouvrir, le menu est ouvert. */
.site-nav--ouverte .site-nav__nuage-corps {
  opacity: 0.4;
}

.site-nav--ouverte .site-nav__nuage-fond {
  fill: var(--c-ink);
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
  .site-nav__nuage-corps,
  .site-nav__nuage-fond {
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

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
      <!-- Le nuage seul, sans le ≡ (Siméon, 27.08.2026) : « ce sont des icônes
           inventées au début d'internet, le nuage est positionné au même
           endroit que sur 99 % des autres sites, on peut faire confiance à nos
           utilisateurs » — et plein de marques prennent aujourd'hui leur logo
           comme menu. Ce qui dit qu'il se clique, ce n'est donc plus un
           pictogramme mais l'animation : le même balayage que les textes
           cliquables, plus la bande de surligneur au survol. Reste une croix,
           mais à l'ouverture seulement : elle ferme le panneau, elle ne
           présente pas le menu. -->
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
          <defs>
            <!-- Le balayage du texte, transposé au tracé. Le découpage aux
                 lettres (background-clip: text) n'a pas d'équivalent ici :
                 c'est un masque qui découpe. Et pour que le rendu suive
                 partout, le masque reste FIXE — le contour du nuage, en blanc
                 — et c'est le rectangle dessous qui bouge, un simple transform
                 composité par le GPU. Son dégradé reprend celui de .balayage :
                 pâle aux bords, plein dans une fenêtre de 8 %, sur trois fois
                 la largeur du nuage. -->
            <linearGradient :id="`fenetre-${uid}`" x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0.36"
                stop-color="var(--c-ink)"
                stop-opacity="0.5"
              />
              <stop offset="0.46" stop-color="var(--c-ink)" stop-opacity="1" />
              <stop offset="0.54" stop-color="var(--c-ink)" stop-opacity="1" />
              <stop
                offset="0.64"
                stop-color="var(--c-ink)"
                stop-opacity="0.5"
              />
            </linearGradient>
            <!-- Le trait est donné en pixels d'écran, il déborde donc du
                 tracé : le masque prend huit unités de marge pour ne pas le
                 rogner. -->
            <mask
              :id="`contour-${uid}`"
              maskUnits="userSpaceOnUse"
              x="-8"
              y="-8"
              width="444"
              height="273"
            >
              <path
                :d="NUAGE"
                fill="none"
                stroke="#fff"
                stroke-width="2"
                vector-effect="non-scaling-stroke"
              />
            </mask>
            <!-- Même montage pour le surligneur : masque fixe (le nuage plein),
                 rectangle mobile ancré à droite. -->
            <mask
              :id="`plein-${uid}`"
              maskUnits="userSpaceOnUse"
              x="-8"
              y="-8"
              width="444"
              height="273"
            >
              <path :d="NUAGE" fill="#fff" />
            </mask>
            <!-- L'ombre interne blanche du nuage « Appel à projet » : elle
                 creuse le nuage et lui donne du volume (Siméon, 27.08.2026).
                 Les valeurs sont retaillées pour l'échelle — 30 et 15 au lieu
                 des 10 et 5 du Figma. Le nuage y fait 490 px de large, ici 42 :
                 gardées telles quelles, les 10 unités de décalage tombent sous
                 le pixel et l'ombre disparaît, surtout sur le nuage rempli de
                 l'état ouvert. Au triple, elle rend à 42 px ce que le Figma
                 rend à 490 ; au-delà (40/20) elle voile la forme. -->
            <filter
              :id="`volume-${uid}`"
              x="-8"
              y="-8"
              width="444"
              height="303"
              filterUnits="userSpaceOnUse"
              color-interpolation-filters="sRGB"
            >
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="30" />
              <feGaussianBlur stdDeviation="15" />
              <feComposite
                in2="hardAlpha"
                operator="arithmetic"
                k2="-1"
                k3="1"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
              />
              <feBlend mode="normal" in2="SourceGraphic" />
            </filter>
          </defs>
          <!-- Fond et surligneur sous le même filtre : le volume se pose donc
               aussi sur le nuage rempli du survol, pas seulement sur le fond. -->
          <g :filter="`url(#volume-${uid})`">
            <path class="site-nav__nuage-fond" :d="NUAGE" />
            <g :mask="`url(#plein-${uid})`">
              <rect
                class="site-nav__surligneur"
                x="-8"
                y="-8"
                width="444"
                height="273"
              />
            </g>
          </g>
          <g :mask="`url(#contour-${uid})`">
            <rect
              class="site-nav__fenetre"
              x="-856"
              y="-8"
              width="1284"
              height="273"
              :fill="`url(#fenetre-${uid})`"
            />
          </g>
          <!-- Deux traits confondus au repos, écartés en croix à l'ouverture. -->
          <g class="site-nav__croix">
            <path class="site-nav__croix-trait" d="M138 181H290" />
            <path
              class="site-nav__croix-trait site-nav__croix-trait--contre"
              d="M138 181H290"
            />
          </g>
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
            @click="fermer"
            ><span>{{ e.label }}</span></a
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
// Les masques et le filtre du nuage sont référencés par id : il en faut un par
// instance, la nav pouvant être montée deux fois (aperçu du CMS).
const uid = useId();
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
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", mesurer);
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

/* Le fond du nuage : couleur de la barre au repos (le nuage est dessiné, plus
   rempli — FCCT_2), magenta à l'ouverture. L'ombre interne qui lui donne son
   volume est posée sur le groupe, pas ici — voir le filtre #volume dans le
   template. */
.site-nav__nuage-fond {
  fill: var(--c-bar);
  transition: fill 0.3s ease;
}

/* La bande de surligneur des textes cliquables, découpée au nuage : elle
   envahit depuis la droite au survol et au focus, et se retire quand on
   quitte. Le masque, lui, ne bouge pas — c'est le rectangle qui s'étire. */
.site-nav__surligneur {
  fill: var(--c-surligne);
  transform-box: view-box;
  /* Ancrée au bord droit du rectangle, à mi-hauteur. */
  transform-origin: 436px 128.5px;
  transform: scaleX(0);
  transition: transform 0.35s ease;
}

.site-nav__nuage:hover .site-nav__surligneur,
.site-nav__nuage:focus-visible .site-nav__surligneur {
  transform: scaleX(1);
}

/* La fenêtre pleine qui parcourt le contour, de la gauche vers la droite, en
   boucle — et sur le même cycle que les textes. Le rectangle fait trois fois
   la largeur du nuage et glisse d'une largeur de nuage de part et d'autre :
   la fenêtre attend donc hors champ le reste du cycle, comme le dégradé de
   .balayage attend hors du texte. */
.site-nav__fenetre {
  transform-box: view-box;
  animation: nav-balayage var(--balayage-cycle) linear infinite;
}

@keyframes nav-balayage {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(856px);
  }
}

/* Au survol, le contour passe en plein d'un coup : le balayage a fait son
   travail, la réponse au geste prend le relais. La couleur unie l'emporte sur
   le dégradé — une déclaration CSS bat un attribut de présentation. */
.site-nav__nuage:hover .site-nav__fenetre,
.site-nav__nuage:focus-visible .site-nav__fenetre {
  fill: var(--c-ink);
  animation: none;
  transform: none;
}

/* Ouvert : le nuage se remplit de magenta (à 30 %, maquette FCCT_2), le
   balayage s'arrête, et contour comme croix passent au rose pâle — en magenta
   ils se seraient fondus dans le remplissage. */
.site-nav--ouverte .site-nav__nuage-fond {
  fill: var(--c-ink);
  opacity: 0.3;
}

.site-nav--ouverte .site-nav__fenetre,
.site-nav--ouverte .site-nav__nuage:hover .site-nav__fenetre,
.site-nav--ouverte .site-nav__nuage:focus-visible .site-nav__fenetre {
  fill: var(--c-bar);
  animation: none;
  transform: none;
}

/* Le surligneur n'a plus rien à dire sur un nuage déjà rempli — et le curseur
   reste posé sur le nuage juste après le clic, d'où la règle de survol reprise
   ici : sans elle, elle l'emportait en spécificité et lavait le magenta. */
.site-nav--ouverte .site-nav__surligneur,
.site-nav--ouverte .site-nav__nuage:hover .site-nav__surligneur,
.site-nav--ouverte .site-nav__nuage:focus-visible .site-nav__surligneur {
  transform: scaleX(0);
}

/* La croix. Au repos les deux traits sont confondus sur la ligne médiane et
   réduits à rien ; à l'ouverture ils s'étirent et basculent à 45°, chacun dans
   son sens. Rien à translater : ils sont déjà au centre. */
.site-nav__croix-trait {
  fill: none;
  stroke: var(--c-bar);
  stroke-linecap: round;
  /* L'épaisseur en pixels d'écran doit être posée sur les tracés eux-mêmes :
     vector-effect ne s'hérite pas, et sur le groupe elle ne descendait pas —
     2 unités de la boîte de 428 faisaient alors 0,2 px, soit rien. */
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  transform-box: view-box;
  transform-origin: 214px 181px;
  transform: rotate(45deg) scaleX(0);
  opacity: 0;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.site-nav__croix-trait--contre {
  transform: rotate(-45deg) scaleX(0);
}

.site-nav--ouverte .site-nav__croix-trait {
  transform: rotate(45deg) scaleX(1);
  opacity: 1;
}

.site-nav--ouverte .site-nav__croix-trait--contre {
  transform: rotate(-45deg) scaleX(1);
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

/* Plus de soulignement sur l'entrée d'où l'on vient : « pour le menu on peut
   enlever le soulignement quand on clique, c'est pas nécessaire » (Siméon,
   27.08.2026) — le panneau se referme sur le clic, l'état n'a rien à marquer.
   Au survol et au focus, la réponse au geste reste celle du reste du site :
   la bande de surligneur qui envahit depuis la droite, pas un trait. En
   transition et non en animation — les entrées en ont déjà une, pour leur
   cascade d'ouverture, et elle repartirait à chaque fois qu'on les quitte. */
/* La bande se pose sur le mot, pas sur la ligne : le lien, lui, reste large
   de bord à bord — c'est la cible tactile. */
.site-nav__liens span {
  padding-inline: 0.08em;
  margin-inline: -0.08em;
  background-image: linear-gradient(var(--c-surligne), var(--c-surligne));
  background-repeat: no-repeat;
  background-position: right center;
  background-size: 0% 100%;
  transition: background-size 0.35s ease;
}

.site-nav__liens a:hover span,
.site-nav__liens a:focus-visible span {
  background-size: 100% 100%;
}

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
   du nuage — seules restent les couleurs, qui portent l'information. Le
   balayage s'arrête aussi : le contour reste plein, comme les textes
   cliquables au même réglage. */
@media (prefers-reduced-motion: reduce) {
  .site-nav__nuage-fond,
  .site-nav__surligneur,
  .site-nav__croix-trait {
    transition: none;
  }

  .site-nav__fenetre {
    fill: var(--c-ink);
    animation: none;
    transform: none;
  }

  .panneau-enter-active,
  .panneau-leave-active {
    transition: none;
  }

  .site-nav__liens a {
    animation: none;
  }

  .site-nav__liens span {
    transition: none;
  }
}
</style>

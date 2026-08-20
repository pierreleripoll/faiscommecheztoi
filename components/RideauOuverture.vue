<template>
  <div v-if="visible" class="rideau" aria-hidden="true">
    <div ref="panneau" class="rideau__panneau rideau__panneau--gauche">
      <span class="rideau__titre">Fais comme chez toi</span>
    </div>
    <div class="rideau__panneau rideau__panneau--droite">
      <span class="rideau__titre">Fais comme chez toi</span>
    </div>
  </div>
</template>

<script setup>
/* Rideau d'ouverture (« animation_ouverture » du Figma). Toute l'animation est
   en CSS, dans assets/css/rideau.css — elle démarre donc au premier peint,
   sans attendre l'hydratation, et se joue jusqu'au bout même sans JS.

   Ce composant ne s'occupe que de deux choses :
   1. noter que le rideau vient d'être joué, pour ne pas le rejouer avant 24 h ;
   2. retirer les panneaux du DOM une fois qu'ils sont sortis de l'écran.

   C'est le script inline du <head> (nuxt.config.ts) qui décide s'il se joue —
   il doit trancher avant le premier peint, donc bien avant l'hydratation.

   Le titre est répété dans les deux panneaux : chacun n'en montre que sa
   moitié (les panneaux rognent), et chaque moitié part ensuite avec son
   panneau. Le bloc est en aria-hidden : « Fais comme chez toi » est déjà
   annoncé par la nav, l'entendre trois fois n'apprendrait rien. */

const CLE = "fcct-rideau";

const visible = ref(true);
const panneau = ref(null);
let secours;

function termine() {
  clearTimeout(secours);
  visible.value = false;
}

onMounted(() => {
  /* Posée par le script inline du <head> quand le rideau ne doit pas se jouer
     (ancre, rechargement, moins de 24 h, animations réduites). Le CSS l'a déjà
     masqué avant le peint ; on se contente d'alléger le DOM. */
  if (document.documentElement.classList.contains("sans-rideau")) {
    visible.value = false;
    return;
  }

  try {
    /* Écrit seulement ici, c'est-à-dire seulement quand le rideau se joue pour
       de bon : la fenêtre de 24 h court depuis la dernière ouverture. La
       réécrire à chaque visite la repousserait indéfiniment, et un habitué du
       site ne reverrait jamais l'animation. */
    localStorage.setItem(CLE, String(Date.now()));
  } catch {
    /* Stockage refusé (navigation privée stricte) : tant pis, le rideau se
       rejouera au prochain chargement. Ce n'est pas une raison de ne pas le
       jouer maintenant. */
  }

  /* On suit la fin de l'animation plutôt qu'un minuteur calé à la main sur les
     durées du CSS — les deux ne peuvent pas se désynchroniser. Le minuteur ne
     reste que comme garde-fou si l'animation ne se joue jamais (onglet en
     arrière-plan au chargement, par exemple). */
  panneau.value?.addEventListener("animationend", termine, { once: true });
  secours = setTimeout(termine, 4000);
});

onBeforeUnmount(() => clearTimeout(secours));
</script>

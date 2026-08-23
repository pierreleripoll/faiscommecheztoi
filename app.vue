<template>
  <div>
    <!-- .scene grandit de 0.95 à 1 pendant l'ouverture du rideau ; le rideau
         lui reste dehors, un ancêtre transformé le décrocherait de la fenêtre. -->
    <div id="top" class="scene">
      <!-- Lien d'évitement : invisible à la souris, il n'apparaît qu'au focus
           clavier, posé sur une plaque claire par-dessus la nav. -->
      <a class="evitement" href="#contenu">Aller au contenu</a>
      <SiteNav />
      <NuxtPage />
      <PiedDePage />
    </div>
    <RideauOuverture />
  </div>
</template>

<script setup>
useHead({
  meta: [
    {
      name: "description",
      content:
        "Fais comme chez toi — Rencontres des artistes émergent·es valaisan·nes. Du 7 au 10 octobre 2026 au Spot à Sion : théâtre, danse, cirque et performance. Entrée libre.",
    },
    { property: "og:title", content: "Fais comme chez toi" },
    {
      property: "og:description",
      content:
        "Du 7 au 10 octobre 2026, au Spot à Sion, 4 jours de festival pour les artistes émergent·es valaisan·nes.",
    },
  ],
});
</script>

<style scoped>
.evitement {
  position: absolute;
  top: 12px;
  left: var(--pad-x);
  /* Au-dessus de la nav sticky (20). */
  z-index: 22;
  padding: 8px 14px;
  background: var(--c-card-bg);
  color: var(--c-ink);
  font-size: var(--fs-nav);
  line-height: 1.3;
  white-space: nowrap;
  box-shadow: var(--glow-card);
  /* Hors écran tant qu'il n'a pas le focus — pas de display: none, qui le
     retirerait aussi de l'ordre de tabulation. */
  transform: translateY(-200%);
}

.evitement:focus-visible {
  transform: none;
}
</style>

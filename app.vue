<template>
  <div id="top">
    <SiteNav />
    <NuxtPage />
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

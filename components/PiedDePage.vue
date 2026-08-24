<template>
  <!-- La page s'arrêtait sur la rangée de logos, sans point final. Le pied
       reprend la barre de nav, lueur vers le haut cette fois : la page se
       referme comme elle s'ouvre. -->
  <footer id="pied" class="pied">
    <p class="pied__marque">Fais comme chez toi</p>
    <p v-if="pied?.ligne" class="pied__ligne">{{ pied.ligne }}</p>
    <a class="pied__remonter" href="#top">Remonter</a>
  </footer>
</template>

<script setup>
const pied = await useContenu("pied", () => queryContent("/pied").findOne());
</script>

<style scoped>
.pied {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 25px var(--pad-x);
  background: var(--c-bar);
  box-shadow: var(--glow-pied);
  text-align: center;
  font-size: var(--fs-legend);
  line-height: 1.3;
}

.pied p {
  margin: 0;
}

/* La marque comme dans la barre : 20 px, capitales, à 50 %. */
.pied__marque {
  font-size: var(--fs-nav);
  text-transform: uppercase;
  opacity: 0.5;
}

.pied__remonter {
  margin-top: 10px;
}
</style>

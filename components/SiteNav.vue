<template>
  <nav class="site-nav">
    <div class="site-nav__inner">
      <a class="site-nav__brand" href="#top">Fais comme chez toi</a>
      <a href="#artistes">Artistes</a>
      <a href="#grille">Grille</a>
      <a href="#infos">Infos</a>
      <a href="#partenariats">Partenariats</a>
      <a href="#participer">Participer</a>
      <a href="#contact">Contact &amp; Team</a>
    </div>
  </nav>
</template>

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
  /* Sur mobile la maquette laisse la nav déborder sur une seule ligne :
     on la rend défilable horizontalement plutôt que de la faire passer à la ligne. */
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}

.site-nav__inner::-webkit-scrollbar {
  display: none;
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

@media (max-width: 720px) {
  /* Centrer une ligne plus large que l'écran en couperait le début. */
  .site-nav__inner {
    justify-content: flex-start;
  }
}
</style>

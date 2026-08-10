<template>
  <nav class="site-nav">
    <div class="site-nav__inner">
      <a class="site-nav__brand" href="#top">Fais comme chez toi</a>
      <a href="#artistes">Artistes</a>
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
}

.site-nav__inner {
  display: flex;
  gap: 1.4em;
  align-items: center;
  justify-content: center;
  padding: 0.55rem var(--pad-x);
  font-size: clamp(0.85rem, 0.7rem + 0.6vw, 1.05rem);
  font-weight: 700;
  /* Sur mobile la nav reste sur une ligne et défile horizontalement,
     comme sur la maquette. */
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}

.site-nav__inner::-webkit-scrollbar {
  display: none;
}

@media (max-width: 720px) {
  /* Centré + overflow coupe le début de la ligne : sur mobile on aligne à
     gauche et la nav défile horizontalement. */
  .site-nav__inner {
    justify-content: flex-start;
  }
}

.site-nav a {
  text-decoration: none;
  color: var(--c-ink);
}

.site-nav a:hover {
  text-decoration: underline;
}

.site-nav__brand {
  text-transform: uppercase;
}
</style>

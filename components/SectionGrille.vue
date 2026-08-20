<template>
  <section v-if="grille.length" id="grille" class="section">
    <h2 class="section__title">Grille horaire</h2>

    <div class="grille">
      <div v-for="soiree in grille" :key="soiree.key" class="grille__jour">
        <h3 class="grille__jour-titre">
          <span>{{ soiree.jour }}</span>
          <span>{{ soiree.date }}</span>
        </h3>

        <article
          v-for="creneau in soiree.creneaux"
          :key="`${creneau.path}-${creneau.heure}`"
          class="creneau"
        >
          <p class="creneau__heure">{{ creneau.heure }}</p>
          <p class="creneau__titre">{{ creneau.titre }}</p>
          <p class="creneau__artiste">{{ creneau.name }}</p>
          <p v-if="meta(creneau)" class="creneau__meta">
            {{ meta(creneau) }}
            <template v-if="creneau.lieu"
              ><br />{{ creneau.lieu }}</template
            >
          </p>
        </article>
      </div>
    </div>

    <p class="grille__note">
      Entrée libre, sans réservation en amont. Pour le Petithéâtre uniquement,
      les places sont à réserver le soir de la représentation au stand
      information sur la place des théâtres.
    </p>
  </section>
</template>

<script setup>
const props = defineProps({
  // Les fiches déjà chargées par la page : pas de second queryContent, qui
  // reclasserait 10 entre 1 et 2 sans le $numeric du premier.
  artistes: { type: Array, default: () => [] },
  annee: { type: String, default: "" },
});

const grille = useGrille(
  () => props.artistes,
  () => props.annee
);

// Durée et format sur la même ligne ; l'un ou l'autre peut manquer.
function meta(creneau) {
  return [creneau.duration, creneau.format].filter(Boolean).join(" · ");
}
</script>

<style scoped>
.grille {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  /* 21 px : la gouttière entre deux cartes artistes dans le Figma. */
  gap: 21px;
}

.grille__jour {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.grille__jour-titre {
  display: flex;
  flex-direction: column;
  font-size: var(--fs-body);
  text-transform: uppercase;
  color: var(--c-ink);
}

/* Plaque de créneau : même fond et même lueur que la carte artiste, mais pas
   son rayon — le coin arrondi de 10.65 px appartient à la carte seule. */
.creneau {
  background: var(--c-card-bg);
  padding: 12.4px;
  box-shadow: var(--glow-card);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* L'espacement vient du gap : les p ne portent pas leur marge de main.css. */
.creneau p {
  margin: 0;
}

.creneau__heure {
  font-size: var(--fs-body);
}

.creneau__titre {
  font-size: var(--fs-card);
}

/* Vevey n'a qu'une graisse : la hiérarchie passe par la taille et l'opacité. */
.creneau__artiste {
  font-size: calc(var(--fs-card) * 0.8);
}

.creneau__meta {
  font-size: var(--fs-legend);
  opacity: 0.5;
}

.grille__note {
  font-size: var(--fs-legend);
  opacity: 0.5;
  margin-top: 25px;
}

/* Quatre colonnes ne tiennent pas sous 1024 px. */
@media (max-width: 1023px) {
  .grille {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .grille {
    grid-template-columns: 1fr;
    /* Les soirées s'empilent : il leur faut plus d'air pour rester distinctes. */
    gap: 50px;
  }
}
</style>

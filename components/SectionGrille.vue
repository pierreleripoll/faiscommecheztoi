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
          :class="{ 'creneau--ouvert': ouvert === cle(soiree, creneau) }"
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

          <!-- La fiche repliée dans la plaque : portrait puis présentation.
               Toujours dans le DOM, jamais en v-if — le prérendu ne fabrique
               les dérivées d'image que pour les URL présentes dans le HTML
               généré (voir le même arbitrage dans SectionArtistes). -->
          <div class="creneau__fiche">
            <div class="creneau__fiche-cadre">
              <ThumbhashImage
                v-if="creneau.photo"
                :image="creneau.photo"
                class="creneau__photo"
                sizes="90vw sm:45vw lg:280px"
              />
              <!-- Les mêmes lignes que le verso de la carte artiste, moins ce
                   que la plaque affiche déjà (heure, titre, durée · format,
                   lieu) : collaboration, autre festival, présentation, puis
                   distribution, école et crédit photo. -->
              <div class="creneau__bio">
                <p v-if="creneau.fiche.collaboration">
                  {{ creneau.fiche.collaboration }}
                </p>
                <p v-if="ailleurs(creneau)">{{ ailleurs(creneau) }}</p>
                <div class="creneau__bio-corps">
                  <ContentRenderer :value="creneau.fiche" />
                </div>
                <p v-if="creneau.fiche.with">Avec {{ creneau.fiche.with }}</p>
                <p v-if="creneau.fiche.school">{{ creneau.fiche.school }}</p>
                <p v-if="creneau.photo?.credit">
                  Photo {{ creneau.photo.credit }}
                </p>
              </div>
            </div>
          </div>

          <!-- Le bouton couvre toute la plaque, comme la bascule de la carte
               artiste : c'est le créneau entier qui se déplie et se replie. -->
          <button
            class="creneau__lien"
            type="button"
            :aria-expanded="ouvert === cle(soiree, creneau)"
            :aria-label="`Voir la fiche de ${creneau.name}`"
            @click="basculer(soiree, creneau)"
          />

          <!-- Même croix que le nuage et le verso de la carte : elle signale
               que la plaque se referme. Décorative — c'est le bouton-calque
               qui reçoit le clic. -->
          <svg
            class="creneau__croix"
            viewBox="0 0 29.25 29.25"
            aria-hidden="true"
          >
            <path
              d="M1.875 27.375L27.375 1.875"
              stroke="currentColor"
              stroke-width="3.75"
              stroke-linecap="round"
            />
            <path
              d="M27.375 27.375L1.875 1.875"
              stroke="currentColor"
              stroke-width="3.75"
              stroke-linecap="round"
            />
          </svg>
        </article>
      </div>
    </div>

    <p class="grille__note">
      Entrée libre, sans réservation en amont. Pour le Petithéâtre uniquement,
      les places sont à réserver le soir de la représentation à l'entrée du
      théâtre.
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

// Cliquer un créneau déplie sa fiche sur place — portrait et présentation —
// plutôt que de renvoyer vers les cartes de la section Artistes (retour de
// Benjamin, 21.08.2026). Un seul créneau ouvert à la fois : la grille reste
// lisible, et cliquer ailleurs déplace la lecture au lieu de l'empiler.
const ouvert = ref(null);

// La clé porte la soirée : un même spectacle joué deux soirs à la même heure
// donne deux créneaux, qui ne doivent pas s'ouvrir ensemble.
function cle(soiree, creneau) {
  return `${soiree.key}-${creneau.path}-${creneau.heure}`;
}

function basculer(soiree, creneau) {
  const k = cle(soiree, creneau);
  ouvert.value = ouvert.value === k ? null : k;
}

// Représentation dans un autre festival, sur une ligne à barres — même
// écriture que le verso de la carte artiste. Les dates de l'édition, elles,
// ne sont pas reprises : la grille les affiche déjà.
function ailleurs(creneau) {
  const a = creneau.fiche?.also;
  if (!a) return "";
  return [a.festival, a.venue, ...(a.dates || [])].filter(Boolean).join(" | ");
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
  /* Ancre du bouton-calque qui couvre la plaque. */
  position: relative;
  background: var(--c-card-bg);
  padding: 12.4px;
  box-shadow: var(--glow-card);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.creneau__lien {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
}

/* Fiche dépliée -------------------------------------------------------------
   La plaque s'allonge vers le bas dans sa colonne, poussant les créneaux
   suivants. grid-template-rows 0fr → 1fr : la seule manière d'animer vers une
   hauteur inconnue sans la mesurer en JS. */
.creneau__fiche {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s ease;
  /* Repliée, la rangée est vide mais compte quand même pour le gap de la
     plaque : on l'annule pour que la plaque fermée reste au pixel près. */
  margin-top: -6px;
}

.creneau--ouvert .creneau__fiche {
  grid-template-rows: 1fr;
}

.creneau__fiche-cadre {
  min-height: 0;
  overflow: hidden;
}

/* L'air au-dessus du contenu vient d'une marge interne au cadre masqué, pas
   d'un padding — un padding empêcherait la rangée de retomber à zéro. */
.creneau__fiche-cadre > :first-child {
  margin-top: 12.4px;
}

/* Portrait « pas trop grand » : une bande recadrée, pas la photo entière. */
.creneau__photo {
  height: 180px;
}

.creneau__photo :deep(.thumbhash-image__img) {
  object-fit: cover;
}

.creneau__photo :deep(.thumbhash-image__placeholder) {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  background-size: cover;
}

.creneau__bio {
  margin-top: 12.4px;
  font-size: var(--fs-legend);
  line-height: 1.25;
}

/* Les lignes d'info s'empilent serrées (le margin: 0 de .creneau p les
   couvre) ; seule la présentation respire, une ligne vide de part et d'autre
   — le rythme du verso de la carte. */
.creneau__bio-corps {
  margin: 1em 0;
}

.creneau__bio > :last-child {
  margin-bottom: 0;
}

.creneau__croix {
  position: absolute;
  top: 12.4px;
  right: 12.4px;
  width: 12px;
  height: 12px;
  color: var(--c-ink);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.creneau--ouvert .creneau__croix {
  opacity: 1;
}

/* Au survol (ou au focus clavier du bouton-calque) la plaque se soulève et sa
   lueur s'élargit : elle se donne pour cliquable. Transition ponctuelle, pas
   d'animation en continu — Siméon garde une idée en réserve pour la grille. */
.creneau {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.creneau:hover,
.creneau:focus-within {
  transform: translateY(-3px);
  box-shadow: var(--glow-invite);
}

@media (prefers-reduced-motion: reduce) {
  .creneau {
    transition: none;
  }

  .creneau:hover,
  .creneau:focus-within {
    transform: none;
  }

  /* La fiche s'ouvre d'un coup, sans glissement. */
  .creneau__fiche {
    transition: none;
  }
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

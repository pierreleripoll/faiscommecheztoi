/* Pont entre la grille horaire et la section Artistes : cliquer un créneau
   doit mener à la fiche de l'artiste, mais la grille et les cartes vivent dans
   deux composants frères. Même idiome que le nuage « Appel à projet » : un
   useState partagé, que la grille écrit et que la section Artistes consomme
   (elle le remet à null une fois la fiche montrée). */

/** @returns {import('vue').Ref<null | { path: string, annee: string }>} */
export function useArtisteCible() {
  return useState("artiste-cible", () => null);
}

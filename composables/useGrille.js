/* La grille horaire n'a pas de source de contenu propre : elle se dérive des
   fiches artistes (`content/programme/*.md`), qui portent déjà `dates`,
   `duration`, `format` et `venue`. Benjamin continue d'éditer les fiches dans
   le CMS et la grille suit — il n'y a jamais deux versions des horaires. */

// Format des dates 2026 dans le frontmatter : « Me 07.10, 19:00 ».
// Les éditions 2021-2025 utilisent une autre écriture (« Mer. 2 oct. - 19h ») :
// elles ne matchent pas, et c'est voulu — seule l'édition en cours a une grille.
const FORMAT_DATE = /^(\w{2})\s+(\d{2})\.(\d{2}),\s*(\d{2}:\d{2})$/;

const JOURS = {
  Lu: "Lundi",
  Ma: "Mardi",
  Me: "Mercredi",
  Je: "Jeudi",
  Ve: "Vendredi",
  Sa: "Samedi",
  Di: "Dimanche",
};

// « Sion, Petithéâtre » → « Petithéâtre ». La ville est constante sur toute
// l'édition, elle est déjà donnée dans Infos pratiques.
function lieu(venue) {
  if (!venue) return "";
  return venue.split(",").pop().trim();
}

/**
 * Éclate les fiches d'une année en colonnes par soirée.
 * Une fiche jouée deux soirs produit deux créneaux — c'est le principe.
 *
 * @returns {Array<{key: string, jour: string, date: string, creneaux: Array}>}
 */
export function construireGrille(artistes, annee) {
  if (!annee) return [];

  const soirees = new Map();

  for (const fiche of artistes || []) {
    // Le frontmatter écrit l'année en chaîne ('2026') : comparer en chaîne.
    if (String(fiche?.year) !== String(annee)) continue;

    for (const brut of fiche.dates || []) {
      const trouve = FORMAT_DATE.exec(String(brut).trim());
      if (!trouve) {
        // Une date mal formée ne doit ni casser le rendu ni s'afficher telle
        // quelle : on la signale au développeur et on passe.
        console.warn(
          `[grille] date illisible « ${brut} » dans ${fiche._path} — créneau ignoré`
        );
        continue;
      }

      const [, abrege, jourDuMois, mois, heure] = trouve;
      // Clé de tri en MM-DD : fiable sans avoir à inventer une année.
      const key = `${mois}-${jourDuMois}`;

      if (!soirees.has(key)) {
        soirees.set(key, {
          key,
          jour: JOURS[abrege] || abrege,
          date: `${jourDuMois}.${mois}`,
          creneaux: [],
        });
      }

      soirees.get(key).creneaux.push({
        heure,
        titre: fiche.title || "",
        name: fiche.name || "",
        duration: fiche.duration || "",
        format: fiche.format || "",
        lieu: lieu(fiche.venue),
        path: fiche._path,
      });
    }
  }

  return [...soirees.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    // En 24 h, comparer « HH:MM » comme des chaînes suffit.
    .map((soiree) => ({
      ...soiree,
      creneaux: soiree.creneaux.sort((a, b) => a.heure.localeCompare(b.heure)),
    }));
}

/** Version réactive : accepte des refs, des getters ou des valeurs brutes. */
export function useGrille(artistes, annee) {
  return computed(() => construireGrille(toValue(artistes), toValue(annee)));
}

/* La grille horaire n'a pas de source de contenu propre : elle se dérive des
   fiches artistes (`content/programme/*.md`), qui portent déjà `dates`,
   `duration`, `format` et `venue`. Benjamin continue d'éditer les fiches dans
   le CMS et la grille suit — il n'y a jamais deux versions des horaires. */

// Format des dates 2026 dans le frontmatter : « Me 07.10, 19:00 ».
// Les éditions 2021-2025 utilisent une autre écriture (« Mer. 2 oct. - 19h ») :
// elles ne matchent pas, et c'est voulu — seule l'édition en cours a une grille.
// Exporté pour scripts/generateAgendaIcs.mjs, qui écarte les fiches des
// anciennes éditions sans déclencher l'avertissement ci-dessous.
export const FORMAT_DATE = /^(\w{2})\s+(\d{2})\.(\d{2}),\s*(\d{2}:\d{2})$/;

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
        // Le créneau déplié montre le premier portrait et la présentation ;
        // ContentRenderer veut le document entier, on garde donc la fiche.
        photo: (fiche.photos || [])[0] || null,
        fiche,
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

/* Agenda ---------------------------------------------------------------------
   Chaque créneau déplié propose un fichier .ics à un seul VEVENT. Ce sont de
   vrais fichiers statiques dans public/agenda/, générés au build par
   scripts/generateAgendaIcs.mjs : un lien data: ne marche pas sur iPhone
   (Safari iOS ignore les téléchargements data:), alors qu'un vrai .ics servi
   en text/calendar s'ouvre directement dans l'aperçu « Ajouter à Calendrier ».
   Le composant ne fabrique donc que l'URL (lienAgenda) ; le contenu
   (contenuIcs) n'est appelé que par le script de build. */

// RFC 5545 : virgules, points-virgules et barres obliques inverses s'échappent
// dans les valeurs texte, les sauts de ligne deviennent « \n ».
function echapper(texte) {
  return String(texte)
    .replace(/\\/g, "\\\\")
    .replace(/([,;])/g, "\\$1")
    .replace(/\r?\n/g, "\\n");
}

// « 55’ » → 55. Sans durée lisible, une heure : mieux vaut un créneau trop
// long qu'un événement sans fin.
function minutes(duration) {
  const n = parseInt(String(duration || "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 60;
}

function deuxChiffres(n) {
  return String(n).padStart(2, "0");
}

function horodatage(annee, mois, jour, heures, mins) {
  return `${annee}${deuxChiffres(mois)}${deuxChiffres(jour)}T${deuxChiffres(heures)}${deuxChiffres(mins)}00`;
}

// Début et fin du créneau en « horodatage » local (heure du festival) —
// partagés entre le .ics et le lien Google Agenda, qui écrivent la même
// période dans deux syntaxes.
function bornes(soiree, creneau, annee) {
  const [mois, jour] = soiree.key.split("-").map(Number);
  const [heures, mins] = creneau.heure.split(":").map(Number);
  const debut = new Date(Date.UTC(annee, mois - 1, jour, heures, mins));
  const fin = new Date(debut.getTime() + minutes(creneau.duration) * 60000);
  return {
    date: { annee, mois, jour },
    debut: horodatage(annee, mois, jour, heures, mins),
    fin: horodatage(
      fin.getUTCFullYear(),
      fin.getUTCMonth() + 1,
      fin.getUTCDate(),
      fin.getUTCHours(),
      fin.getUTCMinutes()
    ),
  };
}

function titreEvenement(creneau) {
  return [creneau.titre, creneau.name].filter(Boolean).join(" — ");
}

function lieuEvenement(creneau) {
  return [creneau.lieu, "Le Spot", "Sion"].filter(Boolean).join(", ");
}

/**
 * Le contenu .ics d'un créneau d'une soirée.
 * `soiree.key` est la clé MM-DD construite plus haut ; l'année vient de la
 * page. Tout est déterministe — même contenu à chaque build, donc pas de
 * Date.now() pour le DTSTAMP : les agendas mettent à jour l'événement (UID
 * stable) au lieu de le dupliquer.
 */
export function contenuIcs(soiree, creneau, annee) {
  if (!annee || !soiree?.key || !creneau?.heure) return "";

  const { date, debut, fin } = bornes(soiree, creneau, annee);
  const uid = `${soiree.key}-${creneau.heure}-${creneau.path}`.replace(
    /[^\w.-]+/g,
    "-"
  );

  // Heure locale du festival, pas UTC : l'agenda du visiteur la convertira.
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//faiscommecheztoi.ch//grille//FR",
    "BEGIN:VEVENT",
    `UID:${uid}@faiscommecheztoi.ch`,
    `DTSTAMP:${horodatage(date.annee, date.mois, date.jour, 0, 0)}Z`,
    `DTSTART;TZID=Europe/Zurich:${debut}`,
    `DTEND;TZID=Europe/Zurich:${fin}`,
    `SUMMARY:${echapper(titreEvenement(creneau))}`,
    `LOCATION:${echapper(lieuEvenement(creneau))}`,
    "URL:https://faiscommecheztoi.ch/#grille",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // RFC 5545 : lignes terminées par CRLF, y compris la dernière.
  return lignes.join("\r\n") + "\r\n";
}

/** Nom du fichier : « 2026-10-07-1900-sous-les-jupes.ics ». Date et heure en
    tête — deux représentations du même spectacle font deux fichiers. */
export function nomFichierAgenda(soiree, creneau, annee) {
  const base = (creneau?.titre || creneau?.name || "spectacle")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const heure = String(creneau?.heure || "").replace(":", "");
  return `${annee}-${soiree?.key}-${heure}-${base || "spectacle"}.ics`;
}

/** L'URL du .ics d'un créneau — le fichier lui-même est généré au build. */
export function lienAgenda(soiree, creneau, annee) {
  if (!annee || !soiree?.key || !creneau?.heure) return "";
  return `/agenda/${nomFichierAgenda(soiree, creneau, annee)}`;
}

/**
 * Le même créneau en lien « modèle » Google Agenda : sur Android, le .ics
 * téléchargé demande encore d'ouvrir le fichier, alors que ce lien ouvre
 * l'app Google Agenda directement sur l'événement pré-rempli — il ne reste
 * qu'à l'enregistrer. Servi seulement après détection d'Android côté client
 * (voir SectionGrille) ; partout ailleurs le .ics fait mieux.
 */
export function lienGoogleAgenda(soiree, creneau, annee) {
  if (!annee || !soiree?.key || !creneau?.heure) return "";

  const { debut, fin } = bornes(soiree, creneau, annee);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titreEvenement(creneau),
    // Horodatages sans « Z » + ctz : Google les lit en heure du festival.
    dates: `${debut}/${fin}`,
    ctz: "Europe/Zurich",
    location: lieuEvenement(creneau),
    details: "https://faiscommecheztoi.ch/#grille",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Version réactive : accepte des refs, des getters ou des valeurs brutes. */
export function useGrille(artistes, annee) {
  return computed(() => construireGrille(toValue(artistes), toValue(annee)));
}

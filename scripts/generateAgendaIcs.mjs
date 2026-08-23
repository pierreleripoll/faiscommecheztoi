// Génère dans public/agenda/ les fichiers .ics des créneaux de la grille,
// dérivés des fiches content/programme/*.md comme la grille elle-même.
// Pourquoi de vrais fichiers : un lien data:text/calendar ne fait rien sur
// iPhone (Safari iOS ignore les téléchargements data:), alors qu'un .ics
// servi en text/calendar s'ouvre directement dans l'aperçu « Ajouter à
// Calendrier ». Le dossier est régénéré entier à chaque exécution et n'est
// pas versionné — lancé par `npm run dev` et `npm run generate`.
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import {
  FORMAT_DATE,
  construireGrille,
  contenuIcs,
  nomFichierAgenda,
} from "../composables/useGrille.js";

const programmeDir = path.resolve("content/programme");
const sortieDir = path.resolve("public/agenda");

const fiches = [];
for (const nom of (await fs.readdir(programmeDir)).sort()) {
  if (!nom.endsWith(".md")) continue;
  const { data } = matter(
    await fs.readFile(path.join(programmeDir, nom), "utf8")
  );
  // Seules les fiches au format de date de l'édition courante produisent des
  // créneaux ; on écarte les autres ici pour ne pas remplir le journal
  // d'avertissements sur les éditions passées.
  if (!(data.dates || []).some((d) => FORMAT_DATE.test(String(d).trim())))
    continue;
  // construireGrille lit fiche._path (repris dans l'UID du VEVENT) : le nom
  // de fichier, fixé à la création, le rend stable d'un build à l'autre.
  fiches.push({ ...data, _path: `/programme/${nom.replace(/\.md$/, "")}` });
}

await fs.rm(sortieDir, { recursive: true, force: true });
await fs.mkdir(sortieDir, { recursive: true });

let total = 0;
for (const annee of [...new Set(fiches.map((f) => String(f.year)))].sort()) {
  for (const soiree of construireGrille(fiches, annee)) {
    for (const creneau of soiree.creneaux) {
      await fs.writeFile(
        path.join(sortieDir, nomFichierAgenda(soiree, creneau, annee)),
        contenuIcs(soiree, creneau, annee),
        "utf8"
      );
      total++;
    }
  }
}

console.log(`Agenda: ${total} fichiers .ics dans public/agenda/.`);

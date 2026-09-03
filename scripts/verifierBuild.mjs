// Contrôle du site généré, juste avant le déploiement.
//
// Pourquoi : le 01.09.2026 un build est parti en ligne sans aucune fiche
// artiste. La requête sur content/programme/ avait rendu une liste vide, et
// rien n'a échoué — chaque section se protège par un `v-if` ou un `|| []`,
// donc une liste vide donne une page valide, juste amputée. La grille horaire
// avait disparu et les cartes aussi (invisibles tant qu'aucune année n'est
// choisie, personne ne les a vues manquer). Le build a réussi, le rsync a
// poussé la page tronquée en production. Reconstruire au commit suivant a
// suffi à tout ramener : la panne est intermittente, pas dans le contenu.
//
// D'où ce contrôle : on recalcule la grille depuis content/, comme le site le
// fait, et on compte les créneaux réellement présents dans la page produite.
// Un écart arrête `npm run generate`, donc le déploiement, et le site en ligne
// reste dans son état précédent. C'est important ici : chaque enregistrement
// du CMS déclenche un déploiement, sans personne pour relire la page.
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { construireGrille } from "../composables/useGrille.js";

const page = path.resolve(".output/public/index.html");

async function frontmatters(dossier) {
  const dir = path.resolve("content", dossier);
  const fiches = [];
  for (const nom of (await fs.readdir(dir)).sort()) {
    if (!nom.endsWith(".md")) continue;
    const { data } = matter(await fs.readFile(path.join(dir, nom), "utf8"));
    fiches.push({ ...data, _path: `/${dossier}/${nom.replace(/\.md$/, "")}` });
  }
  return fiches;
}

// L'édition en cours, choisie comme dans pages/index.vue : les éditions triées
// par année décroissante, la première l'emporte. Pas d'année en dur.
const editions = (await frontmatters("artistes")).sort((a, b) =>
  String(b.year).localeCompare(String(a.year))
);
const annee = editions[0]?.year || "";
const soirees = construireGrille(await frontmatters("programme"), annee);
const attendus = soirees.reduce((n, s) => n + s.creneaux.length, 0);

// Une seule occurrence par créneau : la forme entre guillemets ne se confond
// pas avec la règle de style, écrite `.creneau__heure[data-v-…]`.
const html = await fs.readFile(page, "utf8");
const trouves = html.split('class="creneau__heure"').length - 1;

if (attendus === 0) {
  // Cas normal entre deux éditions : les horaires ne sont pas encore saisis,
  // la grille ne s'affiche pas et il n'y a rien à vérifier.
  console.log(
    `Contrôle du build : aucun créneau au format de l'édition ${annee} dans content/programme/, grille attendue vide.`
  );
} else if (trouves !== attendus) {
  console.error(
    [
      "",
      "Le site généré ne contient pas la grille horaire attendue.",
      `  édition ${annee} : ${attendus} créneaux dans content/programme/, ${trouves} dans la page.`,
      `  ${soirees.map((s) => `${s.jour} ${s.date} (${s.creneaux.length})`).join(", ")}`,
      "",
      "Zéro créneau trouvé veut dire que les fiches artistes manquent dans la",
      "page : la grille et les cartes ont disparu ensemble. C'est arrivé une",
      "fois sans cause dans le contenu — relancer le build suffit en général.",
      "Si ça revient à chaque essai, c'est que le contenu a changé.",
      "",
    ].join("\n")
  );
  process.exit(1);
} else {
  console.log(
    `Contrôle du build : ${trouves} créneaux dans la grille de l'édition ${annee}, comme dans le contenu.`
  );
}

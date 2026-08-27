// Apostrophes et primes.
//
// Dans Vevey, l'apostrophe droite U+0027 est dessinée comme un
// prime — le bâton droit du signe des minutes —, alors que l'apostrophe courbe
// U+2019 est la vraie apostrophe. Le contenu, lui, mélange tout depuis
// toujours : les fiches arrivent par tableur, par copier-coller ou par
// l'admin, selon le clavier de chacun. Plutôt que de repasser sur les
// 87 fichiers de content/ (et de recommencer à chaque saisie), on remet
// chaque signe à sa place au rendu — voir server/plugins/apostrophes.ts pour
// le build, apercu/plugin.client.js pour l'aperçu en direct.
//
// Deux règles, dans les deux sens :
//
// 1. ÉLISION — entre deux lettres, la droite devient courbe (« l'entrée » →
//    « l’entrée »). Seulement entre deux lettres : le `year: '2021'` du
//    frontmatter YAML et les guillemets d'un fragment de code sont épargnés.
//
// 2. MINUTES — après un chiffre, la courbe redevient droite (« 40’ » →
//    « 40' »). Les douze
//    fiches 2026 écrivent toutes leur `duration` avec la courbe, et Vevey la
//    dessine comme une apostrophe là où il faut un prime. On ne passe pas par
//    le vrai prime U+2032 : Vevey ne le possède pas (vérifié dans son cmap),
//    il tomberait sur une fonte de repli.
//
// L'ordre compte peu — les deux motifs ne se recouvrent pas — mais l'élision
// d'abord, c'est la règle la plus courante.
const ELISION = /(\p{L})'(?=\p{L})/gu;
const MINUTES = /(\d)’/gu;

export function apostrophes(texte) {
  if (typeof texte !== "string") return texte;
  return texte.replace(ELISION, "$1’").replace(MINUTES, "$1'");
}

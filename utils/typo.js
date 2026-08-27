// Apostrophes typographiques.
//
// Dans Vevey, l'apostrophe droite U+0027 est dessinée comme un
// prime — le signe des minutes —, alors que la fonte possède bien l'apostrophe
// courbe U+2019. Le contenu, lui, mélange les deux depuis toujours : les fiches
// arrivent par tableur, par copier-coller ou par l'admin, selon le clavier de
// chacun. Plutôt que de repasser sur les 87 fichiers de content/ (et de
// recommencer à chaque saisie), on convertit au rendu — voir
// server/plugins/apostrophes.ts pour le build, apercu/plugin.client.js pour
// l'aperçu en direct.
//
// Seulement entre deux lettres : c'est l'élision (« l'entrée », « d'origine »).
// Tout le reste garde sa quote droite — `year: '2021'` du frontmatter YAML, les
// guillemets d'un fragment de code, et surtout les primes de durée (« 35' »),
// qui sont justement le signe attendu aux minutes.
const ELISION = /(\p{L})'(?=\p{L})/gu;

export function apostrophes(texte) {
  return typeof texte === "string" ? texte.replace(ELISION, "$1’") : texte;
}

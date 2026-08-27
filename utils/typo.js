// Typographie du contenu : apostrophes courbes, primes droits.
//
// Dans Vevey, l'apostrophe droite U+0027 est dessinée comme un prime — le
// signe des minutes —, alors que la fonte possède bien l'apostrophe courbe
// U+2019. Le contenu, lui, mélange les deux depuis toujours : les fiches
// arrivent par tableur, par copier-coller ou par l'admin, selon le clavier de
// chacun. Plutôt que de repasser sur les 87 fichiers de content/ (et de
// recommencer à chaque saisie), on tranche au rendu — voir
// server/plugins/apostrophes.ts pour le build, apercu/plugin.client.js pour
// l'aperçu en direct.
//
// Deux règles miroir, une pour chaque signe :
//
// 1. L'élision (« l'entrée », « d'origine ») veut la courbe. Seulement entre
//    deux lettres : tout le reste garde sa quote droite — `year: '2021'` du
//    frontmatter YAML, `url: 'https://…'`, les guillemets d'un fragment de
//    code.
//
// 2. Les minutes (« 35' ») veulent le bâton droit (Siméon, 27.08.2026 : « pour
//    les minutes c'est encore le mauvais signe ») — c'est un prime, pas une
//    apostrophe. Les fiches les écrivent en courbe (`duration: 35’`, saisi au
//    tableur), on les redresse. Seulement après un chiffre et devant autre
//    chose qu'une lettre ou un chiffre : « 20’000 » (séparateur de milliers
//    suisse) et « 90’s » gardent leur courbe si jamais il en arrive.
const ELISION = /(\p{L})'(?=\p{L})/gu;
const PRIME = /(\d)’(?![\p{L}\d])/gu;

export function apostrophes(texte) {
  return typeof texte === "string" ? texte.replace(ELISION, "$1’") : texte;
}

export function primes(texte) {
  return typeof texte === "string" ? texte.replace(PRIME, "$1'") : texte;
}

// Les deux passes, dans l'ordre : l'élision ne crée jamais de courbe après un
// chiffre, les règles ne se marchent donc pas dessus.
export function typo(texte) {
  return primes(apostrophes(texte));
}

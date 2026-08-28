import { apostrophes } from "~/utils/typo.js";

// Les apostrophes droites du contenu deviennent des apostrophes courbes, juste
// avant que @nuxt/content ne parse le fichier — en dev comme au prerender, et
// pour tout ce que l'admin écrira ensuite. Voir utils/typo.js : dans Vevey,
// l'apostrophe droite est dessinée comme un prime (le signe des minutes).
//
// Le hook reçoit le fichier entier, frontmatter compris : les titres, la ligne
// du pied de page et les champs des fiches y passent aussi. Rien à corriger
// dans content/ — et rien à ne pas y écrire : l'une ou l'autre apostrophe
// arrive au même résultat.
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("content:file:beforeParse", (file: { _id: string; body: string }) => {
    if (file._id.endsWith(".md")) file.body = apostrophes(file.body);
  });
});

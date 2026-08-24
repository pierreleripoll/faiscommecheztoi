// Contenu d'une section, avec l'aperçu du CMS par-dessus.
//
// Le site est prérendu : chaque section est lue une fois au build par
// queryContent. Dans l'éditeur (nouveau.faiscommecheztoi.ch/admin), le volet
// d'aperçu est une iframe de cette même page, à qui le CMS envoie par
// postMessage le formulaire en cours de frappe (voir apercu/plugin.client.js).
// useContenu rend alors cette version-là à la place de celle du build, et
// seulement elle : les autres sections restent celles du site.
//
// Sur le site public le plugin n'est pas embarqué, la surcharge reste vide et
// useContenu se comporte comme useAsyncData.

// Les mêmes tris qu'en queryContent, pour reclasser après une surcharge :
// order numérique (sans $numeric, 10 se range entre 1 et 2), années décroissantes.
export const TRI_ORDRE = (a, b) => Number(a.order) - Number(b.order);
export const TRI_ANNEE_DESC = (a, b) =>
  String(b.year).localeCompare(String(a.year));

// Vrai seulement dans l'iframe d'aperçu, et seulement après l'hydratation :
// le HTML prérendu est celui du site, on ne bifurque qu'une fois monté.
export const useApercuActif = () => useState("apercu", () => false);

// { [clé useAsyncData]: doc } pour une section-fichier,
// { [clé]: { [_file]: doc } } pour une collection (programme, partenariats, artistes).
export const useApercuSurcharges = () => useState("apercu-surcharges", () => ({}));

/**
 * useAsyncData + queryContent, la surcharge d'aperçu par-dessus.
 * S'utilise comme `data` : `const hero = await useContenu("hero", () => …)`.
 *
 * @param {string} cle  clé useAsyncData — c'est aussi celle que vise le plugin d'aperçu
 * @param {() => Promise<any>} requete  la requête queryContent
 * @param {{ tri?: (a, b) => number }} [options]  tri à réappliquer après fusion (collections)
 */
export async function useContenu(cle, requete, { tri } = {}) {
  // Avant le await : passé celui-ci, le contexte Nuxt n'est plus garanti au
  // prérendu et useState lèverait « nuxt instance unavailable ».
  const surcharges = useApercuSurcharges();
  const { data } = await useAsyncData(cle, requete);

  return computed(() => {
    const s = surcharges.value[cle];
    if (!s) return data.value;
    // Section-fichier : le doc envoyé remplace celui du build.
    if (!Array.isArray(data.value)) return s;
    // Collection : chaque fiche surchargée remplace la sienne (même _file),
    // une fiche nouvelle s'ajoute, puis on reclasse.
    const restants = data.value.filter((d) => !s[d._file]);
    const fusion = [...restants, ...Object.values(s)];
    return tri ? fusion.sort(tri) : fusion;
  });
}

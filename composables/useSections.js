// Les sections de la page entre l'intro et le pied, et leur ordre.
//
// L'ordre se règle dans l'admin (content/ordre.md, singleton « Ordre des
// sections ») : pages/index.vue les rend dans cet ordre, SiteNav.vue range ses
// liens pareil. L'id est celui de l'ancre ; `nav` est le texte du lien, absent
// pour une section qui n'a pas de lien dans la nav.
export const SECTIONS_PAGE = [
  { id: "artistes", nav: "Artistes" },
  { id: "grille", nav: "Grille" },
  { id: "infos", nav: "Infos" },
  { id: "partenariats", nav: "Partenariats" },
  { id: "participer", nav: "Participer" },
  { id: "contact", nav: "Contact & Team" },
  { id: "soutiens" },
];

/**
 * Les ids des sections dans l'ordre choisi dans l'admin. Un id inconnu ou en
 * double est ignoré, une section oubliée par le fichier revient à la fin dans
 * l'ordre de SECTIONS_PAGE : une erreur de saisie ne peut pas faire disparaître
 * une section.
 */
export async function useOrdreSections() {
  const ordre = await useContenu("ordre", () =>
    queryContent("/ordre").findOne()
  );
  return computed(() => {
    const connus = SECTIONS_PAGE.map((s) => s.id);
    const choisis = (ordre.value?.sections || []).filter(
      (id, i, liste) => connus.includes(id) && liste.indexOf(id) === i
    );
    return [...choisis, ...connus.filter((id) => !choisis.includes(id))];
  });
}

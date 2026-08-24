// Aperçu en direct depuis l'admin (Sveltia CMS).
//
// Chargé seulement par le build d'édition (NUXT_PUBLIC_APERCU=1, servi sur
// nouveau.faiscommecheztoi.ch — voir nuxt.config.ts). Et même là, il ne fait
// rien tant que la page n'est pas ouverte dans une iframe avec ?apercu : c'est
// le template d'aperçu de public/admin/apercu.js qui l'ouvre ainsi, puis lui
// envoie par postMessage le formulaire à chaque frappe. On parse le markdown
// ici, avec le même pipeline MDC que le build, et on pose le document obtenu
// dans la surcharge que lit useContenu — la section se redessine, le reste de
// la page ne bouge pas.

// section (nom de collection ou de fichier Sveltia) → clé useAsyncData, ancre
// où défiler, dossier de contenu pour les collections.
const SECTIONS = {
  hero: { cle: "hero", ancre: "contenu" },
  appel: { cle: "appel", ancre: "contenu" },
  infos: { cle: "infos", ancre: "infos" },
  participer: { cle: "participer", ancre: "participer" },
  team: { cle: "team", ancre: "contact" },
  soutiens: { cle: "soutiens", ancre: "soutiens" },
  pied: { cle: "pied", ancre: "pied" },
  artistes: { cle: "artistes", ancre: "artistes", dossier: "artistes" },
  programme: { cle: "artistes-fiches", ancre: "artistes", dossier: "programme" },
  partenariats: { cle: "partenariats", ancre: "partenariats", dossier: "partenariats" },
};

// Les champs machine que @nuxt/content ajoute à chaque document : on les
// reprend du document existant, ou on les fabrique pour une fiche nouvelle.
const META = [
  "_path", "_dir", "_id", "_file", "_stem",
  "_source", "_extension", "_draft", "_partial", "_locale",
];

export default defineNuxtPlugin((nuxtApp) => {
  // Hors de l'iframe d'aperçu, un visiteur qui taperait ?apercu voit le site
  // tel quel : rien n'est branché.
  if (window.parent === window) return;
  if (!new URLSearchParams(location.search).has("apercu")) return;

  const actif = useApercuActif();
  const surcharges = useApercuSurcharges();
  const annee = useState("artistes-annee", () => null);
  const carte = useState("artistes-ouverte", () => null);
  const nuage = useState("appel-cloud-open", () => true);
  // Cibles déjà amenées à l'écran : on défile à la première frappe sur une
  // section, pas à chacune — ensuite l'éditeur·ice défile où bon lui semble.
  const defilees = new Set();
  let parseur = null;

  nuxtApp.hook("app:mounted", () => {
    // Après l'hydratation seulement : le HTML prérendu est celui du site, et
    // bifurquer avant ferait diverger serveur et client.
    actif.value = true;
    window.addEventListener("message", recevoir);
    // Le template côté admin attend ce signal pour (re)envoyer l'entrée
    // courante — l'iframe vient peut-être d'être créée alors qu'on tapait déjà.
    window.top.postMessage({ type: "fcct-apercu-ready" }, location.origin);
  });

  async function recevoir(e) {
    // Le script du template s'exécute dans la page admin (window.top), même
    // si React le dessine dans l'iframe intermédiaire de Sveltia.
    if (e.origin !== location.origin || e.source !== window.top) return;
    if (e.data?.type !== "fcct-apercu") return;
    const s = SECTIONS[e.data.section];
    if (!s) return;

    const doc = await fabriquerDoc(s, e.data);
    if (s.dossier) {
      const collection = { ...(surcharges.value[s.cle] || {}), [doc._file]: doc };
      surcharges.value = { ...surcharges.value, [s.cle]: collection };
    } else {
      surcharges.value = { ...surcharges.value, [s.cle]: doc };
    }
    focaliser(e.data.section, s, doc);
  }

  // Le parseur (unified + remark + rehype) ne se charge qu'au premier
  // message : un visiteur du site d'édition qui ne passe pas par l'admin ne le
  // télécharge jamais.
  function chargerParseur() {
    parseur ||= import("@nuxtjs/mdc/runtime/parser/index").then(
      (m) => m.parseMarkdown
    );
    return parseur;
  }

  async function fabriquerDoc(s, { section, fichier, slug, data, assets }) {
    const { body, ...champs } = data || {};
    const parse = await chargerParseur();
    const r = await parse(typeof body === "string" ? body : "");

    if (!fichier) fichier = `${s.dossier || section}/${slug || "nouveau"}.md`;
    const existant = trouverExistant(s, fichier);
    const meta = existant
      ? Object.fromEntries(META.map((k) => [k, existant[k]]))
      : metaDepuisFichier(fichier, s);

    // Même assemblage que le transformer markdown de @nuxt/content : les
    // données du parseur, puis le frontmatter (ici le formulaire) par-dessus.
    const doc = {
      ...meta,
      ...r.data,
      ...champs,
      excerpt: r.excerpt,
      body: { ...r.body, toc: r.toc },
      _type: "markdown",
    };
    substituerImages(doc, assets || {});
    return doc;
  }

  function trouverExistant(s, fichier) {
    const v = nuxtApp.payload.data[s.cle];
    return Array.isArray(v) ? v.find((d) => d._file === fichier) : v;
  }

  // Reproduit path-meta de @nuxt/content pour une fiche pas encore construite :
  // « programme/12.nouvelle-fiche.md » → _path « /programme/nouvelle-fiche ».
  function metaDepuisFichier(fichier, s) {
    const stem = fichier.replace(/\.md$/, "");
    const path = stem
      .split("/")
      .map((part) => part.replace(/^\d+\./, ""))
      .join("/");
    return {
      _path: `/${path}`,
      _dir: s.dossier || "",
      _id: `content:${fichier.replace(/\//g, ":")}`,
      _file: fichier,
      _stem: stem,
      _source: "content",
      _extension: "md",
      _draft: false,
      _partial: false,
      _locale: "",
    };
  }

  // Une image qu'on vient de choisir dans l'admin n'existe pas encore sur le
  // serveur : le template nous passe son blob, on le met à la place du chemin.
  // Les dimensions sont écrasées et le thumbhash retiré — Sveltia conserve les
  // clés inconnues, donc celles de l'ancienne image quand on en change.
  function substituerImages(obj, assets) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach((v) => substituerImages(v, assets));
      return;
    }
    const a = typeof obj.src === "string" && assets[obj.src];
    if (a) {
      obj.src = a.url;
      delete obj.thumbhash;
      if (a.width && a.height) {
        obj.width = a.width;
        obj.height = a.height;
      } else {
        delete obj.width;
        delete obj.height;
      }
    }
    Object.values(obj).forEach((v) => substituerImages(v, assets));
  }

  function focaliser(section, s, doc) {
    if (section === "programme") {
      // Poser les états directement plutôt que via toggle(), qui refermerait
      // la carte : on veut l'onglet de l'année et la fiche retournée.
      annee.value = String(doc.year || "");
      carte.value = doc._path;
    } else if (section === "artistes") {
      annee.value = String(doc.year || "");
    } else if (section === "appel") {
      // Le nuage a pu être fermé dans l'aperçu : on le rouvre pour voir la modif.
      nuage.value = true;
    }

    const cible = section === "programme" ? doc._path : section;
    if (defilees.has(cible)) return;
    defilees.add(cible);
    nextTick(() => {
      const el =
        (section === "programme" &&
          document.querySelector(`[data-path="${CSS.escape(doc._path)}"]`)) ||
        document.getElementById(s.ancre);
      el?.scrollIntoView({ block: "start" });
    });
  }
});

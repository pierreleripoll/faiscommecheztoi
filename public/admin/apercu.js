// Aperçu en direct : le volet de droite de l'éditeur montre le vrai site.
//
// Sveltia dessine ses aperçus avec des composants React (il embarque React et
// expose createClass / h). Le nôtre ne dessine qu'une iframe sur la page
// d'accueil ouverte avec ?apercu, et lui envoie par postMessage le formulaire
// à chaque changement ; côté site, apercu/plugin.client.js remplace la section
// concernée par ce qu'on tape. Ne marche que sur le build d'édition
// (nouveau.faiscommecheztoi.ch) : le site public n'embarque pas ce plugin.
(function () {
  // L'iframe d'aperçu de Sveltia est une URL blob: — une adresse relative ne
  // s'y résout pas, d'où l'origine absolue de la page admin. Le # coupe le
  // rideau d'ouverture (script du <head> de nuxt.config.ts).
  var ORIGINE = location.origin;
  var URL_SITE = ORIGINE + "/?apercu#apercu";
  // Nom de collection ou de fichier sous lequel Sveltia cherche un template :
  // on enregistre le même sous tous, et la section réelle se lit dans le chemin
  // de l'entrée.
  var NOMS = [
    "_singletons", "hero", "appel", "infos", "participer", "team", "soutiens", "pied",
    "artistes", "programme", "partenariats",
  ];
  // Dimensions mesurées des images fraîchement choisies, par chemin.
  var mesures = {};

  // content/hero.md → hero ; content/programme/3.x.md → programme.
  function sectionDepuis(chemin) {
    var parts = String(chemin || "").replace(/^content\//, "").split("/");
    return parts.length > 1 ? parts[0] : parts[0].replace(/\.md$/, "");
  }

  // Toutes les chaînes rangées sous une clé « src », à n'importe quelle
  // profondeur (photo, photos[], posters[], logos[]).
  function listerSrc(v, acc) {
    if (!v || typeof v !== "object") return acc;
    if (Array.isArray(v)) {
      v.forEach(function (x) { listerSrc(x, acc); });
      return acc;
    }
    if (typeof v.src === "string" && acc.indexOf(v.src) < 0) acc.push(v.src);
    Object.keys(v).forEach(function (k) { listerSrc(v[k], acc); });
    return acc;
  }

  var Apercu = createClass({
    componentDidMount: function () {
      var self = this;
      this.pret = false;
      this.dernier = null;
      // Le site répond « prêt » à la fenêtre admin (window.top) une fois hydraté.
      this.ecouteur = function (e) {
        if (e.origin !== ORIGINE || !self.iframe || e.source !== self.iframe.contentWindow) return;
        if (e.data && e.data.type === "fcct-apercu-ready") {
          self.pret = true;
          self.envoyer(true);
        }
      };
      window.addEventListener("message", this.ecouteur);
    },

    // Sveltia re-rend le template à chaque frappe : on regroupe.
    componentDidUpdate: function () { this.planifier(); },

    componentWillUnmount: function () {
      clearTimeout(this.minuterie);
      window.removeEventListener("message", this.ecouteur);
    },

    planifier: function () {
      clearTimeout(this.minuterie);
      this.minuterie = setTimeout(this.envoyer.bind(this, false), 120);
    },

    charge: function () {
      var self = this;
      var entry = this.props.entry;
      var data = entry.get("data");
      data = data && data.toJS ? data.toJS() : (data || {});
      var chemin = String(entry.get("path") || "").replace(/^content\//, "");
      var assets = {};

      listerSrc(data, []).forEach(function (src) {
        // getAsset résout en blob une image pas encore enregistrée ; pour une
        // image déjà en ligne on laisse le chemin, le site la sert lui-même.
        var a = self.props.getAsset ? self.props.getAsset(src) : null;
        if (!a || !a.url || a.url === src) return;
        assets[src] = Object.assign({ url: a.url }, mesures[src] || {});
        if (!mesures[src]) {
          var im = new Image();
          im.onload = function () {
            mesures[src] = { width: im.naturalWidth, height: im.naturalHeight };
            self.planifier();
          };
          im.src = a.url;
        }
      });

      return {
        type: "fcct-apercu",
        section: sectionDepuis(entry.get("path")),
        fichier: chemin,
        slug: entry.get("slug"),
        nouveau: !!entry.get("newRecord"),
        data: data,
        assets: assets,
      };
    },

    envoyer: function (force) {
      if (!this.pret || !this.iframe || !this.iframe.contentWindow) return;
      var msg = this.charge();
      var json = JSON.stringify(msg);
      // Un re-rendu sans édition (ex. survol) ne renvoie rien.
      if (!force && json === this.dernier) return;
      this.dernier = json;
      this.iframe.contentWindow.postMessage(msg, ORIGINE);
    },

    render: function () {
      var self = this;
      // fixed + inset 0 : remplit le volet quelle que soit la hauteur du
      // conteneur React de Sveltia.
      return h("iframe", {
        ref: function (el) { self.iframe = el; },
        src: URL_SITE,
        title: "Aperçu du site",
        style: { position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 },
      });
    },
  });

  NOMS.forEach(function (nom) { CMS.registerPreviewTemplate(nom, Apercu); });
  CMS.registerPreviewStyle("html,body{height:100%;margin:0;overflow:hidden}", { raw: true });
})();

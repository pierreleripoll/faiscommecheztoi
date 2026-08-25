// Champ « horaire » de l'admin : la date et l'heure d'une représentation.
//
// La grille horaire du site et les fichiers .ics ne lisent qu'une seule
// écriture, « Je 08.10, 19:05 » (composables/useGrille.js, FORMAT_DATE) : une
// faute de frappe ne casse rien mais fait disparaître le créneau de la grille,
// sans que personne ne le voie. Ce champ remplace le champ texte libre :
//
//   - on tape comme on veut (« 8.10 19h05 », « jeudi 8 octobre 19h », « Je
//     08.10, 19:05 »…) et le champ remet au propre en quittant la case ; le
//     jour de la semaine est recalculé, pas recopié ;
//   - un bouton calendrier ouvre le sélecteur natif du navigateur, borné à
//     l'année de la fiche (le texte enregistré ne porte pas l'année : elle
//     vient du champ « Année ») ;
//   - isValid() refuse l'enregistrement si la date est illisible, n'existe pas
//     (31.11, 25:00), ne tombe pas le jour de semaine écrit, ou est loin des
//     autres représentations de l'édition — les autres horaires de la fiche
//     plus ceux du dernier build (horaires.json, écrit par
//     scripts/generateAgendaIcs.mjs). Sveltia affiche le message sous le champ
//     et bloque le bouton Enregistrer.
//
// Le texte enregistré ne change pas de forme : rien à migrer, les fiches des
// éditions passées gardent leur écriture libre (« Ven. 3 oct. - 18h30 ») et le
// champ ne les contrôle pas — voir ANNEE_FORMAT_STRICT.
//
// Sveltia embarque React : createClass (create-react-class) et h sont
// globaux, comme dans apercu.js. Chargé par index.html après sveltia-cms.js.
// Les fonctions pures sont aussi posées sur globalThis.fcctHoraire pour être
// testables hors navigateur.
(function () {
  // À partir de cette édition, les horaires suivent le format de la grille.
  var ANNEE_FORMAT_STRICT = 2026;
  // Écart maximal, en jours, entre un horaire et la représentation connue la
  // plus proche de la même édition — au-delà, la date est refusée. Le festival
  // tient sur quatre soirs ; sept jours laissent la place à un vernissage la
  // semaine d'avant. Réglable par fiche de champ (option `tolerance_jours`).
  var TOLERANCE_JOURS = 7;

  var ABREGES = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"]; // ordre de getDay()
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var MOIS = {
    janv: 1, jan: 1, fev: 2, fevr: 2, mars: 3, mar: 3, avr: 4, avri: 4, mai: 5,
    juin: 6, juil: 7, aout: 8, sept: 9, sep: 9, oct: 10, octo: 10, nov: 11, nove: 11, dec: 12, dece: 12,
  };
  // Ce que la grille sait lire — même expression que FORMAT_DATE côté site.
  var CANONIQUE = /^(Lu|Ma|Me|Je|Ve|Sa|Di) (\d{2})\.(\d{2}), (\d{2}):(\d{2})$/;

  function dd(n) { return (n < 10 ? "0" : "") + n; }
  function sansAccents(s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function joursDansMois(annee, mois) { return new Date(annee, mois, 0).getDate(); }

  // « Je 08.10, 19:05 » depuis {annee, mois, jour, heure, minute}. Le jour de
  // la semaine se déduit de la date, il n'est jamais recopié de la saisie.
  function formater(d) {
    var abrege = ABREGES[new Date(d.annee, d.mois - 1, d.jour).getDay()];
    return abrege + " " + dd(d.jour) + "." + dd(d.mois) + ", " + dd(d.heure) + ":" + dd(d.minute);
  }

  /**
   * Lit une saisie libre. Renvoie {annee, mois, jour, heure, minute} ou
   * {erreur} avec une phrase pour l'éditeur·ice. `annee` est celle de la
   * fiche : elle sert au jour de la semaine et au 29 février, et une année
   * tapée qui la contredit est refusée plutôt que perdue en silence.
   */
  function analyser(texte, annee) {
    var s = String(texte == null ? "" : texte).trim().toLowerCase();
    if (!s) return { erreur: "Indique la date et l'heure, ex. Je 08.10, 19:05." };

    // « jeudi », « Jeu. », « je » en tête : ignoré, on le recalcule.
    s = s.replace(/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lun|mar|mer|merc|jeu|ven|sam|dim|lu|ma|me|je|ve|sa|di)\.?\s+/, "");

    var jour, mois, an = null, reste, m;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/.exec(s))) {
      // 2026-10-08 19:05 (copié d'un tableur, ou 2026-10-08T19:05)
      an = +m[1]; mois = +m[2]; jour = +m[3]; reste = m[4].replace(/^t/, " ");
    } else if ((m = /^(\d{1,2})[./](\d{1,2})(?:[./](\d{4}|\d{2})(?![\d:h]))?(.*)$/.exec(s))) {
      // 08.10, 8/10, 08.10.2026, 8.10.26
      jour = +m[1]; mois = +m[2];
      if (m[3]) an = m[3].length === 2 ? 2000 + +m[3] : +m[3];
      reste = m[4];
    } else if ((m = /^(\d{1,2})(?:er)?\.?\s+([a-zéû]+)\.?(.*)$/.exec(s))) {
      // 8 octobre, 8 oct., 1er oct.
      jour = +m[1];
      var nom = sansAccents(m[2]);
      mois = MOIS[nom] || MOIS[nom.slice(0, 4)] || MOIS[nom.slice(0, 3)];
      if (!mois) return { erreur: "Mois « " + m[2] + " » inconnu — écris par ex. 08.10 19:05." };
      reste = m[3];
    } else {
      return { erreur: "Date illisible — écris jour.mois puis l'heure, ex. 08.10 19:05." };
    }

    if (an !== null && annee && an !== annee) {
      return { erreur: "Cette date est en " + an + ", mais la fiche est dans l'édition " + annee + "." };
    }
    var a = annee || an || new Date().getFullYear();
    if (mois < 1 || mois > 12) return { erreur: "Le mois " + mois + " n'existe pas." };
    if (jour < 1 || jour > joursDansMois(a, mois)) {
      return { erreur: "Le " + dd(jour) + "." + dd(mois) + " n'existe pas" + (jour === 29 && mois === 2 ? " en " + a : "") + "." };
    }

    // « , 19:05 », « - 19h05 », « à 19h », « 19 h 05 », « 19 » — et rien d'autre après.
    reste = reste.replace(/^[\s,;:–—-]+/, "").replace(/^(a|à)\s+/, "").trim();
    if (!reste) return { erreur: "Il manque l'heure, ex. " + dd(jour) + "." + dd(mois) + " 19:05." };
    m = /^(\d{1,2})(?:\s*[:h.]\s*(\d{2})?)?$/.exec(reste);
    if (!m) return { erreur: "Heure illisible « " + reste + " » — écris par ex. 19:05." };
    var heure = +m[1], minute = m[2] ? +m[2] : 0;
    if (heure > 23) return { erreur: heure + " h, ça n'existe pas — l'heure va de 00 à 23." };
    if (minute > 59) return { erreur: "Les minutes vont de 00 à 59." };

    return { annee: a, mois: mois, jour: jour, heure: heure, minute: minute };
  }

  // Les représentations déjà connues de chaque édition, écrites par le dernier
  // build : { "2026": ["2026-10-07", …] }. Absent en cas d'échec — le contrôle
  // se rabat alors sur les autres horaires de la fiche.
  var references = {};
  var referencesPretes = (typeof fetch === "function"
    ? fetch("horaires.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (json) { references = json || {}; })
        .catch(function () {})
    : Promise.resolve());

  function versUtc(iso) {
    var p = iso.split("-").map(Number);
    return Date.UTC(p[0], p[1] - 1, p[2]);
  }

  /**
   * Refuse une date loin de toute représentation connue de l'édition. `refs`
   * sont des dates ISO (AAAA-MM-JJ) ; sans référence, rien à comparer.
   */
  function verifierProximite(d, refs, tolerance) {
    if (!refs.length) return null;
    var cible = Date.UTC(d.annee, d.mois - 1, d.jour);
    var ecart = Infinity, min = Infinity, max = -Infinity;
    refs.forEach(function (iso) {
      var t = versUtc(iso);
      ecart = Math.min(ecart, Math.abs(cible - t) / 86400000);
      min = Math.min(min, t); max = Math.max(max, t);
    });
    if (ecart <= tolerance) return null;
    var f = function (t) { var x = new Date(t); return dd(x.getUTCDate()) + "." + dd(x.getUTCMonth() + 1); };
    return "Le " + dd(d.jour) + "." + dd(d.mois) + " est loin des autres représentations de l'édition " +
      d.annee + " (du " + f(min) + " au " + f(max) + ") — vérifie le jour et le mois.";
  }

  function versListe(v) {
    if (v && typeof v.toJS === "function") v = v.toJS();
    return Array.isArray(v) ? v : [];
  }

  var Horaire = createClass({
    getInitialState: function () {
      // `texte` : ce qui est en train d'être tapé ; null = afficher la valeur
      // enregistrée. `pickerVisible` : repli quand showPicker() n'existe pas.
      // `signale` : Sveltia affiche déjà l'erreur au-dessus du champ (après
      // une tentative d'enregistrement) — on n'en met pas une deuxième.
      return { texte: null, focus: false, pickerVisible: false, signale: false };
    },

    // Sveltia pose aria-invalid sur le premier <input> du champ à chaque rendu ;
    // c'est le seul signal qu'il montre son propre message.
    componentDidMount: function () {
      var self = this;
      if (!this.input || typeof MutationObserver !== "function") return;
      this.observateur = new MutationObserver(function () {
        var signale = self.input.getAttribute("aria-invalid") === "true";
        if (signale !== self.state.signale) self.setState({ signale: signale });
      });
      this.observateur.observe(this.input, { attributes: true, attributeFilter: ["aria-invalid"] });
    },

    componentWillUnmount: function () {
      if (this.observateur) this.observateur.disconnect();
    },

    option: function (nom, defaut) {
      var f = this.props.field;
      var v = f && typeof f.get === "function" ? f.get(nom) : undefined;
      return v === undefined || v === null ? defaut : v;
    },

    // L'année de la fiche (champ « Année »), ou rien si elle n'est pas lisible.
    annee: function () {
      var e = this.props.entry;
      var y = e && typeof e.getIn === "function" ? e.getIn(["data", "year"]) : undefined;
      var n = parseInt(y, 10);
      return Number.isFinite(n) && n > 1900 ? n : null;
    },

    // Les éditions passées gardent leur écriture libre : ni remise au propre,
    // ni contrôle.
    strict: function () {
      var a = this.annee();
      return a === null || a >= ANNEE_FORMAT_STRICT;
    },

    texteAffiche: function () {
      return this.state.texte !== null ? this.state.texte : String(this.props.value == null ? "" : this.props.value);
    },

    // Références pour le contrôle de proximité : horaires du dernier build
    // pour l'édition, plus les autres horaires de la fiche (les « voisins »).
    references: function (d) {
      var refs = versListe(references[String(d.annee)]).slice();
      var e = this.props.entry;
      var propre = formater(d);
      versListe(e && typeof e.getIn === "function" ? e.getIn(["data", "dates"]) : []).forEach(function (v) {
        var m = CANONIQUE.exec(String(v || "").trim());
        if (!m || String(v).trim() === propre) return; // soi-même, ou illisible
        refs.push(d.annee + "-" + m[3] + "-" + m[2]);
      });
      return refs;
    },

    // Le diagnostic complet d'une valeur enregistrée : null si tout va bien,
    // sinon la phrase à afficher. Partagé par isValid() et le message en ligne.
    diagnostic: function (valeur) {
      var texte = String(valeur == null ? "" : valeur).trim();
      if (!texte) return "Horaire vide — indique une date ou supprime la ligne.";
      if (!this.strict()) return null;

      var annee = this.annee();
      var d = analyser(texte, annee);
      if (d.erreur) return d.erreur;

      // Le jour de semaine est calculé à la saisie ; s'il ne colle plus, c'est
      // que le champ « Année » a changé après coup, ou que le fichier a été
      // retouché à la main.
      var m = CANONIQUE.exec(texte);
      if (m && annee) {
        var attendu = new Date(annee, d.mois - 1, d.jour).getDay();
        if (ABREGES[attendu] !== m[1]) {
          return "En " + annee + ", le " + dd(d.jour) + "." + dd(d.mois) + " tombe un " + JOURS[attendu] +
            " (" + ABREGES[attendu] + "), pas « " + m[1] + " » — retape la date, le jour se corrige tout seul.";
        }
      }

      if (this.option("plausibilite", true) === false) return null;
      return verifierProximite(d, this.references(d), Number(this.option("tolerance_jours", TOLERANCE_JOURS)));
    },

    // Appelé par Sveltia à chaque changement de la fiche ; le verdict bloque
    // Enregistrer et s'affiche sous le champ.
    isValid: function (valeur) {
      var self = this;
      return referencesPretes.then(function () {
        var probleme = self.diagnostic(valeur);
        return probleme ? { error: { message: probleme } } : true;
      });
    },

    // À chaque frappe : la valeur enregistrée est la forme propre dès que la
    // saisie se lit, sinon le brut — pour qu'un Ctrl+S en pleine frappe
    // n'enregistre jamais autre chose que ce qu'on voit.
    onSaisie: function (e) {
      var brut = e.target.value;
      this.setState({ texte: brut });
      if (!this.strict()) { this.props.onChange(brut); return; }
      var d = analyser(brut, this.annee());
      this.props.onChange(d.erreur ? brut : formater(d));
    },

    // En quittant la case (ou sur Entrée), la saisie prend sa forme propre.
    normaliser: function () {
      var texte = this.texteAffiche();
      if (this.strict()) {
        var d = analyser(texte, this.annee());
        if (!d.erreur) this.props.onChange(formater(d));
      }
      this.setState({ texte: null });
    },

    onBlur: function () { this.setState({ focus: false }); this.normaliser(); },
    onFocus: function () { this.setState({ focus: true }); },
    onKeyDown: function (e) {
      if (e.key === "Enter") { e.preventDefault(); this.normaliser(); }
    },

    // Le sélecteur natif ne connaît que des dates complètes : l'année est
    // celle de la fiche, et le champ reste borné à cette année.
    onPicker: function (e) {
      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(e.target.value || "");
      if (!m) return;
      var d = { annee: this.annee() || +m[1], mois: +m[2], jour: +m[3], heure: +m[4], minute: +m[5] };
      this.setState({ texte: null });
      this.props.onChange(formater(d));
    },

    ouvrirPicker: function () {
      var el = this.picker;
      if (!el) return;
      if (!this.state.pickerVisible) {
        try {
          if (typeof el.showPicker === "function") { el.showPicker(); return; }
        } catch (err) { /* pas de sélecteur (Safari ancien, iframe) : repli visible */ }
      }
      // Repli : le champ natif s'affiche dans la ligne, on y saisit au clavier.
      var visible = !this.state.pickerVisible;
      this.setState({ pickerVisible: visible });
      if (visible) setTimeout(function () { el.focus(); }, 0);
    },

    render: function () {
      var self = this;
      var annee = this.annee() || new Date().getFullYear();
      var strict = this.strict();
      var enregistre = analyser(this.props.value, annee);
      var valeurPicker = enregistre.erreur ? "" :
        annee + "-" + dd(enregistre.mois) + "-" + dd(enregistre.jour) + "T" + dd(enregistre.heure) + ":" + dd(enregistre.minute);

      // Sous le champ : pendant la frappe, la forme propre qui sera gardée ;
      // une fois la case quittée, le problème s'il y en a un — sauf si Sveltia
      // l'affiche déjà lui-même.
      var message = null, ton = "info";
      if (strict) {
        if (this.state.focus) {
          var d = analyser(this.state.texte, annee);
          if (this.state.texte !== null && !d.erreur) {
            var propre = formater(d);
            if (propre !== this.state.texte) message = "→ " + propre;
          }
        } else if (!this.state.signale && String(this.props.value || "").trim()) {
          message = this.diagnostic(this.props.value);
          ton = "erreur";
        }
      }

      var idAide = (this.props.forID || "horaire") + "-aide";
      var pickerVisible = this.state.pickerVisible;

      return h("div", { style: { display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 } },
        h("div", { style: { position: "relative", display: "flex", gap: "6px", alignItems: "center" } },
          h("input", {
            ref: function (el) { self.input = el; },
            id: this.props.forID || undefined,
            className: this.props.classNameWrapper || undefined,
            type: "text",
            value: this.texteAffiche(),
            placeholder: strict ? "Je 08.10, 19:05" : "",
            autoComplete: "off",
            spellCheck: false,
            "aria-describedby": message ? idAide : undefined,
            style: { flex: "1 1 auto", minWidth: 0 },
            onChange: this.onSaisie,
            onFocus: this.onFocus,
            onBlur: this.onBlur,
            onKeyDown: this.onKeyDown,
          }),
          h("button", {
            type: "button",
            title: "Choisir la date et l'heure dans un calendrier",
            "aria-label": "Choisir la date et l'heure dans un calendrier",
            "aria-expanded": pickerVisible ? "true" : "false",
            onClick: this.ouvrirPicker,
            style: {
              flex: "0 0 auto", width: "36px", height: "36px", padding: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(128, 128, 128, .45)", borderRadius: "6px",
              background: "transparent", color: "inherit",
            },
          },
            h("svg", { viewBox: "0 0 24 24", width: 20, height: 20, "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
              h("rect", { x: 3, y: 5, width: 18, height: 16, rx: 2 }),
              h("path", { d: "M3 10h18M8 3v4M16 3v4" }),
              h("path", { d: "M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" })
            )
          ),
          // Le sélecteur natif : invisible tant que showPicker() suffit (il
          // s'ancre sur cet élément, posé sous le bouton), visible en repli.
          h("input", {
            ref: function (el) { self.picker = el; },
            type: "datetime-local",
            value: valeurPicker,
            min: annee + "-01-01T00:00",
            max: annee + "-12-31T23:59",
            "aria-label": "Date et heure (calendrier)",
            tabIndex: pickerVisible ? 0 : -1,
            onChange: this.onPicker,
            style: pickerVisible
              ? { flex: "0 0 auto", font: "inherit", padding: "4px 6px", border: "1px solid rgba(128, 128, 128, .45)", borderRadius: "6px", background: "transparent", color: "inherit" }
              : { position: "absolute", right: 0, bottom: 0, width: "36px", height: "1px", opacity: 0, pointerEvents: "none", border: 0, padding: 0, margin: 0 },
          })
        ),
        message ? h("p", {
          id: idAide,
          role: ton === "erreur" ? "alert" : undefined,
          style: {
            margin: 0, fontSize: "12px", lineHeight: 1.35,
            color: ton === "erreur" ? "#e53935" : "inherit",
            opacity: ton === "erreur" ? 1 : 0.7,
          },
        }, message) : null
      );
    },
  });

  if (typeof CMS !== "undefined" && CMS && typeof CMS.registerFieldType === "function") {
    CMS.registerFieldType("horaire", Horaire, undefined, {
      properties: {
        // false : pas de contrôle de proximité (horaires d'un autre festival).
        plausibilite: { type: "boolean" },
        tolerance_jours: { type: "number" },
      },
    });
  }

  // Pour les tests hors navigateur (node) : les fonctions pures seulement.
  var g = typeof globalThis !== "undefined" ? globalThis : window;
  g.fcctHoraire = { analyser: analyser, formater: formater, verifierProximite: verifierProximite, CANONIQUE: CANONIQUE };
})();

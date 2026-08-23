# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Site du festival **Fais comme chez toi** — Rencontres des artistes émergent·es valaisan·nes (Le Spot, Sion). One-pager **Nuxt 3 statique** piloté par le contenu : les sections sont des fichiers Markdown dans `content/`, éditables via Sveltia CMS (`/admin`). Architecture reprise de `pierreleripoll/mariaclaracastioni` (branche `staging`).

Design : maquette Figma de Siméon Dubuis, dessinée sur deux gabarits — **desktop 1280 px** et **mobile 375 px**. Les valeurs (couleurs, tailles, espacements) ont été extraites du fichier Figma via le MCP Figma, pas échantillonnées à l'œil : fond `#ffbfff`, nav `#ffc8ff`, texte `#ff00ff`, nuage `#ff7dff`. Tout est centralisé dans `assets/css/tokens.css` — c'est le point unique de re-skin, et les tailles y interpolent linéairement entre les deux gabarits.

Le fichier Figma d'origine est un **Figma Sites** (`/site/`), que le MCP Figma ne sait pas lire ; une copie en fichier *Design* classique existe et c'est celle-là qu'il faut interroger.

Police : **Vevey**, servie en OTF depuis `public/fonts/` — *Positive* est le romain, *HumanKind* l'italique, les deux déclarés sous la même famille dans `tokens.css`. Repli automatique sur Quicksand si les fichiers manquent. Le disclaimer livré avec la fonte la dit *free for non-commercial use only* : à valider avec le designer avant la mise en ligne.

## Commands

```bash
npm run dev            # serveur de dev sur 0.0.0.0:3000
npm run generate       # updateImageDimensions + nuxt generate (prerender statique) — build canonique
npm run update-images  # régénère width/height/ratio/thumbhash dans les frontmatters
npm run preview        # prévisualise un build
```

Pas de tests ni de linter configurés.

## Architecture

- **One-pager.** `pages/index.vue` assemble les sections en interrogeant `content/` via `queryContent` : hero (`hero.md`), nuage « Appel à projet » (`appel.md`, fermable, état partagé `useState`), Artistes (`artistes/<year>.md` pour les affiches + crédit, `programme/*.md` pour les fiches artistes triées par `order` — tout filtré par l'année sélectionnée), Grille horaire (`components/SectionGrille.vue`, dérivée des `dates` des fiches par `composables/useGrille.js` — pas de source de contenu propre), Infos (`infos.md`), Partenariats (`partenariats/*.md`, triés par `order`), Participer (`participer.md`), Contact & Team (`team.md`), Soutiens (`soutiens.md`, liste de logos), pied de page (`components/PiedDePage.vue`, ligne dans `pied.md`). La nav sticky (`components/SiteNav.vue`) pointe sur les ancres de section ; sous 720 px elle devient une barre marque + **nuage-menu** (panneau plein écran), au-dessus la ligne défile latéralement avec un fondu de bord tant qu'elle déborde. Un lien d'évitement « Aller au contenu » (`app.vue`) précède la nav.

- **Agenda.** Chaque créneau déplié de la grille propose « Ajoute-le à ton agenda » : un `.ics` à un seul VEVENT fabriqué dans un lien `data:` par `lienAgenda()` (`composables/useGrille.js`), déterministe (pas de `Date.now()`, sinon le prérendu et l'hydratation divergent). Heure en `TZID=Europe/Zurich`, durée parsée depuis `duration` (60 min par défaut).

- **Images.** `scripts/updateImageDimensions.mjs` parcourt tout `content/` et complète les champs machine (`width`, `height`, `ratio`, `thumbhash`) de toute entrée d'image (`images[]`, `posters[]`, `logos[]`, `photos[]`, `photo`, `image`). **Ne pas éditer ces champs à la main** — lancer `npm run update-images` après tout ajout d'image. `components/ThumbhashImage.vue` (copié de mariaclaracastioni) affiche le placeholder thumbhash puis l'image responsive via `NuxtPicture`.

- **`components/ArtisteCard.vue`** — la carte « VAL-VERSO » du Figma : 323 × 437 px dans les deux gabarits (seul bloc du design qui ne s'interpole pas), recto photo + nom incrusté, verso en texte, pivot 3D entre les deux. Ses valeurs sont centralisées dans `assets/css/tokens.css` (`--card-*`, `--glow-card*`). Le carrousel de photos, lui, n'est pas dessiné dans le Figma : les points visibles sur la maquette appartiennent aux captures d'écran collées par le designer.

- **Provider d'images env-driven** (`nuxt.config.ts`) : IPX (sharp au build) par défaut ; `NUXT_IMAGE_PROVIDER=cloudflare` en prod Cloudflare pour transformer à la volée via `/cdn-cgi/image/`.

- **Déploiements.**
  - Infomaniak (seul déploiement) : `.github/workflows/deploy-infomaniak.yml`, déclenché par `dev` — `npm run generate` puis rsync de `.output/public` via SSH vers l'hébergement mutualisé Infomaniak (secrets `INFOMANIAK_*` dans GitHub ; le job se saute tant qu'ils manquent). En production sur `faiscommecheztoi.ch` depuis la bascule d'août 2026 — le domaine a été repointé dans le Manager du dossier WordPress vers ce dossier (rollback = repointer l'ancien dossier tant qu'il existe). Servi à la racine, provider d'images IPX (build-time) — ne pas mettre `NUXT_IMAGE_PROVIDER=cloudflare`. `public/.htaccess` porte les 301 depuis les anciennes URLs WordPress.
  - Cloudflare Workers (alternative, non utilisée) : `wrangler.jsonc` sert `.output/public` en static assets.

- **CMS.** `public/admin/` : Sveltia CMS, backend GitHub sur la branche `dev`, OAuth via le worker `sveltia-cms-auth` (le repo doit être autorisé dans le worker). Les images uploadées vont dans `public/uploads/`. L'interface s'appuie sur des options Sveltia ≥ 0.186 (`index.html` charge la dernière version depuis unpkg) : les sections de la page sont des `singletons` (accès direct dans la barre latérale), la liste des artistes s'ouvre filtrée sur l'édition courante (`view_filters.default` — **à déplacer chaque année** dans `config.yml`), et l'ordre se change par glisser-déposer (`reorder: {group: year}`, renuméroté édition par édition dans le champ `order`).

## Conventions

- Les images de contenu vivent dans `public/uploads/`.
- Après ajout/changement d'images, toujours lancer `npm run update-images` (ou `npm run generate`).
- Les fichiers `content/partenariats/` et `content/programme/` gardent un préfixe numérique dans leur nom, fixé à la création. C'est le champ `order` du frontmatter qui fait foi pour l'affichage : le réordonnancement par glisser-déposer du CMS réécrit `order` sans renommer les fichiers, le préfixe peut donc diverger — ne pas s'y fier. Pour `programme/`, l'ordre est celui de la première représentation, et le champ `year` décide sous quel onglet de la section Artistes la fiche apparaît.
- Tout tri `queryContent` sur un champ numérique doit passer `$numeric: true` — sinon les valeurs sont comparées comme des chaînes et 10 se retrouve entre 1 et 2.
- Une fiche artiste porte ses portraits dans un `photos:` **à la racine** du frontmatter (liste : la première s'affiche, les suivantes se feuillettent) : `updateImageDimensions.mjs` ne descend pas dans les objets imbriqués, un portrait rangé ailleurs serait ignoré en silence.
- Les réponses brutes des artistes (tableurs, photos originales) vivent dans `formulaires/`, hors dépôt (200 Mo, ignoré par git).

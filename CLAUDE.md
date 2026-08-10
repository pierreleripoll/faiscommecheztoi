# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Site du festival **Fais comme chez toi** — Rencontres des artistes émergent·es valaisan·nes (Le Spot, Sion). One-pager **Nuxt 3 statique** piloté par le contenu : les sections sont des fichiers Markdown dans `content/`, éditables via Sveltia CMS (`/admin`). Architecture reprise de `pierreleripoll/mariaclaracastioni` (branche `staging`).

Design : maquette Figma de Siméon Dubuis (rose `#ffbfff`, magenta `#f414ec`, sans arrondie). Les tokens sont centralisés dans `assets/css/tokens.css` — c'est le point unique de re-skin.

## Commands

```bash
npm run dev            # serveur de dev sur 0.0.0.0:3000
npm run generate       # updateImageDimensions + nuxt generate (prerender statique) — build canonique
npm run update-images  # régénère width/height/ratio/thumbhash dans les frontmatters
npm run preview        # prévisualise un build
```

Pas de tests ni de linter configurés.

## Architecture

- **One-pager.** `pages/index.vue` assemble les sections en interrogeant `content/` via `queryContent` : hero (`hero.md`), nuage « Appel à projet » (`appel.md`, fermable, état partagé `useState`), Artistes par année (`artistes/<year>.md`, affiches + crédit, filtre par année), Infos (`infos.md`), Partenariats (`partenariats/*.md`, triés par `order`), Participer (`participer.md`), Contact & Team (`team.md`), Soutiens (`soutiens.md`, liste de logos). La nav sticky (`components/SiteNav.vue`) pointe sur les ancres de section.

- **Images.** `scripts/updateImageDimensions.mjs` parcourt tout `content/` et complète les champs machine (`width`, `height`, `ratio`, `thumbhash`) de toute entrée d'image (`images[]`, `posters[]`, `logos[]`, `photo`, `image`). **Ne pas éditer ces champs à la main** — lancer `npm run update-images` après tout ajout d'image. `components/ThumbhashImage.vue` (copié de mariaclaracastioni) affiche le placeholder thumbhash puis l'image responsive via `NuxtPicture`.

- **Provider d'images env-driven** (`nuxt.config.ts`) : IPX (sharp au build) par défaut ; `NUXT_IMAGE_PROVIDER=cloudflare` en prod Cloudflare pour transformer à la volée via `/cdn-cgi/image/`.

- **Déploiements.**
  - GitHub Pages (préview) : `.github/workflows/deploy-pages.yml`, déclenché par `dev` — build avec `NUXT_APP_BASE_URL=/faiscommecheztoi/` → https://pierreleripoll.github.io/faiscommecheztoi/
  - Cloudflare Workers (prod, plus tard) : `wrangler.jsonc` sert `.output/public` en static assets.

- **CMS.** `public/admin/` : Sveltia CMS, backend GitHub sur la branche `dev`, OAuth via le worker `sveltia-cms-auth` (le repo doit être autorisé dans le worker). Les images uploadées vont dans `public/uploads/`.

## Conventions

- Les images de contenu vivent dans `public/uploads/`.
- Après ajout/changement d'images, toujours lancer `npm run update-images` (ou `npm run generate`).
- Les fichiers `content/partenariats/` gardent leur préfixe numérique (ordre d'affichage, doublé par le champ `order`).

# Fais comme chez toi

Site du festival **Fais comme chez toi** — Rencontres des artistes émergent·es valaisan·nes, au [Spot](https://spot-sion.ch) à Sion.

One-pager statique [Nuxt 3](https://nuxt.com) + [@nuxt/content](https://content.nuxt.com), design de Siméon Dubuis, contenu éditable via [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (`/admin`). Architecture reprise du site [mariaclaracastioni](https://github.com/pierreleripoll/mariaclaracastioni).

## Développement

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # build statique complet dans .output/public
```

## Déploiements

- **Préview (GitHub Pages)** : chaque push sur `dev` déclenche [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) → <https://pierreleripoll.github.io/faiscommecheztoi/>
- **Production (Cloudflare Workers)** : `npm run generate && npx wrangler deploy` (voir `wrangler.jsonc`)

## Contenu

Le contenu vit dans `content/` (une section = un fichier / dossier). Après tout ajout d'image dans un frontmatter : `npm run update-images` (fait automatiquement par `npm run generate`).

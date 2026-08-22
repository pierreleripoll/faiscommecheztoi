# Fais comme chez toi

Site du festival **Fais comme chez toi** — Rencontres des artistes émergent·es valaisan·nes, au [Spot](https://spot-sion.ch) à Sion.

One-pager statique [Nuxt 3](https://nuxt.com) + [@nuxt/content](https://content.nuxt.com), design de Siméon Dubuis, contenu éditable via [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (`/admin`). Architecture reprise du site [mariaclaracastioni](https://github.com/pierreleripoll/mariaclaracastioni).

## Développement

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # build statique complet dans .output/public
```

## Déploiement

**Infomaniak (hébergement mutualisé)** — chaque push sur `dev` déclenche [`deploy-infomaniak.yml`](.github/workflows/deploy-infomaniak.yml) : `npm run generate` puis `rsync` de `.output/public` via SSH. Le job se saute tant que les secrets `INFOMANIAK_*` ne sont pas définis dans GitHub.

Cible actuelle : le site de staging <https://nouveau.faiscommecheztoi.ch>. La bascule se fera dans le Manager Infomaniak en repointant `faiscommecheztoi.ch` vers ce dossier (rollback = repointer le dossier WordPress). `public/.htaccess` porte les 301 depuis les anciennes URLs WordPress.

`wrangler.jsonc` garde une alternative Cloudflare Workers, non utilisée.

## Contenu

Le contenu vit dans `content/` (une section = un fichier / dossier). Après tout ajout d'image dans un frontmatter : `npm run update-images` (fait automatiquement par `npm run generate`).

## Admin (CMS)

<https://nouveau.faiscommecheztoi.ch/admin/> — Sveltia CMS écrit directement dans ce dépôt : chaque enregistrement est un commit sur `dev`, qui déclenche le déploiement. Une modification est donc en ligne 2–3 minutes plus tard.

Le guide destiné à l'équipe du festival : [`docs/tutoriel-admin.md`](docs/tutoriel-admin.md).

### Donner l'accès à quelqu'un

L'authentification passe par **GitHub** — c'est le dépôt qui fait autorité sur le contenu, il n'y a pas d'autre trousseau de comptes (le compte Infomaniak ne sert qu'à l'hébergement des fichiers construits, pas à l'édition).

1. La personne crée un compte GitHub gratuit (e-mail + mot de passe).
2. GitHub → repo → *Settings* → *Collaborators* → **Add people**, rôle **Write**.
3. Elle accepte l'invitation reçue par mail, puis se connecte sur `/admin`.

### Le worker OAuth

`base_url` dans [`public/admin/config.yml`](public/admin/config.yml) pointe sur le worker Cloudflare [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth), qui détient l'app GitHub OAuth. Il refuse toute origine absente de sa variable **`ALLOWED_DOMAINS`** (Cloudflare → Workers & Pages → `sveltia-cms-auth` → *Settings* → *Variables and Secrets*) et l'écran de login affiche alors :

> Votre domaine n'est pas autorisé à utiliser l'authentificateur.

`ALLOWED_DOMAINS` liste les domaines qui servent `/admin`, séparés par des virgules. Le worker est partagé avec d'autres sites : **ajouter** à la valeur existante, ne pas la remplacer —

```
…valeur actuelle…,faiscommecheztoi.ch,nouveau.faiscommecheztoi.ch,localhost
```

(La doc du worker accepte le joker `*` — `*.faiscommecheztoi.ch` couvre les sous-domaines mais pas le domaine nu, donc garder les deux.) Vérifier aussi que l'*Authorization callback URL* de l'app OAuth GitHub est `https://<worker>.workers.dev/callback`.

Dépannage express : le bouton *Se connecter avec un jeton d'accès* de Sveltia contourne le worker avec un [PAT GitHub](https://github.com/settings/tokens) (scope `repo`) — pratique pour débloquer une session, pas pour un usage courant.

### Piste en réserve : se connecter avec le compte Infomaniak

Explorée en août 2026, mise en pause tant que GitHub convient à l'équipe. L'idée : un fork du worker qui authentifie via Infomaniak Connect (l'équipe est membre de l'organisation Infomaniak « Fais comme chez toi », id `458604`), vérifie l'appartenance à l'organisation avec un token API admin (`GET /2/accounts/458604/users`, scope `accounts`), puis renvoie à Sveltia le PAT d'un compte-robot GitHub. Ce qui a été vérifié : l'app Connect (Profil → Applications) n'a que les scopes `openid email profile phone` et ne peut pas interroger `/1/accounts` ; le scope `accounts` doit être coché explicitement sur un token de l'application *API* d'Infomaniak (un token « Unlimited » est refusé) ; lister les membres exige un rôle **admin** dans l'organisation — c'est le prérequis bloquant. Plan B sans admin : liste blanche d'e-mails `@faiscommecheztoi.ch`, qu'Infomaniak Connect vérifie déjà.

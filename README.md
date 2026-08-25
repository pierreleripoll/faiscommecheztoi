# Fais comme chez toi

Site du festival **Fais comme chez toi** — Rencontres des artistes émergent·es valaisan·nes, au [Spot](https://spot-sion.ch) à Sion.

One-pager statique [Nuxt 3](https://nuxt.com) + [@nuxt/content](https://content.nuxt.com), design de Siméon Dubuis, contenu éditable via [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (`nouveau.faiscommecheztoi.ch/admin`). Architecture reprise du site [mariaclaracastioni](https://github.com/pierreleripoll/mariaclaracastioni).

## Développement

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # build statique complet dans .output/public
```

## Déploiement

**Infomaniak (hébergement mutualisé)** — chaque push sur `dev` déclenche [`deploy-infomaniak.yml`](.github/workflows/deploy-infomaniak.yml), qui construit et `rsync` **deux** sites via SSH :

- **`faiscommecheztoi.ch`** (secret `INFOMANIAK_SITE_PATH`) : `npm run generate`, sans le dossier `admin/`.
- **`nouveau.faiscommecheztoi.ch`** (secret `INFOMANIAK_SITE_PATH_NOUVEAU`) : le même build avec `NUXT_PUBLIC_APERCU=1` — il embarque l'admin, le plugin d'aperçu en direct, et se déclare `noindex`. `faiscommecheztoi.ch/admin` y redirige (`.htaccess`).

Le job se saute tant que les secrets `INFOMANIAK_*` ne sont pas définis dans GitHub ; le second déploiement se saute si seul `INFOMANIAK_SITE_PATH_NOUVEAU` manque.

En production sur <https://faiscommecheztoi.ch> depuis la bascule d'août 2026 (le domaine a été repointé dans le Manager Infomaniak du dossier WordPress vers ce dossier ; rollback = repointer l'ancien dossier tant qu'il existe). `public/.htaccess` porte les 301 depuis les anciennes URLs WordPress.

`wrangler.jsonc` garde une alternative Cloudflare Workers, non utilisée.

## Contenu

Le contenu vit dans `content/` (une section = un fichier / dossier). Après tout ajout d'image dans un frontmatter : `npm run update-images` (fait automatiquement par `npm run generate`).

## Admin (CMS)

<https://nouveau.faiscommecheztoi.ch/admin/> — Sveltia CMS écrit directement dans ce dépôt : chaque enregistrement est un commit sur `dev`, qui déclenche le déploiement. Une modification est donc en ligne 2–3 minutes plus tard.

**Aperçu en direct.** Le volet de droite de l'éditeur est le vrai site, mis à jour à chaque frappe, avant même d'enregistrer. Trois pièces : [`public/admin/apercu.js`](public/admin/apercu.js) enregistre un *preview template* Sveltia qui n'est qu'une iframe sur `/?apercu#apercu` et lui envoie le formulaire par `postMessage` ; [`apercu/plugin.client.js`](apercu/plugin.client.js) (embarqué seulement si `NUXT_PUBLIC_APERCU=1`) reçoit, parse le markdown avec le pipeline MDC du build et pose le document dans une surcharge ; [`composables/useContenu.js`](composables/useContenu.js) remplace `useAsyncData` dans les sections et rend la surcharge quand elle existe. En dev, `npm run dev` suffit : `NUXT_PUBLIC_APERCU=1 npm run dev` puis <http://localhost:3000/admin/>.

L'interface ([`public/admin/config.yml`](public/admin/config.yml)) est organisée autour des éditions : la liste **Artistes** s'ouvre filtrée sur l'édition courante (menu *Filtrer* pour les années passées, vignettes photos, bouton *Réorganiser* pour changer l'ordre par glisser-déposer — renuméroté édition par édition dans le champ `order`, sans renommer les fichiers), **Éditions** porte l'année et les affiches, et chaque section de texte est en accès direct dans la barre latérale (groupe *Fichiers*). Dans les fiches, les listes (photos, affiches, logos, horaires) se réordonnent en glissant la poignée ≡ de chaque ligne — fonctionnalité demandée pour ce site et livrée dans Sveltia le 25.08.2026 ([sveltia-cms#929](https://github.com/sveltia/sveltia-cms/issues/929)) ; sur écran tactile, des flèches la remplacent. Les horaires des fiches passent par un champ maison (`public/admin/horaire.js`) : on tape la date comme elle vient (« 8.10 19h05 ») ou on la choisit au calendrier, le champ l'écrit « Je 08.10, 19:05 » — la seule forme que la grille horaire lit — et refuse à l'enregistrement une date illisible, inexistante ou éloignée des autres soirs de l'édition (référence : `public/admin/horaires.json`, écrit au build). **À chaque nouvelle édition** : créer l'entrée dans Éditions, puis dans `config.yml` ajouter le filtre « Édition &lt;année&gt; » et déplacer `view_filters.default` dessus.

L'aide destinée à l'équipe vit dans l'admin lui-même : le bouton ⓘ en bas à droite ouvre [`public/admin/aide.html`](public/admin/aide.html) (aussi accessible à `/admin/aide.html`) — un aide-mémoire par tâche, dépliable en mode d'emploi complet, captures dans `public/admin/captures/`. Le bouton est posé par `public/admin/index.html` par-dessus Sveltia, sans rien brancher dans le CMS.

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

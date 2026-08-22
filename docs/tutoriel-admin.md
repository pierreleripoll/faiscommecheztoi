# Modifier le site — mode d'emploi

Guide pour l'équipe du festival. Aucune connaissance technique nécessaire : tout se fait dans une page web, depuis n'importe quel ordinateur.

## En deux phrases

Le site n'a plus de « base de données » comme l'ancien WordPress : chaque texte, chaque photo est un fichier, et l'admin est une interface qui édite ces fichiers pour toi. Quand tu enregistres, le site se reconstruit tout seul et la modification est en ligne **2 à 3 minutes plus tard** — inutile de recharger frénétiquement, va boire un café.

## 1. Se connecter

L'admin vit à l'adresse **<https://nouveau.faiscommecheztoi.ch/admin/>** (mettre en favori).

La première fois seulement :

1. Créer un compte gratuit sur <https://github.com> (e-mail + mot de passe, 2 minutes). GitHub est l'endroit où les fichiers du site sont stockés — c'est lui qui sert de « badge d'accès ».
2. Dire à Pierre le nom d'utilisateur choisi : il envoie une invitation sur le dépôt du site, à accepter dans le mail reçu.
3. Retourner sur `/admin` → **Se connecter avec GitHub** → autoriser une fois. C'est fini : ensuite, le navigateur reste connecté.

> Le second bouton, *Se connecter avec un jeton d'accès*, est un dépannage technique. Il n'est pas destiné à l'usage courant.

## 2. Le tour du propriétaire

La colonne de gauche liste tout ce qui est modifiable :

| Rubrique | Ce que c'est |
| --- | --- |
| **Sections de la page** | Les blocs de texte du site : Intro, nuage « Appel à projet », Infos pratiques, Participer, Contact & Team, Soutiens (logos) |
| **Artistes de l'édition** | Une fiche par artiste — c'est ce qui remplit les cartes de la section Artistes |
| **Artistes (par année)** | Les affiches du festival, une entrée par édition |
| **Partenariats** | La Crémaillère, L'entrée en matière, L'Oblique… |

On clique sur une rubrique, puis sur l'entrée à modifier. Le bouton d'enregistrement se trouve en haut de la fiche ouverte. Tant qu'on n'a pas enregistré, rien n'est publié : on peut fermer sans crainte.

## 3. Corriger un texte

Exemple : le titre du spectacle d'une artiste.

1. **Artistes de l'édition** → cliquer sur la ligne de l'artiste (la liste affiche `ordre. Nom — Titre du spectacle`).
2. Corriger le champ **Titre du spectacle**.
3. Enregistrer.

Même principe pour les Infos pratiques, le texte de Participer, les contacts de l'équipe : on ouvre, on écrit, on enregistre.

Dans les zones de texte long (le corps des sections, les biographies), on peut mettre **en gras**, en *italique*, ou poser un lien avec la barre d'outils. Rien d'autre : la mise en page (couleurs, tailles, positions) appartient au design, elle ne se règle pas depuis l'admin.

## 4. Ajouter une fiche artiste

**Artistes de l'édition** → bouton de création → remplir :

| Champ | À quoi il sert |
| --- | --- |
| **Artiste** | Le nom affiché sur la carte. Deux artistes : « Prénom Nom et Prénom Nom » |
| **Ordre** | Position dans la liste. On numérote dans l'ordre de la **première représentation** |
| **Année** | L'édition — `2026` pour l'édition en cours. C'est ce champ qui décide sous quel onglet la fiche apparaît |
| **Titre du spectacle** | |
| **Durée** | Ex. `35’` |
| **Format** | Ex. `étape de travail/work in progress`, `projet abouti/création` |
| **Collaboration** | À remplir seulement si le projet vient d'un partenariat (ex. `Collaboration avec L'Oblique`) |
| **Avec** | Le reste de l'équipe, sans écrire le mot « Avec » |
| **Lieu** | Ex. `Sion, Petithéâtre` |
| **Horaires** | Une ligne par représentation, ex. `Me 07.10, 20:35` |
| **École** | Ex. `École de théâtre Serge Martin, 2024` |
| **Joué aussi ailleurs** | Optionnel — l'autre festival, son lieu et ses horaires |
| **Photos** | Voir ci-dessous |
| **Biographie** | Le texte au dos de la carte |

Les champs vides ne s'affichent tout simplement pas sur le site : mieux vaut laisser vide que d'écrire « — ».

## 5. Photos et logos

Dans le champ **Photos**, chaque entrée = une image + son texte alternatif + son crédit photo. **La première photo de la liste est celle qui s'affiche sur la carte**, les suivantes se feuillettent. Pour changer la photo principale, il suffit de remonter la bonne en première position.

Quelques règles qui font gagner du temps :

- **Portraits verticaux** pour les artistes — les cartes sont en hauteur, une photo panoramique se retrouve rognée.
- Viser **au moins 1000 px de large**, et éviter les fichiers de 10 Mo sortis d'un appareil photo : le site redimensionne, mais l'envoi sera long.
- **Crédit photo** : le remplir systématiquement, il s'affiche sur la fiche.
- **Texte alternatif** : une courte description pour les personnes non-voyantes (souvent, le nom de l'artiste suffit).

Les **logos de soutiens** se gèrent dans *Sections de la page → Soutiens*, avec pour chacun le nom et, si on veut, un lien vers le site de l'institution. Format idéal : PNG à fond transparent.

## 6. Le nuage « Appel à projet »

Dans *Sections de la page → Nuage « Appel à projet »*. La case **Visible** l'affiche ou le masque sur le site — c'est le bouton on/off à utiliser à l'ouverture et à la clôture de l'appel. Le **Texte** est ce qui est écrit dedans, le **Lien** ce sur quoi il pointe (`#participer` renvoie vers la section Participer de la page, une adresse complète `https://…` vers l'extérieur).

## 7. Questions qui reviennent

**J'ai enregistré et je ne vois rien.** Attendre 2–3 minutes, puis recharger la page en vidant le cache (`Ctrl+Shift+R`, ou `Cmd+Shift+R` sur Mac).

**Je peux casser le site ?** Difficilement, et rien n'est perdu : chaque enregistrement est archivé, on peut revenir à n'importe quelle version précédente. En cas de doute, demander plutôt que de bricoler.

**Est-ce que je peux changer les couleurs / déplacer une section ?** Non, et c'est voulu : ça appartient au design de Siméon. Pour ce genre de demande, passer par Pierre.

**Plusieurs personnes en même temps ?** Oui, tant que vous n'éditez pas la même fiche à la même seconde.

**Et l'ancien site WordPress ?** Il reste en ligne jusqu'à la bascule du domaine. Les anciennes adresses (`/les-artistes/`, `/contact/`…) redirigent déjà vers les bonnes sections du nouveau site.

## 8. En cas de pépin

Écrire à Pierre avec : ce que tu essayais de faire, la rubrique concernée, et une capture d'écran du message d'erreur s'il y en a un.

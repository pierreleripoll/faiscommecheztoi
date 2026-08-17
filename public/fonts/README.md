# Police du site

Le design utilise **Vevey**, graisse *Positive* (fichier Figma « FCCT », Siméon Dubuis).
C'est une police sous licence : elle n'est donc pas versionnée ici.

Pour l'activer, déposer dans ce dossier :

```
vevey-positive.woff2
vevey-positive.woff
```

Le `@font-face` correspondant est déjà déclaré dans `assets/css/tokens.css` — rien
d'autre à changer. Tant que les fichiers sont absents, le navigateur retombe
silencieusement sur Quicksand (sans arrondie, self-hébergée via `@fontsource`),
qui approche la forme sans l'égaler.

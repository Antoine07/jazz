# Le labo jazz — harmonie progressive pour saxophone ténor Si♭

**Ouvrir [le parcours](docs/index.html)** dans un navigateur. Le dossier `docs/` contient les pages, les schémas, les styles et les outils audio ; il fonctionne hors ligne, sauf les liens vers les sources.

## Parcours en 13 étapes

1. Ténor Si♭ : notes écrites, sons réels et accompagnement.
2. Notes, intervalles et degrés.
3. Gammes majeure, mineure naturelle, harmonique et mélodique jazz.
4. Accords, harmonisation et arpèges.
5. II–V–I majeurs : accords et notes dans les douze tons écrits.
6. ii–V–i mineurs : demi-diminué, dominante, sensible et accords d’arrivée.
7. Tierces, septièmes, notes guides et premières phrases.
8. Structures : AABA, ABAC, blues, extraits d’Autumn Leaves et de Misty.
9. Body and Soul : A, relative mineure et pont en notation ténor.
10. Rythme : treize exercices progressifs, rondes, blanches, noires, croches, doubles croches, valeurs pointées, silences, liaisons et triolets.
11. Gammes blues majeure et mineure, écoute et application.
12. Cycle des quintes, cadences majeures et mineures, transposition.
13. Projet AABA, QCM et révision.

Le cours propose 47 exercices avec indices et corrections, un QCM de 10 questions et une étude originale AABA de 32 mesures. Chaque chapitre précise les acquis à vérifier. Le projet conserve le même carnet et la même grille au fil des étapes.

## Convention instrumentale

Toutes les notes et tous les accords de travail sont **écrits pour le saxophone ténor en Si♭**. Les correspondances concert sont signalées séparément. Instrument en Si♭ ne signifie pas tonalité unique de Si♭ : le parcours travaille les douze tons.

Le ténor sonne une neuvième majeure sous la note écrite. Les lecteurs de gammes et de cadences appliquent cette transposition (−14 demi-tons). Les schémas de clavier repèrent les notes écrites ; ils ne représentent pas les touches à jouer au piano pour accompagner.

Body and Soul est étudié en Mi♭ majeur écrit, correspondant à Ré♭ concert. La réduction de huit mesures sert au travail de A. La grille AABA originale de 32 mesures du chapitre Structure est une composition pédagogique distincte du standard.

## Consultation et construction

Aucune dépendance à installer. Python 3 et Node.js servent aux commandes suivantes :

```sh
npm run preview
```

Ouvrir <http://localhost:8090>.

```sh
npm run build
npm run check
```

`scripts/build.py` collecte les contenus, `scripts/progression.py` organise le parcours et `scripts/music_theory.py` produit les références de notes. `scripts/rhythm_course.py` définit les exemples rythmiques, leurs figures et leurs durées exactes. Les pages sont générées dans `docs/`, puis copiées dans `dist/` pour publication. Les styles, interactions et aperçus des partitions restent dans `docs/assets/`.

Les vérifications portent sur les liens et ancres, les conventions de notation, les notes des gammes et accords, les 32 mesures de l’étude, les durées rythmiques, les silences, les liaisons et la transposition audio. Elles ne remplacent pas une écoute ni une vérification visuelle dans un navigateur.

## Sources

Voir les [références du cours](docs/pratique.html#sources). Les images originales restent dans `images/`. Les aperçus PNG du cours sont des conversions de leurs images de prévisualisation.

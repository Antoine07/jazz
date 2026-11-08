# Le labo jazz — Body and Soul

Cours progressif d’harmonie jazz, inspiré de l’organisation du site « Le labo maths » fourni.

**Ouvrir [le cours](docs/index.html)** dans un navigateur. Le dossier `docs/` est autonome et fonctionne hors ligne, hors liens vers les sources.

- Harmonie, accords, II–V–I, notes guides et forme AABA.
- Étude des extraits lisibles de votre partition de Body and Soul.
- Triolets de noires et liaisons d’après `images/rythme.png`, lecteur et variations.
- Gammes blues majeures et mineures : notes, clavier et écoute dans douze tonalités.
- Cycle des quintes interactif, gammes, armures et cadences.
- 17 exercices progressifs avec indices et corrections, QCM de 8 questions et projet fil rouge.
- Mode présentation, impression / PDF, progression enregistrée dans le navigateur.

## Consulter avec un serveur local

```sh
npm run preview
```

Puis ouvrir <http://localhost:8090>. Aucune installation de dépendances n’est nécessaire. Python 3 et Node.js sont requis pour les commandes de construction et de vérification.

## Construire et vérifier

```sh
npm run build
npm run check
```

`scripts/build.py` génère les pages dans `docs/` et leur copie de publication dans `dist/`. Les styles et les interactions sont conservés dans `docs/assets/`. Les photos originales restent dans `images/` ; les aperçus PNG présents dans le cours proviennent de leur image de prévisualisation.

## Conventions instrumentales

La photo de Body and Soul est notée en Mi♭. Le cours distingue cette notation de la version habituelle en Ré♭ concert. Si cette photo est bien une partie de saxophone ténor Si♭, les deux correspondent ; l’édition reste à confirmer. Les outils de gammes et du cycle ne transposent pas automatiquement pour un instrument.

L’audio doit être démarré par un clic. Le métronome indique le tempo à la noire ; une mesure de décompte précède chaque boucle. Le modèle de swing 2:1 est un exercice, et les triolets de noires ne doivent pas être confondus avec des triolets de croches.

Les sources musicales sont liées dans [Exercices et ressources](docs/pratique.html#sources).

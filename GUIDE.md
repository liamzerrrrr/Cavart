# CAVART — Notice d'administration

Ce site est composé de fichiers HTML simples. Aucun logiciel à installer,
aucune base de données. Pour modifier une page, on ouvre son fichier dans
un éditeur de texte, on change le texte, on enregistre, on renvoie le
fichier sur l'hébergement.

---

## 1. Mettre le site en ligne

Déposez **tout le contenu du dossier** sur votre hébergement, en conservant
la structure des sous-dossiers. Le site fonctionne chez n'importe quel
hébergeur de pages statiques (OVH, o2switch, Netlify, Vercel, un simple
accès FTP…). Aucune configuration particulière.

**Important** : le site ne fonctionne pas en double-cliquant sur
`index.html` depuis votre ordinateur. Le navigateur bloque alors le
chargement des modèles 3D. Pour un essai en local, ouvrez un terminal dans
le dossier et lancez :

    python3 -m http.server 8000

puis rendez-vous sur `http://localhost:8000`.

---

## 2. Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil, avec la séquence 3D au défilement |
| `artiste.html` | L'Artiste |
| `oeuvres.html` | Grille des œuvres |
| `oeuvre-sneaker-or.html` | Gabarit de page immersive d'une œuvre iconique |
| `collaborations.html` | Collaborations |
| `expositions.html` | Expositions |
| `lab.html` | Cavart Lab |
| `contact.html` | Contact |
| `mentions-legales.html` | Mentions légales |
| `confidentialite.html` | Confidentialité |
| `assets/style.css` | Mise en forme de **toutes** les pages |
| `assets/site.js` | Menu, formulaire, animations d'apparition |
| `assets/hero.js` | Défilement de la séquence d'ouverture |
| `assets/scene.js` | Moteur 3D |
| `crampon-1.glb`, `crampon-2.glb` | Modèles 3D |
| `images/`, `videos/` | Vos photos et vidéos |

Ne modifiez `assets/style.css` que si vous voulez changer le design
général : ce fichier agit sur toutes les pages à la fois.

---

## 3. Ajouter vos photos

Chaque emplacement d'image attend un **nom de fichier précis**. Tant que le
fichier est absent, l'emplacement affiche un cadre sombre avec le nom
attendu écrit en petit dans le coin. Déposez le fichier au bon endroit avec
le bon nom : l'image apparaît, sans aucune modification du code.

### Fichiers attendus

**Portraits** — dossier `images/artiste/`
- `julian-portrait.jpg`
- `julian-atelier.jpg`

**Œuvres** — dossier `images/oeuvres/`
- `sneaker-or.jpg`
- `sneaker-or-detail-1.jpg`
- `sneaker-or-detail-2.jpg`
- `sneaker-or-situation.jpg`
- `icone-parquet.jpg`
- `mocassin-noir.jpg`
- `silhouette-blanche.jpg`
- `etude-semelle.jpg`
- `piece-atelier.jpg`

**Collaborations** — dossier `images/collaborations/`
- `collab-01.jpg` à `collab-04.jpg`

**Expositions** — dossier `images/expositions/`
- `expo-en-cours.jpg`

**Cavart Lab** — dossier `images/lab/` (images d'attente des vidéos)
- `lab-01.jpg` à `lab-04.jpg`

**Vidéos** — dossier `videos/`
- `lab-01.mp4` à `lab-04.mp4`

### Conseils de format

- **Format** : JPG pour les photos. Évitez le PNG, beaucoup plus lourd.
- **Largeur** : 2400 px pour les grandes images, 1600 px pour les vignettes.
  Au-delà, le gain est invisible et le site ralentit.
- **Poids** : visez moins de 400 Ko par image. Un outil comme Squoosh ou
  TinyJPG fait cela en quelques secondes.
- Les images téléchargées depuis Instagram font 1080 px de large. C'est
  juste pour un affichage plein écran sur ordinateur — préférez les
  fichiers d'origine quand vous les avez.

---

## 4. Ajouter une œuvre

Ouvrez `oeuvres.html`, trouvez un bloc commençant par :

```html
<!-- ŒUVRE — dupliquez ce bloc pour en ajouter une -->
```

Copiez tout le bloc jusqu'à la balise `</a>` qui le referme, collez-le à la
suite, puis modifiez :

- le nom du fichier image, **aux deux endroits** où il apparaît
  (`data-label` et `src`) ;
- le texte alternatif de l'image (`alt`), qui décrit la photo pour Google
  et pour les personnes malvoyantes ;
- l'étiquette (`<span class="tag">`) : « Œuvre iconique » ou « Sculpture » ;
- le titre (`<h3>`) et le texte de présentation (`<p>`).

Pour qu'une œuvre occupe une case plus large, ajoutez `is-wide` à la suite
de `card` et `style="grid-column:span 2"` sur la balise `<a>`.

---

## 5. Ajouter une page immersive d'œuvre

Dupliquez le fichier `oeuvre-sneaker-or.html`, renommez-le (par exemple
`oeuvre-icone-parquet.html`), puis modifiez le titre, le récit et les
images. Reliez-le ensuite depuis `oeuvres.html` en changeant l'adresse dans
`href="..."` de la carte correspondante.

Les lignes Collection, Matériaux et Contexte sont **facultatives** :
supprimez celles qui n'apportent rien au récit de l'œuvre.

---

## 6. Ajouter une collaboration

Même principe, dans `collaborations.html` :

```html
<!-- COLLABORATION — dupliquez ce bloc pour en ajouter une -->
```

Employez les mots « collaboration », « partenaire » ou « projet officiel »
uniquement lorsque la réalité contractuelle le permet. Une remise d'œuvre
ou une photo avec une personnalité se présente de façon factuelle.

---

## 7. Ajouter une exposition

Dans `expositions.html` :

```html
<!-- EXPOSITION — dupliquez ce bloc. data-state : now, next ou past -->
```

L'attribut `data-state` commande le classement dans les filtres :

- `now` — exposition en cours
- `next` — exposition à venir
- `past` — exposition passée, archivée

Quand une exposition se termine, il suffit de passer son `data-state` de
`now` à `past`. Ne la supprimez pas : les expositions passées font partie
du parcours.

---

## 8. Ajouter une vidéo au Lab

Dans `lab.html`, dupliquez un bloc :

```html
<!-- VIDÉO — déposez le fichier .mp4 et l'image d'attente (poster) -->
```

Déposez la vidéo dans `videos/` et son image d'attente dans `images/lab/`.
Les vidéos démarrent toujours **sans son** : c'est le visiteur qui l'active.

Compressez les vidéos avant de les mettre en ligne — visez moins de 10 Mo
par vidéo, sinon le site devient lent sur mobile.

---

## 9. Le formulaire de contact

En l'état, le formulaire ouvre la messagerie du visiteur avec le message
pré-rempli. Cela fonctionne, mais dépend du logiciel de messagerie
installé chez lui.

Pour un envoi direct dans votre boîte mail, créez un compte chez un service
de formulaire (Formspree, Web3Forms, Basin…), récupérez l'adresse qu'il
vous donne, puis renseignez-la dans `index.html` et `contact.html` :

```html
<form data-contact data-endpoint="https://adresse-fournie-par-le-service">
```

Pour changer l'adresse email de destination, modifiez `data-mailto` sur les
mêmes balises, ainsi que les adresses affichées dans les pages.

---

## 10. Ajouter un modèle 3D

Déposez le fichier `.glb` à la racine du site, puis ouvrez
`assets/scene.js` et ajoutez son chemin en tête de fichier :

```js
const MODEL_URLS = [
  './crampon-1.glb',
  './crampon-2.glb',
  './crampon-3.glb'
];
```

La répartition sur les quatre étapes du défilement et les transitions se
règlent automatiquement.

Les fichiers `.glb` volumineux ralentissent beaucoup le site. Au-delà de
3 Mo, faites-les compresser avant de les mettre en ligne.

---

## 11. Ce qui reste à compléter

- **Mentions légales** : raison sociale, adresse du siège, numéro
  d'immatriculation, coordonnées de l'hébergeur.
- **Crédits photographiques** : noms des photographes.
- **Textes des œuvres, collaborations et expositions** : les contenus
  actuels sont des exemples de mise en page, à remplacer par les
  informations validées.
- **Modèles 3D** : les deux modèles fournis proviennent de Sketchfab, sous
  licence CC BY 4.0, et portent un logo de marque visible. Une mention
  d'attribution figure en pied de page d'accueil, obligatoire tant qu'ils
  sont utilisés. Remplacez-les par des sculptures Cavart et supprimez cette
  mention en même temps.

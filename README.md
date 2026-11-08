# Portfolio « plage »

Portfolio personnel clair, lisible et soigné : thème sable / océan turquoise / corail, grille propre par défaut, **décor 3D optionnel** (océan WebGL sur l'accueil, bouton « Explorer en 3D »), et une **administration sécurisée** pour gérer tout le contenu sans toucher au code.

**Stack :** Nuxt 4 · TypeScript strict · Vue 3 · Tailwind CSS 4 · shadcn-vue (reka-ui) · Neon PostgreSQL + Drizzle ORM · Cloudinary · Three.js · GSAP/ScrollTrigger · Nodemailer · pnpm.

---

## Sommaire

1. [Ce que contient le projet](#1-ce-que-contient-le-projet)
2. [Prérequis](#2-prérequis)
3. [Installation et premier lancement](#3-installation-et-premier-lancement)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Neon (base de données)](#5-neon-base-de-données)
6. [Cloudinary (images)](#6-cloudinary-images)
7. [E-mail et WhatsApp](#7-e-mail-et-whatsapp)
8. [Utiliser l'administration](#8-utiliser-ladministration)
9. [Sécurité](#9-sécurité)
10. [Décor 3D, accessibilité, performances](#10-décor-3d-accessibilité-performances)
11. [Commandes disponibles](#11-commandes-disponibles)
12. [Vérification et tests](#12-vérification-et-tests)
13. [Déploiement](#13-déploiement)
14. [Limites et opérations manuelles](#14-limites-et-opérations-manuelles)
15. [Licences des composants](#15-licences-des-composants)

---

## 1. Ce que contient le projet

**Site public**
- Accueil résumé (océan 3D animé, relié au défilement) ; pages dédiées `/a-propos`, `/projets`, `/competences`, `/parcours`, `/contact` et `/confidentialite`.
- Chaque projet a sa page partageable `/projets/:slug`, avec SEO, métadonnées Open Graph et entrée au sitemap.
- Menu de 5 à 6 entrées maximum ; les réglages d'affichage (animations) sont rangés à part.
- Fiches détaillées pour chaque élément.
- **Explorer en 3D** (compétences = bouées, projets = bouteilles à la mer) : plein écran, sans les textes de la page, navigable à la souris, au doigt et au clavier.
- Responsive réel (testé en 390 px et 1440 px, aucun débordement horizontal), focus clavier visible, lien « Passer au contenu », `prefers-reduced-motion` respecté, repli complet si WebGL est indisponible.
- SEO : balises Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, option « ne pas indexer ».

**Administration** (`/admin`)
- Tableau de bord, CRUD complet : projets, compétences, expériences, formations, certifications, réalisations.
- **Catégories gérables** (listes déroulantes partout, création à la volée, renommage en cascade).
- **Icônes par technologie** : 279 icônes de marques (Simple Icons, CC0), icônes génériques (Lucide) ou vos propres images ; facultatives, avec proposition automatique d'après le nom.
- **Formulaire de projet guidé** : sections repliables, icônes de technologies visibles pendant la saisie, aperçu avant publication et champs dédiés au rôle personnel et aux résultats de l’étude de cas.
- **Actions en masse** (publier, masquer, mettre en avant, changer de catégorie, supprimer), **ajout rapide** (une ligne = un élément), **import/export CSV et JSON** avec vérification ligne par ligne avant création.
- **Import de CV** (PDF, DOCX, TXT, ou texte collé) : lecture automatique, relecture obligatoire avant tout import.
- Apparence (palettes + aperçu en direct + contrôle des contrastes), affichage et menu, **textes de l'interface** (66 libellés modifiables), SEO et page de confidentialité, réglages du décor 3D, contact (e-mail, WhatsApp, consentement), messages reçus.
- Sécurité : double authentification TOTP, codes de récupération à usage unique, changement de mot de passe, expiration et révocation des sessions.
- Gouvernance : rôle super-admin, création de comptes et permissions par espace (lecture/gestion), vérifiées par l'API.

---

## 2. Prérequis

- **Node.js ≥ 22.12** (fichier `.node-version` fourni)
- **pnpm 12** (`corepack enable` ou `npm i -g pnpm`)
- Un compte **Neon** (gratuit suffit) — facultatif pour tester : sans base, le site s'affiche en *mode démonstration*.
- Un compte **Cloudinary** (téléversement d'images) — facultatif au démarrage.
- Un compte e-mail **SMTP** (formulaire de contact) — facultatif au démarrage.

---

## 3. Installation et premier lancement

```bash
pnpm install
cp .env.example .env          # Windows PowerShell : Copy-Item .env.example .env
# renseignez DATABASE_URL, NUXT_SESSION_PASSWORD et NUXT_SUPERADMIN_OWNER_EMAIL (voir §4)
pnpm check:env                # vérifie la configuration sans rien afficher de secret
pnpm db:migrate               # applique les migrations (14 tables)
# ADMIN_EMAIL doit correspondre à NUXT_SUPERADMIN_OWNER_EMAIL
ADMIN_EMAIL=vous@exemple.com ADMIN_PASSWORD='un-mot-de-passe-long-et-unique' pnpm admin:create
pnpm db:seed:demo             # (facultatif) contenu d'exemple, marqué « démo »
pnpm dev                      # http://localhost:3000   ·   administration : /admin
```

Sous Windows PowerShell, définissez les variables ainsi : `$env:ADMIN_EMAIL='vous@exemple.com'; $env:ADMIN_PASSWORD='…'; pnpm admin:create`.

- **Aucun mot de passe administrateur par défaut n'existe.** Le premier compte créé par cette commande devient super administrateur (accès au serveur requis). Mot de passe : 12 caractères minimum.
- Pour supprimer les données de démonstration : `pnpm db:purge:demo`.
- Sans `DATABASE_URL`, le site fonctionne en mode démonstration et l'administration affiche un message clair.
- En production, connectez-vous puis activez TOTP dans *Sécurité* avant toute autre action. Conservez les codes de récupération hors du site.

---

## 4. Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | Chaîne de connexion Neon (« Pooled connection »). |
| `NUXT_SESSION_PASSWORD` | oui | Secret d'au moins 32 caractères (`openssl rand -base64 48`). Signe les sessions et le jeton CSRF ; sert aussi à chiffrer le secret de double authentification. **Le changer déconnecte tout le monde et invalide les codes 2FA enregistrés** (voir `pnpm admin:reset-2fa`). |
| `NUXT_SUPERADMIN_OWNER_EMAIL` | oui pour la gestion des comptes | Adresse du propriétaire super administrateur ; seul ce compte peut créer des comptes ou nommer d'autres super administrateurs. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` | pour les images | Console Cloudinary > API Keys. |
| `CLOUDINARY_API_SECRET` | pour les images | **Secret** : jamais exposé au navigateur ni préfixé `NUXT_PUBLIC_`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | pour l'e-mail | Envoi des messages du formulaire. |
| `NUXT_PUBLIC_SITE_URL` | recommandé | URL publique (liens absolus, Open Graph, sitemap). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | scripts uniquement | Création du premier administrateur ; à retirer ensuite. |

Aucun secret n'est livré dans l'archive. `.env` est ignoré par Git.

---

## 5. Neon (base de données)

1. Créez un projet sur <https://neon.tech>.
2. *Dashboard > votre projet > Connect* : copiez la chaîne **Pooled connection** dans `DATABASE_URL`.
3. `pnpm db:migrate` applique les migrations versionnées (14 tables, dont comptes, sessions, codes de récupération et journal d’audit).
4. Après une modification du schéma (`server/db/schema.ts`) : `pnpm db:generate` puis `pnpm db:migrate`.

Le navigateur ne se connecte jamais à la base : tout passe par l'API serveur.

---

## 6. Cloudinary (images)

- Téléversement **signé** : le serveur signe chaque envoi dans `portfolio-plage/<type>` (par exemple `portfolio-plage/projects` ; formats `jpg/png/webp/avif/gif/svg`) ; le secret reste côté serveur. Les anciens identifiants `portfolio/...` restent supprimables pour éviter les fichiers orphelins.
- Les URL et identifiants publics sont stockés en base ; les images sont servies optimisées (`f_auto`, `q_auto`, redimensionnement).
- À la suppression d'une fiche ou au remplacement d'une image, l'ancienne image est supprimée **sauf si elle est utilisée ailleurs**.
- Si Cloudinary n'est pas configuré, les téléversements renvoient un message clair (503) ; le reste fonctionne.

---

## 7. E-mail et WhatsApp

- Canaux réglables dans *Canaux et e-mail* : **e-mail**, **WhatsApp**, **les deux**, ou **aucun formulaire** (liens seulement).
- Le formulaire est validé côté serveur, protégé par un champ piège, un délai minimal, une limitation de fréquence et contre l'injection d'en-têtes.
- Le serveur **ne renvoie jamais un faux succès** : si SMTP n'est pas configuré ou échoue, le visiteur en est informé.
- **WhatsApp** : lien `wa.me` avec texte prérempli. Le visiteur doit confirmer l'envoi lui-même dans WhatsApp : le site n'affirme jamais qu'un message a été envoyé automatiquement.
- Modèles d'e-mail : seules les variables `{name}`, `{email}`, `{phone}`, `{subject}`, `{message}`, `{siteName}` sont remplacées ; aucun code n'est exécuté.
- Consentement (case à cocher) et mention sur la conservation des données configurables ; les messages plus anciens que la durée choisie (180 jours par défaut ; 0 = illimité) sont supprimés à chaque nouveau message reçu, ou à la demande / en tâche planifiée avec `pnpm db:purge:messages`.

---

## 8. Utiliser l'administration

### Comptes et permissions

Le premier compte est le super administrateur propriétaire ; son adresse doit correspondre à `NUXT_SUPERADMIN_OWNER_EMAIL`. La commande de provisionnement ne crée que ce compte. Pour faciliter son initialisation, le propriétaire peut choisir un mot de passe d’au moins 10 caractères, avec au moins deux types de caractères et sans motif prévisible ; les autres comptes restent soumis à 12 caractères minimum. Depuis *Comptes et accès*, seul ce propriétaire peut créer des administrateurs, éditeurs ou super administrateurs. Les autres super administrateurs peuvent gérer les accès existants, mais ne peuvent pas créer/promouvoir d'autres super administrateurs ni modifier ou supprimer le compte propriétaire. La sécurité de son propre compte reste accessible à chaque admin/éditeur. Toute modification d’accès révoque les sessions de la personne concernée ; le dernier super administrateur ne peut pas être supprimé ou rétrogradé.

La 2FA TOTP est obligatoire en production. L’activation exige le mot de passe courant et la validation d’un code. Les codes de récupération ne sont affichés qu’une fois et ne peuvent servir qu’une fois chacun.

| Besoin | Où |
|---|---|
| Ajouter plusieurs compétences d'un coup | *Compétences > Ajout rapide* (`TypeScript ; Interface` par ligne ; l'icône est ajoutée automatiquement si la technologie est connue) |
| Importer/exporter | *Importer / exporter* : CSV (séparateur `;`, UTF-8) ou JSON ; bouton **Vérifier** avant **Importer** ; modèle CSV téléchargeable |
| Agir sur plusieurs éléments | Cases à cocher > barre d'actions (publier, masquer, mettre en avant, catégorie, supprimer) |
| Gérer les catégories | *Catégories* (renommer met à jour toutes les fiches ; supprimer détache sans effacer) |
| Choisir une icône | Champ « Icône » : *Technologies* (recherche), *Génériques*, *Personnalisée* (image) — ou aucune |
| Importer un CV | *Import de CV* : déposer le fichier, relire/corriger chaque bloc, cocher ce qui est importé |
| Changer les couleurs | *Apparence* : palettes prédéfinies, saisie hexadécimale, aperçu 3D en direct, contrôle des contrastes |
| Masquer/ordonner les sections | *Affichage et menu* |
| Ordre chronologique | *Affichage et menu > Ordre de la frise* : « Par date » (défaut, le plus récent d'abord) ou « Ordre manuel » |
| Masquer une catégorie de réalisations (ex. « Langue ») | *Affichage et menu > Onglets du parcours* |
| Modifier un texte du site | *Textes de l'interface* (boutons, filtres, messages…) et *Textes et liens* |
| Image de partage, indexation, confidentialité | *SEO et confidentialité* |

Un projet en **brouillon** n'apparaît jamais publiquement. L'aperçu administrateur (`/?preview=1`, lien « Aperçu du site ») montre brouillons et éléments masqués, signalés comme tels.

Le plan d’audit, les décisions et les tâches de déploiement sont détaillés dans [docs/REVUE-ET-PLAN.md](./docs/REVUE-ET-PLAN.md).

**Import de CV : limites.** L'analyse est une heuristique locale (aucune IA externe, aucune donnée envoyée à un tiers). Elle fonctionne bien sur des CV classiques à rubriques, moins sur des mises en page très graphiques. Les PDF scannés (images) ne contiennent pas de texte lisible : collez le texte à la place. Tout est proposé, rien n'est enregistré avant votre validation ; les entrées incomplètes sont signalées « à vérifier ».

---

## 9. Sécurité

- Mots de passe hachés avec **scrypt** (sel aléatoire, comparaison en temps constant).
- Sessions : cookies `HttpOnly`, `SameSite`, `Secure` en HTTPS ; sessions stockées en base et révocables.
- **CSRF** : jeton obligatoire + contrôle de l'origine sur toute requête modifiante.
- **Double authentification (TOTP)** : obligatoire en production ; activation et désactivation exigent le mot de passe et un code actuel. Les codes de récupération sont à usage unique et seuls leurs HMAC sont stockés. Secours serveur : `pnpm admin:reset-2fa -- vous@exemple.com`.
- **Comptes délégués** : un super administrateur attribue par module la lecture ou la gestion. Les autorisations sont revérifiées par l’API ; toute modification révoque les sessions. Le dernier super-admin est protégé.
- **Sessions** : expiration après une heure d’inactivité, ou sept jours au total.
- **Journal d’audit** : connexions et opérations de gouvernance/sécurité, sans secret, conservées au maximum 365 jours.
- **Verrouillage sans effet pervers** : plafonds par IP, par couple IP + e-mail, et par compte ; ce dernier ne s'applique pas à votre **appareil de confiance** (cookie signé posé après connexion), de sorte qu'un tiers qui connaît votre e-mail ne peut pas vous empêcher de vous connecter.
- Toutes les routes `/api/admin/*` vérifient la session côté serveur ; validation Zod partout ; erreurs structurées sans trace interne.
- Les réglages 3D sont bornés ; aucun code ni shader ne peut être envoyé depuis l'administration. Les URL sont limitées à `http(s)`.

---

## 10. Décor 3D, accessibilité, performances

- **Un seul moteur 3D** (`app/scene/ocean/`) : océan en shader GLSL (vagues, reflets du soleil, écume), ciel, soleil, voilier ; bouées et bouteilles en mode exploration. Couleurs liées au thème, donc modifiables depuis l'administration.
- Le rendu se met en pause hors écran et onglet masqué, limite le *pixel ratio*, libère toutes les ressources (géométries, matériaux, textures, renderer) au démontage.
- Désactivable : *Décor 3D > Océan 3D sur l'accueil*. Sans WebGL ou avec animations réduites, un dégradé ciel/mer en CSS prend le relais et l'image reste figée.
- Aucun défilement détourné : le scroll reste natif (Lenis volontairement non retenu, voir `docs/DECISIONS-TECHNIQUES.md`).

---

## 11. Commandes disponibles

| Commande | Effet |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` · `pnpm start` | Build de production · lancement (`node .output/server/index.mjs`) |
| `pnpm start:local` | Lancement en chargeant `.env` |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | ESLint · types · tests |
| `pnpm verify` | lint + types + tests + build |
| `pnpm check:env` | Contrôle de la configuration |
| `pnpm db:generate` · `pnpm db:migrate` | Migrations Drizzle |
| `pnpm admin:create` · `pnpm admin:reset-2fa` | Premier administrateur · secours 2FA |
| `pnpm db:seed:demo` · `pnpm db:purge:demo` | Données de démonstration |
| `pnpm db:purge:messages` | Suppression des messages au-delà de la durée de conservation |
| `pnpm icons:generate` | Régénère la bibliothèque d'icônes de technologies (`server/data/brand-icons.json`) |

---

## 12. Vérification et tests

Vérifications de cette version :

- `pnpm lint` : ESLint · `pnpm typecheck` : types Nuxt/Vue.
- `pnpm test` : tests unitaires et migrations réelles sur PGlite (contenu, permissions admin, sécurité, services, imports, schémas).
- `pnpm build` : build Nuxt/Nitro de production.
- Des bancs d’essai API et navigateur antérieurs sont décrits dans l’historique du projet ; ils ne remplacent pas la recette ci-dessous sur l’environnement final.

**À tester avant publication** : connexion à Neon, envoi d’images Cloudinary, livraison SMTP, WebGL sur appareils réels, et matrice des permissions avec plusieurs comptes. Ces intégrations ne peuvent pas être certifiées sans les comptes et secrets de production.

---

## 13. Déploiement

Le projet est un serveur Nuxt/Nitro standard.

1. Variables d'environnement du §4 sur l'hébergeur (Vercel, Netlify, Railway, Render, VPS…).
2. `pnpm install --frozen-lockfile && pnpm build`.
3. `pnpm db:migrate` (une fois, puis à chaque évolution du schéma).
4. Démarrage : `node .output/server/index.mjs` (ou le preset serverless de votre hébergeur ; Nitro en gère la plupart).
5. Définissez `NUXT_PUBLIC_SITE_URL` sur l'URL finale (Open Graph, sitemap, liens canoniques).
6. Créez l'administrateur depuis une machine ayant accès à la base : `pnpm admin:create`.

L'administration vit dans le même projet (routes, composants et services séparés) : elle peut être déplacée plus tard vers un sous-domaine.

---

## 14. Limites et opérations manuelles

- Premier essai réel de Neon, Cloudinary et SMTP : à faire chez vous (§12).
- Les textes de démonstration (nom « Votre Nom », projets « démo »…) sont des **exemples identifiables** : remplacez-les ou supprimez-les (`pnpm db:purge:demo`). Aucune information personnelle n'est inventée.
- Le texte de la page de confidentialité est un **modèle** : adaptez-le à votre situation.
- L'import de CV est approximatif par nature : relisez toujours.
- Le widget « Contact rapide » est désactivé par défaut ; c'est un formulaire asynchrone, pas un chat en temps réel.
- Changer `NUXT_SESSION_PASSWORD` invalide les secrets 2FA chiffrés avec l'ancienne valeur : utilisez `pnpm admin:reset-2fa` puis réactivez la 2FA.

---

## 15. Licences des composants

Code du projet : à votre convenance (aucune licence imposée). Composants tiers : Nuxt, Vue, Three.js, GSAP (licence « standard no-charge » de GreenSock), Drizzle, Zod, Tailwind, reka-ui, Lucide (ISC), polices Fraunces et Figtree via Fontsource (SIL OFL), icônes de marques **Simple Icons (CC0)** — les marques restent la propriété de leurs détenteurs. Aucun modèle 3D, texture ou son externe n'est utilisé : tout le décor est généré par le code. Détails dans `docs/DECISIONS-TECHNIQUES.md`.

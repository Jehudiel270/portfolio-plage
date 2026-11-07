# Décisions techniques

Pourquoi ces choix, et ce qui a été écarté. Les versions exactes sont dans `package.json` / `pnpm-lock.yaml`.

## Direction produit

La première version, spatiale (globe, portail, station, cristaux), a été jugée **peu professionnelle et illisible** (« salade de formes »). Elle a été abandonnée au profit d'un thème **plage** : sable, océan turquoise, corail. Principes : grille propre par défaut, 3D **optionnelle** et au service du contenu, menu court, responsive réel, rien qui déborde.

## Pile retenue

| Besoin | Choix | Raison |
|---|---|---|
| Framework | **Nuxt 4** (Nitro, SSR) | Imposé ; API serveur et pages dans un seul projet |
| Langage | TypeScript 6 strict, Vue 3 | Imposé |
| Styles / UI | **Tailwind 4**, shadcn-vue (reka-ui) | Imposé ; thème par variables CSS |
| Base | **Neon** + **Drizzle ORM** (pilote HTTP `@neondatabase/serverless`) | Imposé ; migrations SQL versionnées, aucune connexion depuis le navigateur |
| Images | **Cloudinary** (envoi signé) | Imposé ; le secret reste côté serveur |
| 3D | **Three.js** natif + GLSL | Un seul décor maîtrisé (océan) ; aucune dépendance supplémentaire |
| Animation | **GSAP + ScrollTrigger** | Relie le décor de l'accueil au défilement (progression du soleil et de la caméra) |
| E-mail | **Nodemailer** (SMTP) | Imposé ; secrets en variables d'environnement |
| Validation | **Zod** (schémas partagés client/serveur) | Une seule source de vérité des règles |
| Tests | **Vitest** + **PGlite** | Les migrations SQL réelles sont exécutées dans les tests |
| Gestionnaire | **pnpm** | Imposé, verrouillage complet |

## Choix écartés (et pourquoi)

- **Lenis** : le défilement natif est plus fiable, plus accessible et suffisant ; GSAP ScrollTrigger lit directement le scroll natif. Aucun détournement de la molette.
- **Post-processing (bloom), TresJS, COBE, CSS3DRenderer, three-trackball-controls** : inutiles pour un océan stylisé ; le coût en poids et en complexité n'apporte rien à la lisibilité.
- **Modèles/textures 3D externes** : aucun. Tout est procédural (shaders, primitives) → aucune licence à gérer, aucun fichier lourd, démarrage immédiat.
- **IA externe pour l'import de CV** : écartée (confidentialité, coût, dépendance). Analyse heuristique locale, relue par l'utilisateur.
- **Auth tierce (Supabase, Firebase…)** : écartée (imposé : Nuxt + Neon). Authentification maison, minimale et auditée par des tests.

## Données

- **14 tables** (`server/db/schema.ts`, migrations `drizzle/`). `categories` est une table à part (4 listes : compétences, projets, certifications, réalisations) ; les fiches stockent le **nom** de leur catégorie, ce qui rend l'import CSV et l'import de CV simples ; renommer une catégorie met à jour les fiches dans la même opération. Les deux tables supplémentaires gèrent les codes de récupération 2FA et le journal d’audit.
- **Icônes** : une valeur texte unique — `si:<slug>` (Simple Icons), `lucide:<Nom>`, ou URL d'image — validée côté serveur (liste fermée pour `lucide:`, `https` pour les images). Les chemins SVG des marques sont résolus **côté serveur** à partir de `server/data/brand-icons.json` (279 technologies, généré par `scripts/generate-icon-library.mjs` depuis le paquet `simple-icons`), de sorte que le navigateur n'embarque jamais la bibliothèque entière.
- **Ordre** : tri chronologique calculé côté serveur (le plus récent d'abord), indépendant de l'ordre de saisie ; réglage « manuel » disponible.
- **Réglages** : table `site_settings` à ligne unique, une colonne JSON par section (thème, contenu, navigation, affichage, parcours, contact, widget, libellés, SEO, confidentialité…), chacune validée par son schéma Zod. Un mécanisme de défauts garantit un site cohérent même si une section est vide.
- **Libellés** : 66 clés fermées (`shared/ui-labels.ts`) ; l'administration ne peut enregistrer que des clés connues.
- **Cache public** : court (20 s) et **invalidé à chaque enregistrement** d'administration.

## Sécurité

- Mots de passe : scrypt (N = 32768, r = 8, p = 1), sel aléatoire, comparaison en temps constant ; un faux hachage est calculé si l'e-mail est inconnu (pas de fuite par le temps de réponse).
- **TOTP RFC 6238** implémenté sans dépendance (vecteur de test officiel vérifié) ; secret chiffré AES-256-GCM avec une clé dérivée de `NUXT_SESSION_PASSWORD`.
- Anti-verrouillage : compteurs en base (`rate_limits`) par IP, par IP + e-mail et par compte ; **cookie d'appareil de confiance** signé qui exempte le propriétaire du plafond par compte.
- CSRF : jeton lié à la session + vérification de l'en-tête `Origin`.
- RBAC serveur par module : super administrateur, administrateur et éditeur ; permissions lecture/gestion filtrées à chaque requête, plus espace réservé à la gouvernance des comptes.
- TOTP obligatoire en production, réauthentification par mot de passe pour sa configuration, codes de récupération HMAC à usage unique ; sessions limitées à une heure d’inactivité et sept jours absolus.
- Journal d’actions admin sans secrets, conservé 365 jours ; changements de droits révoquant les sessions ciblées.
- Contact : champ piège, délai minimal de remplissage, limitation de fréquence, neutralisation des retours à la ligne dans les en-têtes, limites de longueur, modèles à variables fermées.
- Exports CSV : neutralisation des formules de tableur (`=`, `+`, `-`, `@`).

## Accessibilité

Focus clavier visible, lien d'évitement, onglets ARIA avec navigation aux flèches, dialogues natifs `<dialog>`, `prefers-reduced-motion`, contrastes vérifiés (la page *Apparence* affiche le ratio WCAG des couleurs choisies), liste textuelle accessible dans l'exploration 3D, aucune annonce vocale en boucle.

## Assets et licences

| Élément | Source | Licence |
|---|---|---|
| Icônes de technologies | paquet `simple-icons` | CC0 (les marques appartiennent à leurs propriétaires) |
| Icônes génériques | `lucide-vue-next` | ISC |
| Polices Fraunces, Figtree | `@fontsource-variable/*` | SIL OFL 1.1 |
| Décor 3D, image de partage par défaut, favicon | générés par le projet | libres |
| Modèles, textures, sons externes | **aucun** | — |

## Ce qui a été vérifié

Voir le §12 du `README.md` pour les commandes de validation. Les services de production (Neon, Cloudinary, SMTP), le parcours multi-compte et WebGL sur appareils réels doivent être vérifiés avec les comptes et appareils cibles.

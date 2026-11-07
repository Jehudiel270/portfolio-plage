# Revue du portfolio et plan d’évolution

## Avis général

Le projet dispose d’une identité visuelle cohérente, d’un socle Nuxt/TypeScript bien séparé et d’un back-office déjà complet. Le décor WebGL est facultatif et son repli CSS garde le contenu lisible. Les points forts sont la validation partagée Zod, les migrations testées avec PGlite, la séparation serveur/client des secrets, les contrôles d’accessibilité et les tests automatisés.

La principale amélioration produit est de faire des projets de vraies études de cas, partageables et indexables. La priorité de mise en production est de remplacer les données de démonstration et d’activer/configurer les services utilisés.

Le site n’était pas une SPA pure : c’était un portfolio à sections sur l’accueil, avec des pages Contact et Confidentialité. Il conserve maintenant un accueil condensé et propose des pages autonomes pour À propos, Projets, Compétences, Parcours et chaque projet.

## Changements réalisés

- Pages dédiées : `/a-propos`, `/projets`, `/projets/:slug`, `/competences`, `/parcours`. L’accueil présente un résumé et des liens vers ces pages.
- Les fiches projet ont des URL canoniques, des métadonnées dédiées, des données structurées `CreativeWork` et des entrées au sitemap. Les cartes de projet pointent vers leur étude de cas.
- Ajout du rôle `superadmin` et de la page `/admin/accounts` pour créer des comptes, assigner leurs rôles et limiter leurs accès par module.
- L’API vérifie les permissions par module et par méthode (lecture/écriture). Le menu d’administration ne montre que les espaces autorisés. Les réglages retournés à un compte délégué sont filtrés afin de ne pas exposer les paramètres privés d’autres espaces.
- Le compte indiqué par `NUXT_SUPERADMIN_OWNER_EMAIL` est le seul à pouvoir créer des comptes et nommer d'autres super administrateurs. Les autres super administrateurs peuvent gérer les accès existants, mais pas promouvoir un compte au rôle super-admin ni modifier/supprimer le propriétaire. Le dernier super administrateur ne peut être ni supprimé ni rétrogradé. Les changements de rôle/droits révoquent les sessions du compte concerné.
- Le premier compte créé avec `pnpm admin:create` devient super administrateur. La migration transforme également le compte admin historique le plus ancien en super administrateur et conserve ses droits existants.
- En production, la 2FA TOTP doit être activée avant toute utilisation du back-office. Configurer ou activer TOTP exige le mot de passe courant ; désactiver TOTP exige le mot de passe et un code valide.
- Dix codes de récupération aléatoires sont affichés une seule fois après l’activation. Seuls leurs HMAC sont stockés ; chaque code ne fonctionne qu’une fois.
- Les sessions expirent après une heure d’inactivité ou sept jours au total. Changer les droits d’un compte invalide ses sessions.
- Le journal ciblé enregistre les créations/suppressions de comptes, les changements d’accès, les connexions et les opérations de sécurité, sans enregistrer de secret. Il n’inclut pas encore chaque modification éditoriale ; les lignes sont conservées au plus 365 jours.
- L’administration utilise des disclosures natifs repliables pour les réglages détaillés. Le défilement garde ses comportements natifs, avec une barre personnalisée assortie au thème.

## Modèle de rôles et de permissions

| Rôle | Portée |
|---|---|
| Super administrateur | Accès total, comptes et permissions, consultation du journal. |
| Administrateur | Espaces sélectionnés par le super administrateur. |
| Éditeur | Espaces sélectionnés par le super administrateur ; pas d’accès à la gouvernance des comptes. |

Un espace non accordé est refusé côté serveur, même si quelqu’un appelle directement son endpoint. Chaque module autorisé a un niveau `Lecture` ou `Gestion` :

| Module | Couverture |
|---|---|
| Projets | Projets, import/export et actions en masse. |
| Compétences | Fiches et icônes de compétence. |
| Parcours | Expériences, formation, certifications, réalisations et import de CV. |
| Catégories | Catégories du contenu. |
| Profil et contenus | Textes du profil et liens sociaux. |
| Apparence | Thème et décor. |
| Affichage et navigation | Sections, onglets et menu. |
| Textes de l’interface | Libellés modifiables. |
| SEO et confidentialité | Indexation, image de partage et texte de confidentialité. |
| Canaux de contact | Formulaire, e-mail, WhatsApp et widget. |
| Messages reçus | Consultation et gestion des messages. |
| Sécurité du compte | Mot de passe, 2FA et sessions de son propre compte. |
| Médiathèque | Import et suppression de médias. |

Chaque compte non-super-admin conserve le module Sécurité en gestion pour pouvoir entretenir ses propres facteurs d’authentification. La création de comptes, y compris les super-admins, est réservée au compte désigné par `NUXT_SUPERADMIN_OWNER_EMAIL`. Les autres super-admins peuvent gérer les accès existants, mais ne peuvent pas promouvoir un compte au rôle super-admin ni modifier/supprimer le propriétaire.
La règle générale reste de 12 caractères minimum ; seul le propriétaire explicitement configuré peut utiliser 10 caractères minimum, sans motif prévisible et avec au moins deux catégories de caractères.

## Plan ordonné

### Phase 1 — Pages publiques et présentation

**Réalisée :** accueil résumé, pages éditoriales et études de cas projet, liens de navigation, métadonnées et sitemap.

**À faire avec le vrai contenu :** expliquer le contexte, le rôle personnel, les décisions techniques et les résultats de chaque projet ; ajouter des captures accessibles, des liens vérifiés et des résultats mesurables quand ils existent.

### Phase 2 — Gouvernance et protection de l’administration

**Réalisée :** super administrateur propriétaire, permissions par modules, autorisation côté API, création de comptes réservée au propriétaire, protection du dernier super-admin, revalidation pour les changements 2FA, codes de récupération, expiration de session et journal ciblé.

**Avant ouverture de comptes délégués :** créer des comptes de test, vérifier une permission lecture seule, une permission gestion, une révocation de session, une tentative d’accès direct refusée et la récupération d’un accès perdu.

### Phase 3 — Mise en production

1. Remplacer « Votre Nom », les textes d’exemple, les projets et images fictifs.
2. Configurer `DATABASE_URL`, un secret `NUXT_SESSION_PASSWORD` d’au moins 32 caractères, `NUXT_SUPERADMIN_OWNER_EMAIL`, l’URL publique et les intégrations réellement utilisées.
3. Appliquer les migrations, vérifier les sauvegardes/restaurations Neon, configurer `NUXT_SUPERADMIN_OWNER_EMAIL`, créer le super administrateur propriétaire et activer sa 2FA.
4. Conserver les codes de récupération dans un gestionnaire de mots de passe, jamais dans le dépôt ou une capture d’écran.
5. Tester en HTTPS le formulaire, la livraison SMTP, les téléversements Cloudinary, le contrôle d’accès, les sessions et le sitemap sur le domaine final.
6. Vérifier la page légale et les durées de conservation selon le pays et les services effectivement utilisés.

### Phase 4 — Qualité et évolutions

- Tester Chromium, Firefox et Safari, notamment la 3D avec et sans WebGL, le clavier, `prefers-reduced-motion` et les largeurs mobile/tablette/desktop.
- Continuer à surveiller les dépendances, les erreurs serveur, les quotas, les sauvegardes et les journaux d’authentification.
- Évaluer une politique CSP en mode `Report-Only` avant activation stricte ; ne pas la déployer sans tester les scripts/styles générés par Nuxt.
- Ajouter un historique/restauration éditoriale si le contenu change régulièrement ; ajouter les témoignages uniquement avec accord et références vérifiables.
- N’ajouter de l’analytique qu’en cas de besoin concret, avec une configuration respectueuse de la vie privée.
- Étudier les passkeys/WebAuthn après stabilisation du flux TOTP et de sa récupération.

## Vérifications faites et limites

Le dépôt contient des tests de services, schémas, sécurité et migrations. Les nouveaux téléversements Cloudinary utilisent `portfolio-plage/<type>` (dont `portfolio-plage/projects`) ; les anciens identifiants `portfolio/...` restent nettoyables. La 3D dépend de la disponibilité de WebGL ; le repli CSS est le comportement prévu si le contexte GPU n’est pas accessible. Les connexions Neon réelles, un vrai compte Cloudinary et un vrai serveur SMTP doivent encore être testés avec les identifiants de déploiement.

Le guide du projet liste des tests API et navigateur antérieurs ; ne pas confondre ces essais décrits avec une preuve de configuration des services de production. Relancer les commandes du README après chaque évolution.

<details>
<summary>FAQ repliable — décisions et exploitation</summary>

### Pourquoi garder un accueil ?

L’accueil devient une page de synthèse avec les liens vers le contenu détaillé. Cela conserve une entrée claire sans obliger les visiteurs à parcourir toutes les sections d’une longue page.

### La 2FA est-elle facultative ?

Elle peut être configurée dans l’environnement de développement. En production (`NODE_ENV=production`), le compte est redirigé vers sa configuration et l’API refuse les autres opérations tant que TOTP n’est pas actif.

### Que faire si le téléphone et les codes de secours sont perdus ?

La procédure de secours doit être exécutée par une personne ayant accès sécurisé au serveur et à la base. `pnpm admin:reset-2fa -- email@example.com` réinitialise TOTP pour un compte ; réactiver TOTP immédiatement après récupération.

### Les changements de droits prennent-ils effet tout de suite ?

Oui : le changement révoque les sessions de la personne concernée. Elle doit se reconnecter ; l’API réévalue ensuite ses permissions sur chaque requête.

### Les codes de récupération sont-ils enregistrés en clair ?

Non. Ils sont montrés une fois dans l’interface ; la base ne conserve que leurs HMAC et la date d’utilisation. Si les codes sont égarés, régénérer les codes en réinitialisant puis en réactivant la 2FA.

</details>

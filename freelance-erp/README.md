# FreelanceOS — ERP pour Agence de Freelances

ERP complet pour gérer une agence de consultants/freelances : authentification, gestion de projets, timesheets, facturation avec PDF, relances automatiques, et portail client.

## Stack

- **Framework** : Next.js 16 (App Router)
- **Base de données** : PostgreSQL (Vercel Postgres, Neon, Supabase, etc.)
- **ORM** : Prisma
- **Auth** : NextAuth (Credentials + bcryptjs)
- **PDF** : @react-pdf/renderer
- **UI** : Tailwind CSS + Recharts
- **Déploiement** : Vercel (avec Vercel Cron pour les relances automatiques)

## Fonctionnalités

### Site public
- Landing page de présentation (`/`)
- Inscription (`/register`) et connexion (`/login`)
- Portail client public par lien unique (`/portal/[token]`), sans mot de passe

### Application (après connexion)
- **Dashboard** — vue d'ensemble, stats, graphiques CA et heures
- **Consultants** — profils, compétences, TJM
- **Clients** — annuaire, CA par client, lien du portail client copiable
- **Projets** — régie ou forfait, statuts, rentabilité par projet
- **Timesheets** — saisie des heures par consultant/projet/mois
- **Factures** — création, PDF téléchargeable, suivi (brouillon → envoyée → payée → en retard)
- **Rentabilité** — TJM réel encaissé par projet, marge nette (facturé − coût consultants)

### Automatisations
- **Relances automatiques** — un cron quotidien (Vercel Cron, 8h) détecte les factures en retard et envoie des relances à 3 niveaux (rappel poli → relance ferme → mise en demeure). Relance manuelle possible depuis l'app.
- **PDF de factures** — génération à la volée, accessible depuis l'app et depuis le portail client.

## Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Renseigner DATABASE_URL (PostgreSQL), NEXTAUTH_SECRET, NEXTAUTH_URL

# 3. Créer le schéma en base
npx prisma db push

# 4. Charger les données de démo (consultants, clients, projets, + 1 compte de connexion)
npm run db:seed
# → Compte démo créé : demo@freelanceos.fr / demo1234

# 5. Lancer le serveur
npm run dev
```

## Déploiement sur Vercel

1. Créer une base PostgreSQL (**Storage → Create Database → Postgres** sur Vercel, ou Neon/Supabase)
2. Importer le projet sur [vercel.com](https://vercel.com)
3. Renseigner les variables d'environnement (voir ci-dessous)
4. Déployer — le script `build` exécute automatiquement `prisma generate && prisma db push && next build`

### Variables d'environnement requises

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=générer avec: openssl rand -base64 32
NEXTAUTH_URL=https://votre-domaine.vercel.app
CRON_SECRET=générer une chaîne aléatoire (sécurise l'endpoint de relances)
```

### Activer les relances automatiques

Le fichier `vercel.json` déclare déjà un cron quotidien à 8h appelant `/api/cron/reminders`. Vercel envoie automatiquement le header `Authorization: Bearer $CRON_SECRET` — assurez-vous que `CRON_SECRET` est bien défini dans les variables d'environnement du projet.

### Brancher un vrai envoi d'email pour les relances

Par défaut, les relances sont loguées en base (table `Reminder`) et affichées dans l'app, mais l'envoi d'email réel est un point d'extension à brancher : voir la fonction `sendReminderEmail` dans `app/api/cron/reminders/route.ts` et la logique équivalente dans `app/api/invoices/[id]/remind/route.ts`. Un fournisseur comme Resend ou SendGrid peut y être ajouté directement.

## Structure du projet

```
freelance-erp/
├── app/
│   ├── page.tsx                  # Landing page publique
│   ├── login/, register/         # Pages d'authentification
│   ├── portal/[token]/           # Portail client public
│   ├── (app)/                    # Espace connecté (protégé par middleware)
│   │   ├── layout.tsx            # Layout avec Sidebar
│   │   ├── dashboard/
│   │   ├── consultants/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── timesheets/
│   │   ├── invoices/
│   │   └── rentabilite/
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth
│       ├── register/             # Inscription
│       ├── cron/reminders/       # Relances automatiques (cron)
│       ├── portal/[token]/       # API du portail client
│       ├── invoices/[id]/pdf/    # Génération PDF facture
│       ├── invoices/[id]/remind/ # Relance manuelle
│       └── profitability/        # Calcul de rentabilité
├── components/
│   ├── Sidebar.tsx                # Navigation + compte connecté
│   ├── LandingNav.tsx
│   └── Providers.tsx              # SessionProvider NextAuth
├── lib/
│   ├── prisma.ts
│   ├── auth.ts                    # Config NextAuth
│   ├── validation.ts
│   └── InvoicePdf.tsx              # Composant PDF de facture
├── middleware.ts                  # Protection des routes /dashboard, /clients, etc.
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## Modèle de données (résumé)

- `User` — comptes de l'agence (authentification)
- `Consultant`, `Client`, `Project`, `Timesheet`, `Invoice`, `InvoiceItem` — cœur métier
- `Reminder` — historique des relances de factures
- `Client.portalToken` — identifiant unique permettant l'accès au portail client sans authentification classique

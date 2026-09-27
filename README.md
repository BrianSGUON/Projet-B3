# FreelanceOS

> ERP open-source pour agences de freelances et consultants — gérez vos consultants, projets, temps, factures et clients depuis une seule application.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## Aperçu

FreelanceOS couvre l'intégralité de la chaîne de valeur d'une agence :

| Module | Description |
|---|---|
| 🏠 **Landing page** | Page de présentation publique avec inscription et connexion |
| 📊 **Dashboard** | Vue d'ensemble : CA, heures, factures, projets actifs |
| 👥 **Consultants** | Profils, compétences, TJM, total d'heures loguées |
| 🏢 **Clients** | Annuaire, CA par client, lien vers le portail client |
| 📁 **Projets** | Régie ou forfait, statuts, rentabilité estimée par projet |
| ⏱ **Timesheets** | Saisie des heures par consultant, par projet, par mois |
| 🧾 **Factures** | Création, PDF téléchargeable, workflow brouillon → payée |
| 📈 **Rentabilité** | TJM réel encaissé, marge nette, coût consultants |
| 🌐 **Portail client** | Espace public par lien unique — factures, PDF, projets |

---

## Stack technique

- **Framework** — Next.js 16 (App Router, SSR, API Routes)
- **Langage** — TypeScript
- **Base de données** — PostgreSQL
- **ORM** — Prisma 5
- **Authentification** — NextAuth v4 (Credentials + JWT + bcryptjs)
- **UI** — Tailwind CSS v4 + Recharts
- **PDF** — @react-pdf/renderer (côté serveur, compatible Vercel)
- **Déploiement** — Vercel + Vercel Postgres + Vercel Cron

---

## Fonctionnalités clés

### 📊 Calcul du TJM réel
Calcul automatique de la rentabilité par mission : temps passé × TJM du consultant = coût réel. La marge nette s'affiche directement sur chaque projet.

### 📄 Génération de factures PDF
Les factures sont générées à la volée côté serveur (sans Puppeteer, compatible serverless). Téléchargeables depuis l'app et depuis le portail client.

### 🔔 Relances automatiques
Un Vercel Cron s'exécute chaque jour à 8h et détecte les factures impayées. 3 niveaux de relance automatique (rappel poli → relance ferme → mise en demeure), avec historique par facture et bouton de relance manuelle.

### 🌐 Portail client
Chaque client dispose d'un lien unique (`/portal/[token]`) sans mot de passe. Il peut consulter ses factures, télécharger les PDF et suivre l'avancement de ses projets.

---

## Démarrage rapide

### Prérequis

- Node.js 18+
- Une base de données PostgreSQL (locale ou hébergée)

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-pseudo/freelanceos.git
cd freelanceos

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Renseigner les variables dans .env

# 4. Créer le schéma en base
npx prisma db push

# 5. Charger les données de démo (optionnel)
npm run db:seed

# 6. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

> **Compte démo** (après `db:seed`) : `demo@freelanceos.fr` / `demo1234`

---

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner les valeurs :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth — générer avec : openssl rand -base64 32
NEXTAUTH_SECRET="votre-clé-secrète-minimum-32-caractères"
NEXTAUTH_URL="http://localhost:3000"

# Cron — sécurise l'endpoint de relances automatiques
CRON_SECRET="votre-clé-cron-aléatoire"
```

---

## Déploiement sur Vercel

1. **Créer une base PostgreSQL** — via Vercel Postgres, [Neon](https://neon.tech) ou [Supabase](https://supabase.com)
2. **Importer le projet** sur [vercel.com](https://vercel.com) depuis GitHub
3. **Renseigner les variables d'environnement** dans les réglages du projet
4. **Déployer** — le script de build s'occupe de tout :

```bash
prisma generate && prisma db push --accept-data-loss && next build
```

Le fichier `vercel.json` configure automatiquement le cron de relances (8h chaque jour).

### Activer l'envoi d'email pour les relances

Par défaut, les relances sont enregistrées en base et visibles dans l'app. Pour activer l'envoi réel, brancher un fournisseur email dans `app/api/cron/reminders/route.ts` (la fonction `sendReminderEmail` est prête) :

- [Resend](https://resend.com) — recommandé
- [SendGrid](https://sendgrid.com)
- Tout provider SMTP

---

## Structure du projet

```
freelanceos/
├── app/
│   ├── page.tsx                        # Landing page publique
│   ├── login/                          # Page de connexion
│   ├── register/                       # Page d'inscription
│   ├── portal/[token]/                 # Portail client public
│   ├── (app)/                          # Espace connecté (protégé)
│   │   ├── layout.tsx                  # Layout avec Sidebar
│   │   ├── dashboard/
│   │   ├── consultants/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── timesheets/
│   │   ├── invoices/
│   │   └── rentabilite/
│   └── api/
│       ├── auth/[...nextauth]/         # NextAuth
│       ├── register/                   # Inscription
│       ├── cron/reminders/             # Relances automatiques (cron)
│       ├── portal/[token]/             # API portail client
│       ├── invoices/[id]/pdf/          # Génération PDF
│       ├── invoices/[id]/remind/       # Relance manuelle
│       └── profitability/              # Calcul de rentabilité
├── components/
│   ├── Sidebar.tsx                     # Navigation + compte connecté
│   ├── LandingNav.tsx                  # Navigation landing page
│   └── Providers.tsx                   # SessionProvider NextAuth
├── lib/
│   ├── prisma.ts                       # Client Prisma singleton
│   ├── auth.ts                         # Configuration NextAuth
│   ├── validation.ts                   # Validation email
│   └── InvoicePdf.tsx                  # Composant PDF facture
├── proxy.ts                            # Protection des routes (JWT)
├── prisma/
│   ├── schema.prisma                   # Schéma base de données
│   └── seed.ts                         # Données de démo
└── vercel.json                         # Config déploiement + cron
```

---

## Schéma de données

```
User          → comptes de l'agence (auth)
Consultant    → profils freelances (TJM, compétences)
Client        → clients de l'agence (portalToken unique)
Project       → projets (régie ou forfait)
Timesheet     → saisies d'heures par consultant/projet
Invoice       → factures avec statut et TVA
InvoiceItem   → lignes de facturation
Reminder      → historique des relances par facture
```

---

## Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Démarrer en production

npm run db:push      # Synchroniser le schéma avec la base
npm run db:seed      # Charger les données de démo
npm run db:studio    # Ouvrir Prisma Studio (interface visuelle DB)
npm run db:generate  # Régénérer le client Prisma
```

import Link from 'next/link'
import LandingNav from '@/components/LandingNav'
import {
  ArrowRight, Users, Clock, FileText, TrendingUp, Bell, Globe,
  CheckCircle2, Calculator, Send, Sparkles,
} from 'lucide-react'

const FAKE_COMPANIES = [
  { name: 'Northwind Studio', letter: 'N', color: 'bg-blue-500' },
  { name: 'Atelier Lumen', letter: 'L', color: 'bg-amber-500' },
  { name: 'Cobalt Digital', letter: 'C', color: 'bg-cyan-500' },
  { name: 'Maison Pixel', letter: 'P', color: 'bg-pink-500' },
  { name: 'ForgeTech', letter: 'F', color: 'bg-emerald-500' },
  { name: 'Studio Méridien', letter: 'M', color: 'bg-violet-500' },
]

const FEATURES = [
  {
    icon: Calculator,
    title: 'TJM réel & rentabilité',
    description: 'Calcul automatique de votre taux journalier réellement encaissé par mission : temps passé, facturé, marge — en un coup d\u2019œil.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: FileText,
    title: 'Devis & factures en PDF',
    description: 'Générez des devis et factures professionnels en PDF, prêts à envoyer, avec votre identité visuelle et un suivi des paiements.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Bell,
    title: 'Relances automatiques',
    description: 'Une facture impayée après 15 jours ? FreelanceOS relance automatiquement votre client par email, sans que vous ayez à y penser.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Globe,
    title: 'Portail client',
    description: 'Vos clients consultent leurs factures, suivent l\u2019avancement du projet et téléchargent leurs documents depuis un espace dédié.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Gestion des consultants',
    description: 'Profils, compétences, TJM et disponibilités de toute votre équipe de freelances centralisés au même endroit.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Clock,
    title: 'Timesheets simplifiés',
    description: 'Saisie du temps passé par projet et par consultant, avec récap mensuel automatique pour la facturation.',
    color: 'bg-cyan-100 text-cyan-600',
  },
]

const STATS = [
  { value: '2 400+', label: 'Agences utilisatrices' },
  { value: '18 M€', label: 'Facturé via la plateforme' },
  { value: '96%', label: 'Factures payées à temps' },
  { value: '4,8/5', label: 'Note moyenne clients' },
]

export default function LandingPage() {
  return (
    <div className="bg-white">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles size={13} /> Nouveau : relances automatiques de factures
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight max-w-3xl mx-auto">
          L&apos;ERP pensé pour les agences de freelances
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mt-5">
          Consultants, projets, temps passé, devis et factures : pilotez toute votre activité freelance depuis un seul endroit.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link href="/register" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors">
            Démarrer gratuitement <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl font-medium text-sm border border-gray-200">
            Se connecter
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Essai gratuit de 14 jours · Sans carte bancaire</p>
      </section>

      {/* Logos fictifs */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-wide mb-6">
          Utilisé par des agences comme
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {FAKE_COMPANIES.map(c => (
            <div key={c.name} className="flex items-center gap-2 opacity-70">
              <div className={`w-7 h-7 rounded-lg ${c.color} flex items-center justify-center text-white text-xs font-bold`}>
                {c.letter}
              </div>
              <span className="text-sm font-semibold text-gray-600">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview mockup */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="card p-2 sm:p-4 shadow-2xl shadow-violet-100">
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-bold text-gray-900">Dashboard — Studio Méridien</div>
                <div className="text-xs text-gray-400">Vue d&apos;ensemble de l&apos;agence</div>
              </div>
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Consultants', value: '14' },
                { label: 'Projets actifs', value: '23' },
                { label: 'CA ce mois', value: '47 800 €' },
                { label: 'Factures en attente', value: '6' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                  <div className="text-lg font-bold text-gray-900">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Tout ce qu&apos;il faut pour piloter votre agence</h2>
          <p className="text-gray-500 mt-3">De la mission à l&apos;encaissement, sans jongler entre dix outils.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6">
              <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TJM example */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="card p-6 sm:p-10 bg-gradient-to-br from-violet-50 to-white">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-violet-600" />
            <span className="text-sm font-semibold text-violet-600 uppercase tracking-wide">Rentabilité en un clic</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Exemple sur la mission &laquo; Refonte Northwind &raquo;</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'TJM', value: '450 €' },
              { label: 'Temps passé', value: '12 j' },
              { label: 'Facturé', value: '5 400 €' },
              { label: 'Marge nette', value: '+1 150 €', highlight: true },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 border ${s.highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}>
                <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                <div className={`text-lg font-bold ${s.highlight ? 'text-emerald-700' : 'text-gray-900'}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Relance automatique mockup */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Send size={13} /> Relances automatiques
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Ne courez plus après vos paiements</h3>
            <p className="text-gray-500 leading-relaxed">
              Facture impayée depuis 15 jours ? FreelanceOS envoie automatiquement un rappel poli à votre client, puis une relance plus ferme si besoin. Vous gardez le contrôle total sur le ton et la fréquence.
            </p>
          </div>
          <div className="card p-5 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">INV-2026-014</span>
              <span className="badge bg-red-100 text-red-700">En retard</span>
            </div>
            <div className="text-xs text-gray-400 mb-4">Cobalt Digital · échue depuis 15 jours</div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 text-xs text-gray-500">
              <div className="flex items-center gap-2 text-orange-600 font-medium mb-1">
                <Bell size={13} /> Relance envoyée automatiquement
              </div>
              &laquo; Bonjour, nous vous rappelons que la facture INV-2026-014 d&apos;un montant de 3 200 € est en attente de paiement... &raquo;
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Un tarif simple, sans surprise</h2>
          <p className="text-gray-500 mt-3">Toutes les fonctionnalités incluses, dès le premier jour.</p>
        </div>

        <div className="card p-8 sm:p-10 border-2 border-violet-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
            Le plus populaire
          </div>
          <div className="text-center mb-8">
            <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-2">Plan Pro</div>
            <div className="flex items-end justify-center gap-1">
              <span className="text-5xl font-extrabold text-gray-900">20€</span>
              <span className="text-gray-400 pb-2">/ mois</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">Facturé mensuellement, sans engagement</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              'Consultants & clients illimités',
              'Projets & timesheets illimités',
              'Devis et factures en PDF',
              'Relances automatiques de factures',
              'Portail client inclus',
              'Calcul de rentabilité par mission',
              'Tableaux de bord en temps réel',
              'Support par email prioritaire',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <Link
            href="/register"
            className="block text-center bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-medium text-sm transition-colors"
          >
            Démarrer mon essai gratuit
          </Link>
          <p className="text-center text-xs text-gray-400 mt-3">14 jours gratuits, puis 20€/mois. Annulable à tout moment.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Users size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">FreelanceOS</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 FreelanceOS. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}

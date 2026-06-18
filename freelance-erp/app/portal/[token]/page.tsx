'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Briefcase, FileText, Download, Users, Calendar, AlertCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  SENT: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Payée', color: 'bg-emerald-100 text-emerald-700' },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700' },
}

const PROJECT_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'En cours', color: 'bg-emerald-100 text-emerald-700' },
  PAUSED: { label: 'En pause', color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Terminé', color: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
}

type PortalData = {
  client: { name: string; company?: string; email: string }
  projects: { id: string; name: string; description?: string; status: string; startDate: string; endDate?: string; totalHours: number; team: { name: string; role: string }[] }[]
  invoices: { id: string; number: string; status: string; amount: number; tax: number; dueDate: string; issuedDate: string; items: { description: string; quantity: number; unitPrice: number }[] }[]
}

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then(async r => {
        if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? 'Erreur') }
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Chargement…</div>
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error || 'Lien invalide'}</p>
          <p className="text-sm text-gray-400 mt-1">Contactez votre agence pour obtenir un nouveau lien.</p>
        </div>
      </div>
    )
  }

  const totalPaid = data.invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount * (1 + i.tax / 100), 0)
  const totalDue = data.invoices.filter(i => i.status !== 'PAID' && i.status !== 'DRAFT').reduce((s, i) => s + i.amount * (1 + i.tax / 100), 0)

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">Espace client</div>
            <div className="text-xs text-gray-400">{data.client.company ?? data.client.name}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="text-sm text-gray-500 mb-1">Total réglé</div>
            <div className="text-2xl font-bold text-emerald-600">{totalPaid.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500 mb-1">En attente de paiement</div>
            <div className="text-2xl font-bold text-orange-600">{totalDue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
          </div>
        </div>

        {/* Projects */}
        <section>
          <h2 className="font-semibold text-gray-900 mb-4">Vos projets</h2>
          <div className="space-y-3">
            {data.projects.map(p => {
              const st = PROJECT_STATUS[p.status]
              return (
                <div key={p.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <span className={`badge ${st?.color}`}>{st?.label}</span>
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mb-3">{p.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <div className="flex items-center gap-1"><Calendar size={12} /> Démarré le {format(new Date(p.startDate), 'dd MMM yyyy', { locale: fr })}</div>
                    <div className="flex items-center gap-1"><Users size={12} /> {p.team.map(t => t.name).join(', ') || 'Équipe non assignée'}</div>
                  </div>
                </div>
              )
            })}
            {!data.projects.length && <p className="text-sm text-gray-400">Aucun projet pour le moment.</p>}
          </div>
        </section>

        {/* Invoices */}
        <section>
          <h2 className="font-semibold text-gray-900 mb-4">Vos factures</h2>
          <div className="card overflow-hidden">
            {data.invoices.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Aucune facture pour le moment.</div>
            ) : data.invoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{inv.number}</span>
                    <span className={`badge ${STATUS_CONFIG[inv.status]?.color} text-xs`}>{STATUS_CONFIG[inv.status]?.label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Échéance {format(new Date(inv.dueDate), 'dd MMM yyyy', { locale: fr })}</div>
                </div>
                <div className="font-bold text-gray-900 text-sm whitespace-nowrap">
                  {(inv.amount * (1 + inv.tax / 100)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </div>
                <a
                  href={`/api/portal/${token}/invoices/${inv.id}/pdf`}
                  className="p-2 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 shrink-0"
                  title="Télécharger le PDF"
                >
                  <Download size={16} />
                </a>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 pt-4">Espace sécurisé généré par FreelanceOS</p>
      </main>
    </div>
  )
}

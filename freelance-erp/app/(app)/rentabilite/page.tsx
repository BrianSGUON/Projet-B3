'use client'
import { useEffect, useState } from 'react'
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react'

type ProfitRow = {
  id: string
  name: string
  client: string
  status: string
  totalHours: number
  totalDays: number
  invoiced: number
  cost: number
  margin: number
  realDailyRate: number
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif', PAUSED: 'En pause', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
}

export default function ProfitabilityPage() {
  const [rows, setRows] = useState<ProfitRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profitability').then(r => r.json()).then(setRows).finally(() => setLoading(false))
  }, [])

  const totals = rows.reduce(
    (acc, r) => ({ invoiced: acc.invoiced + r.invoiced, cost: acc.cost + r.cost, margin: acc.margin + r.margin }),
    { invoiced: 0, cost: 0, margin: 0 }
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator size={22} className="text-violet-600" /> Rentabilité réelle
        </h1>
        <p className="text-gray-500 mt-1 text-sm">TJM réellement encaissé, par projet, basé sur le temps facturé et le coût des consultants.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-1">Total facturé</div>
          <div className="text-2xl font-bold text-gray-900">{totals.invoiced.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-1">Coût consultants estimé</div>
          <div className="text-2xl font-bold text-gray-900">{totals.cost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
        </div>
        <div className={`card p-5 ${totals.margin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div className="text-sm text-gray-500 mb-1">Marge nette</div>
          <div className={`text-2xl font-bold ${totals.margin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {totals.margin >= 0 ? '+' : ''}{totals.margin.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm animate-pulse">Calcul en cours…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune donnée pour le moment.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Projet', 'Client', 'Jours', 'Facturé', 'Coût', 'TJM réel', 'Marge'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-gray-800">{r.name}</div>
                    <div className="text-xs text-gray-400">{STATUS_LABEL[r.status]}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.client}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.totalDays}j</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{r.invoiced.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.cost.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.realDailyRate.toLocaleString('fr-FR')} €/j</td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1 text-sm font-bold ${r.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.margin >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {r.margin >= 0 ? '+' : ''}{r.margin.toLocaleString('fr-FR')} €
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { Users, Briefcase, Clock, TrendingUp, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#7c3aed', PAUSED: '#f59e0b', COMPLETED: '#10b981', CANCELLED: '#ef4444',
}
const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  SENT: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Payée', color: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700' },
}

export default function Dashboard() {
  const [data, setData] = useState<{
    stats?: { totalConsultants: number; totalClients: number; activeProjects: number; totalRevenue: number; monthlyHours: number; lastMonthHours: number }
    recentInvoices?: Array<{ id: string; number: string; amount: number; status: string; client: { name: string; company?: string } }>
    projectsByStatus?: Array<{ status: string; _count: number }>
    consultantHours?: Array<{ name: string; hours: number; role: string }>
    revenueByMonth?: Array<{ month: string; revenue: number }>
  }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  const stats = data.stats
  const hoursChange = stats && stats.lastMonthHours > 0
    ? ((stats.monthlyHours - stats.lastMonthHours) / stats.lastMonthHours * 100).toFixed(0)
    : null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Vue d&apos;ensemble de votre agence</p>
      </div>

      {/* Stats — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
        {[
          { label: 'Consultants', value: stats?.totalConsultants ?? '—', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Clients', value: stats?.totalClients ?? '—', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Projets actifs', value: stats?.activeProjects ?? '—', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'CA encaissé', value: stats ? `${stats.totalRevenue.toLocaleString('fr-FR')} €` : '—', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-gray-500">{label}</span>
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {loading ? <span className="animate-pulse">…</span> : value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts — stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Heures ce mois</h2>
              <p className="text-xs text-gray-400">Par consultant</p>
            </div>
            {hoursChange !== null && (
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                {Number(hoursChange) >= 0
                  ? <><ArrowUpRight size={14} className="text-emerald-500" /><span className="text-emerald-600">+{hoursChange}%</span></>
                  : <><ArrowDownRight size={14} className="text-red-500" /><span className="text-red-600">{hoursChange}%</span></>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-violet-500" />
            <span className="text-2xl sm:text-3xl font-bold">{stats?.monthlyHours ?? 0}</span>
            <span className="text-gray-400 text-sm">heures</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.consultantHours || []}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${Number(v)}h`, 'Heures']} />
              <Bar dataKey="hours" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">CA 6 derniers mois</h2>
            <p className="text-xs text-gray-400">Factures envoyées & payées</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.revenueByMonth || []}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} €`, 'CA']} />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom — stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="card p-4 sm:p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Dernières factures</h2>
          <div className="space-y-2">
            {data.recentInvoices?.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                    {inv.client.company?.[0] ?? inv.client.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{inv.number}</div>
                    <div className="text-xs text-gray-400 truncate">{inv.client.company ?? inv.client.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${INVOICE_STATUS[inv.status]?.color} hidden sm:inline-flex`}>{INVOICE_STATUS[inv.status]?.label}</span>
                  <span className="text-sm font-bold">{inv.amount.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            ))}
            {!data.recentInvoices?.length && <p className="text-sm text-gray-400">Aucune facture</p>}
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Projets par statut</h2>
          {data.projectsByStatus?.length ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.projectsByStatus} dataKey="_count" nameKey="status" cx="50%" cy="50%" outerRadius={55}>
                    {data.projectsByStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.projectsByStatus.map(entry => (
                  <div key={entry.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[entry.status] }} />
                      <span className="text-gray-600 text-xs">{entry.status}</span>
                    </div>
                    <span className="font-semibold text-sm">{entry._count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-gray-400">Aucun projet</p>}
        </div>
      </div>
    </div>
  )
}
